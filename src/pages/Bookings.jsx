import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { PageHeading, SearchBox, BookingTable } from "../components/Shared.jsx";
import {
  today,
  dateLabel,
  timeLabel,
  customerFor,
  statusLabels,
  money,
} from "../utils.js";

export default function Bookings({ data, onBook, onView, queue = false }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState(queue ? today() : "");
  const [page, setPage] = useState(1);
  const search = query.toLowerCase().trim();
  const filtered = data.bookings
    .filter((booking) => {
      const customer = customerFor(data.customers, booking);
      return (
        (!date || booking.date === date) &&
        (status === "all" || booking.status === status) &&
        `${customer?.name} ${customer?.phone} ${booking.vehicleNumber} ${booking.vehicle} ${booking.reference}`
          .toLowerCase()
          .includes(search)
      );
    })
    .sort(
      (a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time),
    );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pageCount);
  const upcoming = data.bookings.filter(
    (booking) => booking.date === today() && booking.status === "scheduled",
  ).length;
  return (
    <>
      <PageHeading
        eyebrow={queue ? "KEEP THINGS MOVING" : "PLAN A LITTLE. SHINE A LOT."}
        title={queue ? "Wash queue" : "Bookings"}
        description={
          queue
            ? "Follow each car from arrival to its fresh finish."
            : "Every appointment, every vehicle, all in one place."
        }
      >
        <button className="button primary" onClick={onBook}>
          <Icon name="plus" size={18} />
          New booking
        </button>
      </PageHeading>
      {queue && (
        <div className="banner-note">
          <Icon name="waves" size={23} />
          <div>
            <strong>{upcoming} washes waiting today</strong>
            <p>
              Open a wash card to start the wash, mark it complete, or record a
              payment.
            </p>
          </div>
        </div>
      )}
      <section className={queue ? "" : "panel"}>
        <div className="toolbar">
          <SearchBox
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search customer, vehicle or booking…"
          />
          <div className="filter-group">
            <label className="sr-only" htmlFor="booking-date">
              Filter by date
            </label>
            <input
              id="booking-date"
              className="input filter-select"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPage(1);
              }}
            />
            <button
              className="button secondary small"
              onClick={() => {
                setDate(date === today() ? "" : today());
                setPage(1);
              }}
            >
              {date === today() ? "All dates" : "Today"}
            </button>
          </div>
        </div>
        {!queue && (
          <div className="tabs" role="group" aria-label="Filter booking status">
            {["all", "scheduled", "in-progress", "completed", "cancelled"].map(
              (key) => (
                <button
                  className={`tab ${status === key ? "active" : ""}`}
                  key={key}
                  onClick={() => {
                    setStatus(key);
                    setPage(1);
                  }}
                >
                  {key === "all" ? "All bookings" : statusLabels[key]}
                </button>
              ),
            )}
          </div>
        )}
        {queue ? (
          <div className="queue-grid">
            {["scheduled", "in-progress", "completed"].map((key) => {
              const records = filtered.filter(
                (booking) => booking.status === key,
              );
              return (
                <section className={`queue-column ${key}`} key={key}>
                  <div className="queue-heading">
                    <h2>
                      <span className={`queue-dot ${key}`} />
                      {key === "scheduled" ? "Waiting" : statusLabels[key]}
                    </h2>
                    <span className="queue-count">{records.length}</span>
                  </div>
                  <div className="queue-cards">
                    {records.length ? (
                      records.map((booking) => (
                        <button
                          className="wash-card"
                          key={booking.id}
                          onClick={() => onView(booking)}
                        >
                          <div className="wash-card-top">
                            <span className="wash-reference">
                              {booking.reference}
                            </span>
                            <Icon name="next" size={17} />
                          </div>
                          <div className="wash-car-icon">
                            <Icon name="car" size={27} />
                          </div>
                          <h3 className="wash-vehicle">{booking.vehicle}</h3>
                          <span className="plate">{booking.vehicleNumber}</span>
                          <p className="wash-service">{booking.serviceName}</p>
                          <div className="wash-meta">
                            <span>
                              <Icon name="customers" size={14} />
                              {customerFor(data.customers, booking)?.name}
                            </span>
                            <span>
                              <Icon name="clock" size={14} />
                              {timeLabel(booking.time)} · {booking.duration} min
                            </span>
                          </div>
                          <div className="wash-footer">
                            <strong>{money(booking.price)}</strong>
                            <span
                              className={`status-badge ${booking.paymentStatus}`}
                            >
                              {statusLabels[booking.paymentStatus]}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="queue-empty">
                        <Icon
                          name={key === "completed" ? "success" : "car"}
                          size={27}
                        />
                        <p>
                          {key === "scheduled"
                            ? "No cars waiting"
                            : key === "in-progress"
                              ? "No washes in progress"
                              : "No completed washes yet"}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <>
            <BookingTable
              bookings={filtered.slice((currentPage - 1) * 8, currentPage * 8)}
              customers={data.customers}
              onView={onView}
            />
            <div className="pagination">
              <span className="range-label">
                {filtered.length
                  ? `${(currentPage - 1) * 8 + 1}–${Math.min(currentPage * 8, filtered.length)} of ${filtered.length} bookings`
                  : "0 bookings"}
              </span>
              <div className="filter-group">
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <Icon name="previous" size={17} />
                </button>
                <span>
                  {currentPage} / {pageCount}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <Icon name="next" size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
