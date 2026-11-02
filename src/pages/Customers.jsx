import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { Empty, PageHeading, SearchBox } from "../components/Shared.jsx";
import { initials, money, dateLabel } from "../utils.js";

export default function Customers({
  data,
  onAdd,
  onEdit,
  onDelete,
  onHistory,
}) {
  const [search, setSearch] = useState("");
  const list = data.customers
    .filter((customer) =>
      `${customer.name} ${customer.phone} ${customer.email}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <PageHeading
        eyebrow="GOOD SERVICE STARTS WITH PEOPLE"
        title="Customers"
        description="Get to know the people behind every clean car."
      >
        <button className="button primary" onClick={onAdd}>
          <Icon name="plus" size={18} />
          Add customer
        </button>
      </PageHeading>
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone or email…"
          />
          <span className="text-muted">{list.length} customers</span>
        </div>
        <div className="table-wrap">
          {list.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact details</th>
                  <th>Visits</th>
                  <th>Last booking</th>
                  <th>Total paid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((customer) => {
                  const records = data.bookings.filter(
                    (booking) =>
                      booking.customerId === customer.id &&
                      booking.status !== "cancelled",
                  );
                  const latest = [...records].sort((a, b) =>
                    b.date.localeCompare(a.date),
                  )[0];
                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-avatar">
                            {initials(customer.name)}
                          </span>
                          <div>
                            <button
                              className="customer-name-button"
                              onClick={() => onHistory(customer)}
                            >
                              {customer.name}
                            </button>
                            <div className="cell-subtitle">
                              {records.some(
                                (booking) => booking.status === "completed",
                              )
                                ? "Returning customer"
                                : "Customer"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-title">{customer.phone}</div>
                        <div className="cell-subtitle">
                          {customer.email || "No email added"}
                        </div>
                      </td>
                      <td>
                        {
                          records.filter(
                            (booking) => booking.status === "completed",
                          ).length
                        }
                        <span className="cell-subtitle"> completed</span>
                      </td>
                      <td>
                        {latest
                          ? dateLabel(latest.date, { year: "numeric" })
                          : "—"}
                      </td>
                      <td className="cell-title">
                        {money(
                          records
                            .filter(
                              (booking) => booking.paymentStatus === "paid",
                            )
                            .reduce((sum, booking) => sum + booking.price, 0),
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            aria-label={`Edit ${customer.name}`}
                            onClick={() => onEdit(customer)}
                          >
                            <Icon name="edit" size={17} />
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label={`Delete ${customer.name}`}
                            onClick={() => onDelete(customer)}
                          >
                            <Icon name="delete" size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <Empty
              title="No customers found"
              description="Add your first customer or try another search."
            />
          )}
        </div>
      </section>
    </>
  );
}
