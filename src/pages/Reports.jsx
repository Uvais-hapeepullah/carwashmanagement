import { useState } from "react";
import Icon from "../components/Icon.jsx";
import {
  PageHeading,
  Stat,
  BookingTable,
  RevenueChart,
} from "../components/Shared.jsx";
import {
  lastDays,
  today,
  money,
  downloadCsv,
  customerFor,
  statusLabels,
} from "../utils.js";

export default function Reports({ data, onView }) {
  const [from, setFrom] = useState(lastDays(7)[0]);
  const [to, setTo] = useState(today());
  const invalid = from && to && from > to;
  const records = invalid
    ? []
    : data.bookings
        .filter(
          (booking) =>
            (!from || booking.date >= from) && (!to || booking.date <= to),
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || a.time.localeCompare(b.time),
        );
  const completed = records.filter((booking) => booking.status === "completed");
  const paid = records.filter(
    (booking) =>
      booking.paymentStatus === "paid" && booking.status !== "cancelled",
  );
  const total = paid.reduce((sum, booking) => sum + booking.price, 0);
  const unpaid = records
    .filter(
      (booking) =>
        booking.paymentStatus === "unpaid" && booking.status !== "cancelled",
    )
    .reduce((sum, booking) => sum + booking.price, 0);
  function exportReport() {
    const rows = [
      [
        "Booking",
        "Customer",
        "Phone",
        "Vehicle",
        "Registration",
        "Service",
        "Date",
        "Time",
        "Status",
        "Payment status",
        "Payment method",
        "Amount (INR)",
      ],
      ...records.map((booking) => {
        const customer = customerFor(data.customers, booking);
        return [
          booking.reference,
          customer?.name,
          customer?.phone,
          booking.vehicle,
          booking.vehicleNumber,
          booking.serviceName,
          booking.date,
          booking.time,
          statusLabels[booking.status],
          statusLabels[booking.paymentStatus],
          booking.paymentStatus === "paid" ? booking.paymentMethod : "",
          booking.price,
        ];
      }),
    ];
    downloadCsv(rows, `washwise-report-${from || "all"}-to-${to || "all"}.csv`);
  }
  return (
    <>
      <PageHeading
        eyebrow="SEE THE BIGGER PICTURE"
        title="Reports & collection"
        description="Understand your business, one wash at a time."
      >
        <button
          className="button primary"
          onClick={exportReport}
          disabled={!records.length || invalid}
        >
          <Icon name="download" size={18} />
          Export CSV
        </button>
      </PageHeading>
      <div className="panel report-period">
        <div>
          <h2 className="panel-title">Choose your period</h2>
          <p className="panel-description">
            Amounts are grouped by the booking date.
          </p>
        </div>
        <div className="filter-group">
          <label className="field">
            <span className="field-label">From</span>
            <input
              className="input"
              aria-label="Report start date"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <span className="text-muted">—</span>
          <label className="field">
            <span className="field-label">To</span>
            <input
              className="input"
              aria-label="Report end date"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
      </div>
      {invalid && (
        <div className="form-error" role="alert">
          The start date must be on or before the end date.
        </div>
      )}
      <div className="stats-grid section-gap">
        <Stat
          icon="rupee"
          label="Total collected"
          value={money(total)}
          detail={`${paid.length} paid bookings`}
        />
        <Stat
          icon="wallet"
          label="Outstanding"
          value={money(unpaid)}
          detail="Unpaid, non-cancelled bookings"
          color="orange"
        />
        <Stat
          icon="success"
          label="Completed washes"
          value={completed.length}
          detail={`${records.length} total bookings in period`}
          color="blue"
        />
        <Stat
          icon="reports"
          label="Average paid booking"
          value={money(paid.length ? total / paid.length : 0)}
          detail="Collected ÷ paid bookings"
          color="purple"
        />
      </div>
      <div className="dashboard-grid section-gap">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Last 7 days</h2>
              <p className="panel-description">
                Collection by booking date · independent of filters
              </p>
            </div>
          </div>
          <RevenueChart bookings={data.bookings} days={lastDays(7)} />
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Payment breakdown</h2>
              <p className="panel-description">For your selected period</p>
            </div>
          </div>
          <div className="payment-breakdown">
            {["Cash", "UPI", "Card"].map((method) => {
              const matches = paid.filter(
                (booking) => booking.paymentMethod === method,
              );
              return (
                <div className="payment-row" key={method}>
                  <span className="payment-method-icon">
                    <Icon
                      name={
                        method === "Cash"
                          ? "cash"
                          : method === "Card"
                            ? "card"
                            : "phone"
                      }
                    />
                  </span>
                  <div>
                    <strong>{method}</strong>
                    <p className="cell-subtitle">{matches.length} payments</p>
                  </div>
                  <strong>
                    {money(
                      matches.reduce((sum, booking) => sum + booking.price, 0),
                    )}
                  </strong>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <section className="panel section-gap">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Booking register</h2>
            <p className="panel-description">
              {records.length} records for your selected period
            </p>
          </div>
        </div>
        <BookingTable
          bookings={records}
          customers={data.customers}
          onView={onView}
        />
      </section>
    </>
  );
}
