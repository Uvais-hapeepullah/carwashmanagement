import { useState } from "react";
import Icon from "./Icon.jsx";
import { Badge } from "./Shared.jsx";
import { money, dateLabel, timeLabel } from "../utils.js";

export function CustomerForm({ customer, onSave, onClose }) {
  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        <div className="field-grid">
          <label className="field">
            <span className="field-label">Full name *</span>
            <input
              className="input"
              required
              maxLength={80}
              placeholder="e.g. Aisha Khan"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Phone number *</span>
            <input
              className="input"
              type="tel"
              required
              maxLength={20}
              placeholder="e.g. 98765 43210"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Email (optional)</span>
            <input
              className="input"
              type="email"
              maxLength={120}
              placeholder="customer@example.com"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </label>
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button primary" disabled={saving}>
          {saving ? "Saving…" : customer ? "Save changes" : "Add customer"}
          <Icon name="check" size={17} />
        </button>
      </div>
    </form>
  );
}

export function ServiceForm({ service, onSave, onClose }) {
  const [form, setForm] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || "",
    duration: service?.duration || 30,
    color: service?.color || "teal",
    active: service?.active ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        price: Number(form.price),
        duration: Number(form.duration),
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        <div className="field-grid two">
          <label className="field full-span">
            <span className="field-label">Service name *</span>
            <input
              className="input"
              required
              maxLength={80}
              placeholder="e.g. Express Wash"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </label>
          <label className="field full-span">
            <span className="field-label">Description</span>
            <textarea
              className="input textarea"
              rows={3}
              maxLength={300}
              placeholder="What’s included in this service?"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Price (₹) *</span>
            <input
              className="input"
              type="number"
              min="1"
              max="100000"
              step="0.01"
              required
              value={form.price}
              onChange={(event) => set("price", event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Duration (minutes) *</span>
            <input
              className="input"
              type="number"
              min="5"
              max="480"
              step="1"
              required
              value={form.duration}
              onChange={(event) => set("duration", event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Accent color</span>
            <select
              className="input"
              value={form.color}
              onChange={(event) => set("color", event.target.value)}
            >
              <option value="teal">Teal</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="orange">Orange</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => set("active", event.target.checked)}
            />
            Available for new bookings
          </label>
        </div>
        <p className="form-note">
          Existing bookings keep their original service price and duration.
        </p>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="button secondary" type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="button primary" disabled={saving}>
          {saving ? "Saving…" : service ? "Save changes" : "Add service"}
          <Icon name="check" size={17} />
        </button>
      </div>
    </form>
  );
}

export function ConfirmDelete({ description, onConfirm, onClose }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function remove() {
    setSaving(true);
    setError("");
    try {
      await onConfirm();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="modal-body">
        <p>{description}</p>
        <p className="field-hint">
          This permanently removes the record. Linked customer and service
          records, and paid bookings, are protected.
        </p>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="button secondary" onClick={onClose}>
          Keep record
        </button>
        <button className="button danger" disabled={saving} onClick={remove}>
          <Icon name="delete" size={17} />
          {saving ? "Deleting…" : "Delete record"}
        </button>
      </div>
    </>
  );
}

export function BookingDetails({
  booking,
  customer,
  onUpdate,
  onEdit,
  onDelete,
  onReceipt,
}) {
  const [method, setMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const steps = ["scheduled", "in-progress", "completed"];
  const current = steps.indexOf(booking.status);
  const editable =
    ["scheduled", "in-progress"].includes(booking.status) &&
    booking.paymentStatus !== "paid";
  async function update(values, message) {
    setSaving(true);
    setError("");
    try {
      await onUpdate(values, message);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="modal-body">
        <div className="detail-booking-header">
          <div className="detail-car">
            <Icon name="car" size={32} />
          </div>
          <div>
            <h3>{booking.vehicle}</h3>
            <p>{booking.vehicleNumber}</p>
          </div>
          <Badge status={booking.status} />
        </div>
        {booking.status !== "cancelled" && (
          <div className="progress-steps">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`progress-step ${index < current ? "done" : ""} ${index === current ? "current" : ""}`}
              >
                <span>
                  {index < current ? (
                    <Icon name="check" size={14} />
                  ) : (
                    index + 1
                  )}
                </span>
                <small>
                  {["Scheduled", "In progress", "Completed"][index]}
                </small>
              </div>
            ))}
          </div>
        )}
        <div className="booking-details">
          {[
            ["Customer", customer?.name],
            ["Phone", customer?.phone],
            ["Service", booking.serviceName],
            ["Duration", `${booking.duration} minutes`],
            ["Booking date", dateLabel(booking.date, { year: "numeric" })],
            ["Time", timeLabel(booking.time)],
          ].map(([label, value]) => (
            <div className="detail-pair" key={label}>
              <span className="detail-label">{label}</span>
              <strong className="detail-value">{value}</strong>
            </div>
          ))}
        </div>
        {booking.notes && (
          <div className="detail-notes">
            <span className="detail-label">Special instructions</span>
            <p>{booking.notes}</p>
          </div>
        )}
        <div className="summary-strip">
          <div>
            <span className="field-label">Total amount</span>
            <div className="cell-subtitle">
              {booking.paymentStatus === "paid"
                ? `Paid via ${booking.paymentMethod}`
                : booking.status === "cancelled"
                  ? "Cancelled · no payment due"
                  : "Payment not yet recorded"}
            </div>
          </div>
          <strong className="summary-total">{money(booking.price)}</strong>
        </div>
        {booking.status === "completed" &&
          booking.paymentStatus === "unpaid" && (
            <div className="payment-section">
              <h3 className="form-section-title">Record payment</h3>
              <p className="field-hint">
                Select the method used after receiving the payment.
              </p>
              <div className="payment-options">
                {["Cash", "UPI", "Card"].map((item) => (
                  <button
                    type="button"
                    aria-pressed={method === item}
                    className={`radio-card ${method === item ? "selected" : ""}`}
                    key={item}
                    onClick={() => setMethod(item)}
                  >
                    <Icon
                      name={
                        item === "Cash"
                          ? "cash"
                          : item === "UPI"
                            ? "phone"
                            : "card"
                      }
                      size={18}
                    />
                    {item}
                    {method === item && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
              <button
                className="button primary full"
                disabled={saving}
                onClick={() =>
                  update(
                    { paymentStatus: "paid", paymentMethod: method },
                    "Payment recorded successfully.",
                  )
                }
              >
                <Icon name="wallet" size={18} />
                {saving ? "Saving…" : `Record ${money(booking.price)} payment`}
              </button>
            </div>
          )}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="modal-footer details-actions">
        <div className="row-actions">
          {editable && (
            <button
              className="button secondary small"
              onClick={onEdit}
              disabled={saving}
            >
              <Icon name="edit" size={16} />
              Edit
            </button>
          )}
          {booking.paymentStatus !== "paid" && (
            <button
              className="icon-button danger"
              aria-label="Delete booking"
              onClick={onDelete}
              disabled={saving}
            >
              <Icon name="delete" size={18} />
            </button>
          )}
        </div>
        <div className="row-actions">
          {["scheduled", "in-progress"].includes(booking.status) &&
            booking.paymentStatus !== "paid" && (
              <button
                className="button ghost small"
                disabled={saving}
                onClick={() =>
                  update({ status: "cancelled" }, "Booking cancelled.")
                }
              >
                Cancel wash
              </button>
            )}
          {booking.status === "scheduled" && (
            <button
              className="button primary small"
              disabled={saving}
              onClick={() => update({ status: "in-progress" }, "Wash started.")}
            >
              <Icon name="play" size={16} />
              {saving ? "Saving…" : "Start wash"}
            </button>
          )}
          {booking.status === "in-progress" && (
            <button
              className="button primary small"
              disabled={saving}
              onClick={() =>
                update(
                  { status: "completed" },
                  "Wash completed. You can now record the payment.",
                )
              }
            >
              <Icon name="check" size={16} />
              {saving ? "Saving…" : "Complete wash"}
            </button>
          )}
          {booking.paymentStatus === "paid" && (
            <button className="button primary small" onClick={onReceipt}>
              <Icon name="print" size={16} />
              Receipt
            </button>
          )}
        </div>
      </div>
    </>
  );
}
