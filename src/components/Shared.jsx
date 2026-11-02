import Icon from "./Icon.jsx";
import {
  statusLabels,
  money,
  customerFor,
  initials,
  dateLabel,
  timeLabel,
} from "../utils.js";

export function Badge({ status }) {
  return (
    <span className={`status-badge ${status}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export function Empty({
  title = "Nothing here yet",
  description = "Your records will appear here.",
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="car" size={30} />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {action}
    </div>
  );
}

export function PageHeading({
  eyebrow = "YOUR WORKSPACE",
  title,
  description,
  children,
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}

export function Stat({ icon, label, value, detail, color = "teal" }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${color}`}>
          <Icon name={icon} size={21} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="search-box">
      <Icon name="search" size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <Icon name="close" size={15} />
        </button>
      )}
    </div>
  );
}

export function BookingTable({ bookings, customers, onView, compact = false }) {
  if (!bookings.length)
    return (
      <Empty
        title="No bookings found"
        description="Try a different filter, or add a new booking to get started."
      />
    );
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Customer / Vehicle</th>
            <th>Service</th>
            <th>{compact ? "Time" : "Date & time"}</th>
            <th>Status</th>
            {!compact && <th>Payment</th>}
            <th className="amount">Amount</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const customer = customerFor(customers, booking);
            return (
              <tr key={booking.id}>
                <td>
                  <div className="customer-cell">
                    <span className="customer-avatar">
                      {initials(customer?.name)}
                    </span>
                    <div>
                      <div className="cell-title">
                        {customer?.name || "Customer"}
                      </div>
                      <div className="cell-subtitle">
                        {booking.vehicleNumber} · {booking.vehicle}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="cell-title">{booking.serviceName}</span>
                  <div className="cell-subtitle">{booking.duration} min</div>
                </td>
                <td>
                  <span className="cell-title">
                    {compact
                      ? timeLabel(booking.time)
                      : dateLabel(booking.date)}
                  </span>
                  <div className="cell-subtitle">
                    {compact ? booking.reference : timeLabel(booking.time)}
                  </div>
                </td>
                <td>
                  <Badge status={booking.status} />
                </td>
                {!compact && (
                  <td>
                    <Badge status={booking.paymentStatus} />
                  </td>
                )}
                <td className="amount">{money(booking.price)}</td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`View booking ${booking.reference}`}
                    onClick={() => onView(booking)}
                  >
                    <Icon name="next" size={19} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RevenueChart({ bookings, days }) {
  const totals = days.map((date) =>
    bookings
      .filter(
        (booking) =>
          booking.date === date &&
          booking.paymentStatus === "paid" &&
          booking.status !== "cancelled",
      )
      .reduce((sum, booking) => sum + booking.price, 0),
  );
  const maximum = Math.max(...totals, 1);
  return (
    <div className="chart">
      <div className="chart-bars">
        {days.map((date, index) => (
          <div className="chart-column" key={date}>
            <span className="chart-value">{money(totals[index])}</span>
            <div className="chart-track">
              <div
                className={`chart-bar ${index === days.length - 1 ? "current" : ""}`}
                style={{
                  height: `${Math.max(2, (totals[index] / maximum) * 100)}%`,
                }}
                title={`${dateLabel(date)}: ${money(totals[index])}`}
              />
            </div>
            <span className="chart-label">
              {dateLabel(date, {
                weekday: "short",
                day: undefined,
                month: undefined,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
