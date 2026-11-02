import { useState } from "react";
import Icon from "./Icon.jsx";
import { money, today } from "../utils.js";

export default function BookingForm({
  booking,
  customers,
  services,
  settings,
  onSave,
  onCreateCustomer,
  onClose,
}) {
  const [form, setForm] = useState({
    customerId: booking?.customerId || "",
    serviceId:
      booking?.serviceId ||
      services.find((service) => service.active)?.id ||
      "",
    vehicle: booking?.vehicle || "",
    vehicleNumber: booking?.vehicleNumber || "",
    date: booking?.date || today(),
    time: booking?.time || "10:00",
    notes: booking?.notes || "",
  });
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [createdCustomer, setCreatedCustomer] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const service = services.find((item) => item.id === form.serviceId);
  const sameService = booking && booking.serviceId === form.serviceId;
  const price = sameService ? booking.price : service?.price;
  const duration = sameService ? booking.duration : service?.duration;
  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      let customerId = form.customerId;
      if (customerId === "new") {
        const customer =
          createdCustomer || (await onCreateCustomer(newCustomer));
        setCreatedCustomer(customer);
        customerId = customer.id;
      }
      await onSave({ ...form, customerId });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        <h3 className="form-section-title">
          01 <span>Customer & vehicle</span>
        </h3>
        <div className="field-grid two">
          <label className="field full-span">
            <span className="field-label">Customer *</span>
            <select
              className="input"
              required
              value={form.customerId}
              onChange={(event) => set("customerId", event.target.value)}
            >
              <option value="">Select a customer</option>
              <option value="new">+ Add a new customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.phone}
                </option>
              ))}
            </select>
          </label>
          {form.customerId === "new" && (
            <>
              <label className="field">
                <span className="field-label">Full name *</span>
                <input
                  className="input"
                  required
                  maxLength={80}
                  value={newCustomer.name}
                  disabled={!!createdCustomer}
                  onChange={(event) =>
                    setNewCustomer({ ...newCustomer, name: event.target.value })
                  }
                  placeholder="e.g. Aisha Khan"
                />
              </label>
              <label className="field">
                <span className="field-label">Phone number *</span>
                <input
                  className="input"
                  required
                  type="tel"
                  maxLength={20}
                  value={newCustomer.phone}
                  disabled={!!createdCustomer}
                  onChange={(event) =>
                    setNewCustomer({
                      ...newCustomer,
                      phone: event.target.value,
                    })
                  }
                  placeholder="e.g. 98765 43210"
                />
              </label>
              <label className="field full-span">
                <span className="field-label">Email (optional)</span>
                <input
                  className="input"
                  type="email"
                  maxLength={120}
                  value={newCustomer.email}
                  disabled={!!createdCustomer}
                  onChange={(event) =>
                    setNewCustomer({
                      ...newCustomer,
                      email: event.target.value,
                    })
                  }
                  placeholder="customer@example.com"
                />
              </label>
              {createdCustomer && (
                <p className="field-hint full-span">
                  Customer saved. Adjust the booking details below to continue.
                </p>
              )}
            </>
          )}
          <label className="field">
            <span className="field-label">Vehicle model *</span>
            <input
              className="input"
              required
              maxLength={80}
              placeholder="e.g. Hyundai i20"
              value={form.vehicle}
              onChange={(event) => set("vehicle", event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Registration number *</span>
            <input
              className="input"
              required
              maxLength={20}
              placeholder="e.g. TN 01 AB 1234"
              value={form.vehicleNumber}
              onChange={(event) =>
                set("vehicleNumber", event.target.value.toUpperCase())
              }
            />
          </label>
        </div>
        <h3 className="form-section-title">
          02 <span>Wash details</span>
        </h3>
        <div className="field-grid two">
          <label className="field full-span">
            <span className="field-label">Service package *</span>
            <select
              className="input"
              required
              value={form.serviceId}
              onChange={(event) => set("serviceId", event.target.value)}
            >
              <option value="">Select a service</option>
              {services
                .filter((item) => item.active || item.id === booking?.serviceId)
                .map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {money(item.price)} · {item.duration} min
                    {!item.active ? " (inactive)" : ""}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Date *</span>
            <input
              className="input"
              type="date"
              required
              value={form.date}
              onChange={(event) => set("date", event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Time *</span>
            <input
              className="input"
              type="time"
              required
              min={settings.openingTime}
              max={settings.closingTime}
              value={form.time}
              onChange={(event) => set("time", event.target.value)}
            />
          </label>
          <label className="field full-span">
            <span className="field-label">Notes (optional)</span>
            <textarea
              className="input textarea"
              rows={2}
              maxLength={500}
              placeholder="Any special instructions for the team?"
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
            />
          </label>
        </div>
        <p className="field-hint">
          Open {settings.openingTime}–{settings.closingTime}. The full wash must
          fit within opening hours.
        </p>
        <div className="summary-strip">
          <div>
            <span className="field-label">Booking total</span>
            <div className="cell-subtitle">
              {duration || 0} minutes · Payment recorded separately
            </div>
          </div>
          <strong className="summary-total">{money(price)}</strong>
        </div>
        {error && (
          <div className="form-error" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="button secondary" type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="button primary" disabled={saving}>
          {saving ? "Saving…" : booking ? "Save changes" : "Create booking"}
          <Icon name="arrow" size={17} />
        </button>
      </div>
    </form>
  );
}
