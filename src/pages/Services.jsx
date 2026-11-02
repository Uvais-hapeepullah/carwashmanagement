import Icon from "../components/Icon.jsx";
import { PageHeading, Empty } from "../components/Shared.jsx";
import { money } from "../utils.js";

export default function Services({ data, onAdd, onEdit, onDelete }) {
  const { services, bookings } = data;
  return (
    <>
      <PageHeading
        eyebrow="A PACKAGE FOR EVERY CAR"
        title="Services & pricing"
        description="Your wash menu, made simple. Set the price. Add the shine."
      >
        <button className="button primary" onClick={onAdd}>
          <Icon name="plus" size={18} />
          Add service
        </button>
      </PageHeading>
      <div className="banner-note">
        <Icon name="shield" size={22} />
        <div>
          <strong>Clear prices. No surprises.</strong>
          <p>
            Price updates apply to new bookings. Existing bookings keep their
            original price.
          </p>
        </div>
      </div>
      {services.length ? (
        <div className="cards-grid">
          {services.map((service, index) => (
            <article
              className={`service-card ${service.active ? "" : "inactive"}`}
              key={service.id}
            >
              <div className="service-card-heading">
                <span className={`service-icon ${service.color}`}>
                  <Icon
                    name={["waves", "sparkle", "shield", "car"][index % 4]}
                    size={27}
                  />
                </span>
                <span
                  className={`status-badge ${service.active ? "paid" : "cancelled"}`}
                >
                  {service.active ? "Active" : "Inactive"}
                </span>
              </div>
              <h2>{service.name}</h2>
              <p className="service-description">{service.description}</p>
              <div className="service-price">
                {money(service.price)}
                <span>/ wash</span>
              </div>
              <div className="service-features">
                <span>
                  <Icon name="clock" size={17} />
                  {service.duration} minutes
                </span>
                <span>
                  <Icon name="bookings" size={17} />
                  {
                    bookings.filter(
                      (booking) =>
                        booking.serviceId === service.id &&
                        booking.status !== "cancelled",
                    ).length
                  }{" "}
                  bookings
                </span>
              </div>
              <div className="service-footer">
                <button
                  className="button secondary small"
                  onClick={() => onEdit(service)}
                >
                  <Icon name="edit" size={16} />
                  Edit service
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`Delete ${service.name}`}
                  onClick={() => onDelete(service)}
                >
                  <Icon name="delete" size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel">
          <Empty
            title="Build your service menu"
            description="Add a service to start accepting bookings."
          />
        </div>
      )}
      <p className="services-note">
        <Icon name="help" size={16} />A service with existing bookings can be
        made inactive instead of deleted.
      </p>
    </>
  );
}
