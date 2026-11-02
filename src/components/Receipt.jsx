import Icon from "./Icon.jsx";
import { money, dateLabel, timeLabel } from "../utils.js";

export default function Receipt({ booking, customer, settings }) {
  return (
    <>
      <div className="modal-body print-area">
        <div className="receipt">
          <div className="receipt-header">
            <div className="receipt-brand">
              <Icon name="services" size={35} />
              <h2>{settings.businessName}</h2>
            </div>
            <p>{settings.address}</p>
            <p>
              {settings.phone} {settings.email && `· ${settings.email}`}
            </p>
            <span className="status-badge paid">Payment receipt</span>
          </div>
          <div className="receipt-divider" />
          <div className="receipt-meta">
            <div>
              <span>Receipt number</span>
              <strong>{booking.reference}</strong>
            </div>
            <div>
              <span>Wash date</span>
              <strong>{dateLabel(booking.date, { year: "numeric" })}</strong>
            </div>
            <div>
              <span>Customer</span>
              <strong>{customer?.name}</strong>
            </div>
            <div>
              <span>Vehicle</span>
              <strong>{booking.vehicleNumber}</strong>
            </div>
          </div>
          <div className="receipt-divider" />
          <div className="receipt-line">
            <div>
              <strong>{booking.serviceName}</strong>
              <p>
                {booking.vehicle} · {booking.duration} min
              </p>
            </div>
            <strong>{money(booking.price)}</strong>
          </div>
          <div className="receipt-divider" />
          <div className="receipt-total">
            <span>Total paid</span>
            <strong>{money(booking.price)}</strong>
          </div>
          <div className="receipt-line">
            <span>Payment method</span>
            <span>{booking.paymentMethod}</span>
          </div>
          <div className="receipt-line">
            <span>Scheduled time</span>
            <span>{timeLabel(booking.time)}</span>
          </div>
          <p className="receipt-footnote">
            Thanks for choosing {settings.businessName}.<br />A clean car. A
            fresh start.
          </p>
        </div>
      </div>
      <div className="modal-footer no-print">
        <button className="button primary" onClick={() => window.print()}>
          <Icon name="print" size={17} />
          Print / Save PDF
        </button>
      </div>
    </>
  );
}
