import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { PageHeading } from "../components/Shared.jsx";

export default function Settings({ data, onSave }) {
  const [form, setForm] = useState({ ...data.settings });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="Business settings"
        description="The little details that keep your business running smoothly."
      />
      <div className="settings-grid">
        <form className="panel settings-form" onSubmit={submit}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Business details</h2>
              <p className="panel-description">
                These details also appear on payment receipts.
              </p>
            </div>
            <Icon name="settings" size={21} />
          </div>
          <div className="settings-form-body">
            <div className="field-grid two">
              <label className="field">
                <span className="field-label">Business name *</span>
                <input
                  className="input"
                  required
                  maxLength={80}
                  value={form.businessName}
                  onChange={(event) => set("businessName", event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Owner name *</span>
                <input
                  className="input"
                  required
                  maxLength={80}
                  value={form.ownerName}
                  onChange={(event) => set("ownerName", event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Phone *</span>
                <input
                  className="input"
                  type="tel"
                  required
                  maxLength={20}
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Email</span>
                <input
                  className="input"
                  type="email"
                  maxLength={120}
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                />
              </label>
              <label className="field full-span">
                <span className="field-label">Address *</span>
                <textarea
                  className="input textarea"
                  rows={2}
                  required
                  maxLength={250}
                  value={form.address}
                  onChange={(event) => set("address", event.target.value)}
                />
              </label>
            </div>
            <h3 className="form-section-title">Operating hours & capacity</h3>
            <div className="field-grid two">
              <label className="field">
                <span className="field-label">Opening time *</span>
                <input
                  className="input"
                  type="time"
                  required
                  value={form.openingTime}
                  onChange={(event) => set("openingTime", event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Closing time *</span>
                <input
                  className="input"
                  type="time"
                  required
                  value={form.closingTime}
                  onChange={(event) => set("closingTime", event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Wash bays *</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={form.bays}
                  onChange={(event) => set("bays", Number(event.target.value))}
                />
                <span className="field-hint">
                  How many cars can be washed at the same time?
                </span>
              </label>
            </div>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="button primary" disabled={saving}>
              <Icon name="check" size={17} />
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
        <aside className="settings-aside">
          <div className="panel settings-info">
            <span className="service-icon teal">
              <Icon name="shield" size={27} />
            </span>
            <h3>A simpler way to manage</h3>
            <p>
              Your business settings help keep bookings realistic. We check
              opening hours and wash bay capacity when you create an
              appointment.
            </p>
            <div className="receipt-divider" />
            <h4>Made for your project</h4>
            <p>
              This local demo saves data in a JSON file on the server. Payments
              are recorded manually and no online money is transferred.
            </p>
            <p className="field-hint">
              Demo data is added automatically on the first run.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
