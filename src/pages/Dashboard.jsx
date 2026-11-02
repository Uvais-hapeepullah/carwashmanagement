import Icon from "../components/Icon.jsx";
import {
  PageHeading,
  Stat,
  BookingTable,
  RevenueChart,
} from "../components/Shared.jsx";
import { today, money, lastDays } from "../utils.js";

export default function Dashboard({ data, onBook, onNavigate, onView }) {
  const { bookings, customers, settings } = data;
  const daily = bookings.filter((booking) => booking.date === today());
  const active = daily.filter((booking) => booking.status === "in-progress");
  const completed = daily.filter((booking) => booking.status === "completed");
  const upcoming = daily.filter((booking) => booking.status === "scheduled");
  const revenue = daily
    .filter(
      (booking) =>
        booking.paymentStatus === "paid" && booking.status !== "cancelled",
    )
    .reduce((sum, booking) => sum + booking.price, 0);
  const days = lastDays(7);
  const weekRevenue = bookings
    .filter(
      (booking) =>
        days.includes(booking.date) &&
        booking.paymentStatus === "paid" &&
        booking.status !== "cancelled",
    )
    .reduce((sum, booking) => sum + booking.price, 0);
  const dailyList = [...daily]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 5);
  const serviceCounts = data.services
    .map((service) => ({
      ...service,
      count: bookings.filter(
        (booking) =>
          booking.serviceId === service.id &&
          days.includes(booking.date) &&
          booking.status !== "cancelled",
      ).length,
    }))
    .filter((service) => service.count > 0);
  const serviceTotal = serviceCounts.reduce(
    (sum, service) => sum + service.count,
    0,
  );
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  return (
    <>
      <PageHeading
        eyebrow="LET’S MAKE IT A GREAT DAY"
        title={`${greeting}, ${settings.ownerName.split(" ")[0]}.`}
        description="Here’s what’s happening at your car wash today."
      >
        <button className="button primary" onClick={onBook}>
          <Icon name="plus" size={18} />
          New booking
        </button>
      </PageHeading>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">
            <span className="legend-dot" /> YOUR DAY, UNDER CONTROL
          </p>
          <h2 className="hero-title">
            Clean cars.
            <br />
            Smooth operations.
          </h2>
          <p className="hero-description">
            A little less admin. A lot more shine.
            <br />
            Everything you need to keep your wash moving.
          </p>
          <div className="hero-tags">
            <span className="hero-tag">
              <Icon name="clock" size={14} />
              {upcoming.length} upcoming washes
            </span>
            <span className="hero-tag">
              <Icon name="shield" size={14} />
              {Math.max(0, settings.bays - active.length)} bays available
            </span>
          </div>
        </div>
        <img
          className="hero-art"
          src="/car-illustration.svg"
          alt="A sparkling clean car at the wash"
        />
      </section>
      <div className="stats-grid section-gap">
        <Stat
          icon="bookings"
          label="Today’s bookings"
          value={
            daily.filter((booking) => booking.status !== "cancelled").length
          }
          detail={`${upcoming.length} waiting to get started`}
        />
        <Stat
          icon="rupee"
          label="Today’s collection"
          value={money(revenue)}
          detail="Payments for today’s bookings"
          color="blue"
        />
        <Stat
          icon="car"
          label="Washes in progress"
          value={active.length}
          detail={`Across ${settings.bays} wash bays`}
          color="orange"
        />
        <Stat
          icon="success"
          label="Completed today"
          value={completed.length}
          detail="Fresh, clean and ready to go"
          color="purple"
        />
      </div>
      <div className="dashboard-grid section-gap">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Collection overview</h2>
              <p className="panel-description">
                Paid value by booking date · Last 7 days
              </p>
            </div>
            <span className="legend">
              <span className="legend-dot" />
              Collected
            </span>
          </div>
          <div className="chart-summary">
            <strong>{money(weekRevenue)}</strong>
            <span className="text-muted">this week</span>
          </div>
          <RevenueChart bookings={bookings} days={days} />
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Popular services</h2>
              <p className="panel-description">
                What your customers love this week
              </p>
            </div>
            <Icon name="services" size={21} />
          </div>
          <div className="service-mix">
            {serviceCounts.length ? (
              serviceCounts.map((service) => (
                <div className="mix-row" key={service.id}>
                  <div className="mix-label">
                    <span>{service.name}</span>
                    <strong>{service.count} washes</strong>
                  </div>
                  <div className="mix-track">
                    <div
                      className={`mix-bar ${service.color}`}
                      style={{
                        width: `${(service.count / serviceTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">
                Book a wash to see your service breakdown.
              </p>
            )}
          </div>
          <div className="mix-footer">
            <Icon name="sparkle" size={17} />
            Every detail makes a difference.
          </div>
        </section>
      </div>
      <section className="panel section-gap">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              Today’s bookings <span className="tab-count">{daily.length}</span>
            </h2>
            <p className="panel-description">A quick look at the day ahead</p>
          </div>
          <button className="text-link" onClick={() => onNavigate("bookings")}>
            View all bookings
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <BookingTable
          bookings={dailyList}
          customers={customers}
          onView={onView}
          compact
        />
      </section>
      <div className="section-gap">
        <div className="panel-header bay-section-header">
          <div>
            <h2 className="panel-title">Wash bay activity</h2>
            <p className="panel-description">Your team’s current workload</p>
          </div>
          <button className="text-link" onClick={() => onNavigate("queue")}>
            Open wash queue
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="bay-grid">
          {Array.from({ length: settings.bays }, (_, index) => {
            const booking = active[index];
            return (
              <div
                className={`bay-card ${booking ? "occupied" : ""}`}
                key={index}
              >
                <div className="bay-top">
                  <span className="bay-name">
                    BAY {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={`bay-indicator ${booking ? "busy" : ""}`}>
                    {booking ? "In use" : "Available"}
                  </span>
                </div>
                <Icon name="car" size={30} />
                <h3 className="bay-vehicle">
                  {booking?.vehicle || "Ready for the next wash"}
                </h3>
                <p className="bay-service">
                  {booking
                    ? `${booking.vehicleNumber} · ${booking.serviceName}`
                    : "A fresh start is just a booking away."}
                </p>
                {booking && (
                  <button
                    className="text-link bay-footer"
                    onClick={() => onView(booking)}
                  >
                    View wash
                    <Icon name="arrow" size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
