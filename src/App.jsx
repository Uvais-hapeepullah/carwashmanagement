import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import Icon from "./components/Icon.jsx";
import Modal from "./components/Modal.jsx";
import BookingForm from "./components/BookingForm.jsx";
import Receipt from "./components/Receipt.jsx";
import {
  CustomerForm,
  ServiceForm,
  ConfirmDelete,
  BookingDetails,
} from "./components/ManagementForms.jsx";
import { BookingTable } from "./components/Shared.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Bookings from "./pages/Bookings.jsx";
import Customers from "./pages/Customers.jsx";
import Services from "./pages/Services.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import { initials, today } from "./utils.js";

const navigation = [
  { id: "dashboard", label: "Overview", icon: "dashboard" },
  { id: "bookings", label: "Bookings", icon: "bookings" },
  { id: "queue", label: "Wash queue", icon: "car" },
  { id: "customers", label: "Customers", icon: "customers" },
  { id: "services", label: "Services & pricing", icon: "services" },
  { id: "reports", label: "Reports", icon: "reports" },
];

export default function App() {
  // One shared state keeps all pages in sync after a server update.
  const [data, setData] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeModal = useCallback(() => setModal(null), []);

  const refresh = useCallback(async () => {
    const result = await api("/bootstrap");
    setData(result);
    return result;
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    document.title = `${data?.settings.businessName || import.meta.env.VITE_APP_NAME || "Ideal Car Wash"} | Car Wash Management`;
  }, [data?.settings.businessName]);

  function notify(message) {
    setToast({ message });
  }
  function navigate(id) {
    setPage(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function book() {
    setModal({ type: "booking" });
  }
  function view(booking) {
    setModal({ type: "details", id: booking.id });
  }
  function remove(collection, record) {
    setModal({ type: "delete", collection, record });
  }
  async function saveEntity(collection, record, values) {
    const result = await api(
      `/${collection}${record ? `/${record.id}` : ""}`,
      record ? "PUT" : "POST",
      values,
    );
    await refresh();
    closeModal();
    notify("Saved successfully.");
    return result;
  }
  async function createCustomer(values) {
    const result = await api("/customers", "POST", values);
    await refresh();
    return result;
  }
  async function updateBooking(booking, values, message) {
    await api(`/bookings/${booking.id}`, "PUT", values);
    await refresh();
    notify(message);
  }

  if (loading && !data)
    return (
      <div className="loading-state">
        <span className="brand-mark">
          <Icon name="services" size={30} />
        </span>
        <div className="spinner" />
        <h1>Getting your workspace ready…</h1>
        <p>Good things come to clean cars.</p>
      </div>
    );
  if (!data)
    return (
      <div className="error-page">
        <Icon name="alert" size={45} />
        <h1>Let’s get connected</h1>
        <p>{error}</p>
        <button className="button primary" onClick={load}>
          <Icon name="refresh" size={18} />
          Try again
        </button>
        <p className="field-hint">
          Start the project with <code>npm run dev</code> from the project
          folder.
        </p>
      </div>
    );

  const currentBooking = modal?.id
    ? data.bookings.find((booking) => booking.id === modal.id)
    : null;
  const currentCustomer =
    currentBooking &&
    data.customers.find(
      (customer) => customer.id === currentBooking.customerId,
    );
  const activeCount = data.bookings.filter(
    (booking) => booking.date === today() && booking.status === "in-progress",
  ).length;
  const pageName =
    navigation.find((item) => item.id === page)?.label || "Settings";
  const common = { data, onBook: book, onView: view };

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <a
          className="brand"
          href="#overview"
          onClick={(event) => {
            event.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-mark">
            <Icon name="services" size={27} />
          </span>
          <span className="brand-copy">
            {data.settings.businessName}
            <span className="brand-subtitle">CAR WASH MANAGER</span>
          </span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={`nav-item ${page === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-current={page === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {item.id === "queue" && activeCount > 0 && (
                <span className="nav-badge">{activeCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="sidebar-tip-icon">
              <Icon name="sparkle" size={23} />
            </div>
            <p className="sidebar-tip-title">A fresh start, every day.</p>
            <p>Great service begins with a well-managed wash.</p>
            <button onClick={book}>
              Let’s get washing
              <Icon name="arrow" size={15} />
            </button>
          </div>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
          <div className="profile">
            <span className="avatar">{initials(data.settings.ownerName)}</span>
            <div className="profile-copy">
              <strong>{data.settings.ownerName}</strong>
              <span>Business owner</span>
            </div>
            <span className="profile-online" title="Local workspace ready" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-crumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <Icon name="next" size={14} />
            <strong>{pageName}</strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-date">
              <Icon name="bookings" size={16} />
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              className="icon-button"
              aria-label="Open quick guide"
              onClick={() => setModal({ type: "help" })}
            >
              <Icon name="help" size={21} />
            </button>
            <span className="topbar-avatar">
              {initials(data.settings.ownerName)}
            </span>
          </div>
        </header>
        <main className="page-content" id="main-content">
          {page === "dashboard" && (
            <Dashboard {...common} onNavigate={navigate} />
          )}
          {(page === "bookings" || page === "queue") && (
            <Bookings key={page} {...common} queue={page === "queue"} />
          )}
          {page === "customers" && (
            <Customers
              data={data}
              onAdd={() => setModal({ type: "customer" })}
              onEdit={(record) => setModal({ type: "customer", record })}
              onDelete={(record) => remove("customers", record)}
              onHistory={(record) => setModal({ type: "history", record })}
            />
          )}
          {page === "services" && (
            <Services
              data={data}
              onAdd={() => setModal({ type: "service" })}
              onEdit={(record) => setModal({ type: "service", record })}
              onDelete={(record) => remove("services", record)}
            />
          )}
          {page === "reports" && <Reports {...common} />}
          {page === "settings" && (
            <Settings
              data={data}
              onSave={async (values) => {
                await api("/settings", "PUT", values);
                await refresh();
                notify("Business settings saved.");
              }}
            />
          )}
          <footer className="app-footer">
            <span>
              © {new Date().getFullYear()} {data.settings.businessName}. A
              little care. A lot of shine.
            </span>
            <span className="live-label">
              <span className="legend-dot" />
              Local workspace
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className={`toast ${toast.error ? "error" : ""}`} role="status">
          <Icon name={toast.error ? "alert" : "success"} size={21} />
          <span>{toast.message}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      )}
      {modal?.type === "booking" && (
        <Modal
          title={modal.record ? "Edit booking" : "New booking"}
          description="A clean car starts with a little planning."
          wide
          onClose={closeModal}
        >
          <BookingForm
            booking={modal.record}
            customers={data.customers}
            services={data.services}
            settings={data.settings}
            onClose={closeModal}
            onCreateCustomer={createCustomer}
            onSave={(values) => saveEntity("bookings", modal.record, values)}
          />
        </Modal>
      )}
      {modal?.type === "customer" && (
        <Modal
          title={modal.record ? "Edit customer" : "Add customer"}
          description="A familiar face behind every clean car."
          onClose={closeModal}
        >
          <CustomerForm
            customer={modal.record}
            onClose={closeModal}
            onSave={(values) => saveEntity("customers", modal.record, values)}
          />
        </Modal>
      )}
      {modal?.type === "service" && (
        <Modal
          title={modal.record ? "Edit service" : "Add service"}
          description="Build a package your customers will love."
          onClose={closeModal}
        >
          <ServiceForm
            service={modal.record}
            onClose={closeModal}
            onSave={(values) => saveEntity("services", modal.record, values)}
          />
        </Modal>
      )}
      {modal?.type === "details" && currentBooking && (
        <Modal
          title={`Booking ${currentBooking.reference}`}
          description="Wash details, progress and payment."
          onClose={closeModal}
        >
          <BookingDetails
            key={currentBooking.id}
            booking={currentBooking}
            customer={currentCustomer}
            onUpdate={(values, message) =>
              updateBooking(currentBooking, values, message)
            }
            onEdit={() => setModal({ type: "booking", record: currentBooking })}
            onDelete={() => remove("bookings", currentBooking)}
            onReceipt={() =>
              setModal({ type: "receipt", id: currentBooking.id })
            }
          />
        </Modal>
      )}
      {modal?.type === "receipt" && currentBooking && (
        <Modal
          title="Payment receipt"
          onClose={closeModal}
          className="receipt-modal"
        >
          <Receipt
            booking={currentBooking}
            customer={currentCustomer}
            settings={data.settings}
          />
        </Modal>
      )}
      {modal?.type === "delete" && (
        <Modal title="Delete this record?" onClose={closeModal}>
          <ConfirmDelete
            description={`You’re about to delete ${modal.record.name || modal.record.reference}.`}
            onClose={closeModal}
            onConfirm={async () => {
              await api(`/${modal.collection}/${modal.record.id}`, "DELETE");
              await refresh();
              closeModal();
              notify("Record deleted.");
            }}
          />
        </Modal>
      )}
      {modal?.type === "history" && (
        <Modal
          title={`${modal.record.name}’s bookings`}
          description={`${modal.record.phone}${modal.record.email ? ` · ${modal.record.email}` : ""}`}
          onClose={closeModal}
          wide
        >
          <BookingTable
            bookings={data.bookings
              .filter((booking) => booking.customerId === modal.record.id)
              .sort((a, b) => b.date.localeCompare(a.date))}
            customers={data.customers}
            onView={view}
          />
        </Modal>
      )}
      {modal?.type === "help" && (
        <Modal
          title={`A quick guide to ${data.settings.businessName}`}
          description="Everything you need for a smoother day."
          onClose={closeModal}
        >
          <div className="modal-body quick-guide">
            <ol>
              <li>
                <strong>Add your service packages.</strong>
                <p>Set a price and duration in Services & pricing.</p>
              </li>
              <li>
                <strong>Make a booking.</strong>
                <p>
                  Choose a customer, vehicle, service and time. You can add a
                  new customer as you book.
                </p>
              </li>
              <li>
                <strong>Follow the wash.</strong>
                <p>
                  Open a card in Wash queue, then select Start wash and Complete
                  wash.
                </p>
              </li>
              <li>
                <strong>Record the payment.</strong>
                <p>
                  After completion, choose Cash, UPI or Card. You can then print
                  the receipt.
                </p>
              </li>
              <li>
                <strong>See how you’re doing.</strong>
                <p>
                  Check Reports and export the booking register as a CSV file.
                </p>
              </li>
            </ol>
            <div className="notice">
              <Icon name="help" size={20} />
              <p>
                This is a local project demo with sample data. Payments are
                recorded manually.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="button primary" onClick={closeModal}>
              Got it
              <Icon name="check" size={17} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
