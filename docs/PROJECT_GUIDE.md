# Washwise — Project and Reviewer Guide

## Explain the project in one minute

> Washwise helps a car wash business keep its daily work in one place. A staff member can register a customer, book a vehicle for a service, move the booking through the wash queue, and record the payment. The dashboard and reports use those same records to show the business activity. I used React for the interface, Express for the API, and a JSON file for persistence so the project is easy to run and explain.

## Why this stack is simple

| Technology | Job in this project                                                       |
| ---------- | ------------------------------------------------------------------------- |
| React      | Displays pages, forms, lists, and dashboard information.                  |
| JavaScript | Handles user actions, filtering, calculations, and validation.            |
| Vite       | Runs the frontend during development and creates its production build.    |
| Express    | Receives API requests, validates changes, and returns JSON responses.     |
| JSON file  | Keeps records after the server restarts, without a database installation. |
| CSS        | Provides the responsive layout, colors, spacing, and visual styling.      |

The JSON file is a simple storage choice for the demonstration. It is not a relational database and does not provide the concurrency guarantees of a database server.

## Where the code lives

| File or folder                       | What to explain                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `src/main.jsx`                       | The React entry point.                                                                 |
| `src/App.jsx`                        | Shared application data, page navigation, forms, and actions.                          |
| `src/pages/`                         | Dashboard, bookings/queue, customers, services, reports, and settings.                 |
| `src/components/BookingForm.jsx`     | The reusable new/edit booking form.                                                    |
| `src/components/ManagementForms.jsx` | Customer and service forms, booking details, payment actions, and delete confirmation. |
| `src/components/Modal.jsx`           | The shared dialog container.                                                           |
| `src/components/Receipt.jsx`         | The printable payment receipt.                                                         |
| `src/components/Shared.jsx`          | Reusable headings, summary cards, charts, and booking tables.                          |
| `src/api.js`                         | The shared `fetch()` helper and API error handling.                                    |
| `src/utils.js`                       | Date, currency, CSV export, and other small helpers.                                   |
| `src/styles.css`                     | The responsive interface and print styling.                                            |
| `server/index.js`                    | API routes, validation, persistence, and server startup.                               |
| `server/seed.js`                     | Sample customers, services, bookings, and business settings.                           |
| `tests/api.test.js`                  | Backend tests using isolated temporary data files.                                     |
| `vite.config.js`                     | Frontend development settings and the API proxy.                                       |

## How the parts communicate

```text
User clicks Save in the React interface
                 |
                 v
React sends an HTTP request using fetch()
                 |
                 v
Express validates the submitted details
                 |
                 v
The backend updates the JSON data file
                 |
                 v
Express returns a success response or an error
                 |
                 v
React refreshes the displayed records
```

During development, Vite forwards `/api` requests to the Express backend. In the built version, Express serves both the frontend files and the API.

## API routes to explain

| Request                     | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `GET /api/health`           | Check that the backend is running.                                  |
| `GET /api/bootstrap`        | Load settings, customers, services, and bookings for the interface. |
| `POST /api/customers`       | Add a customer.                                                     |
| `PUT /api/customers/:id`    | Update one customer.                                                |
| `DELETE /api/customers/:id` | Delete a customer who has no bookings.                              |
| `POST /api/services`        | Add a service.                                                      |
| `PUT /api/services/:id`     | Update a service, including its active status.                      |
| `DELETE /api/services/:id`  | Delete a service that has no bookings.                              |
| `POST /api/bookings`        | Create a scheduled booking.                                         |
| `PUT /api/bookings/:id`     | Update booking details, wash status, or payment information.        |
| `DELETE /api/bookings/:id`  | Delete an unpaid booking.                                           |
| `PUT /api/settings`         | Update business details and scheduling settings.                    |

`:id` means the unique ID of the record being changed. Successful requests return JSON. Validation errors return a useful message and an HTTP error status.

## The main records

- **Customer:** name, phone number, and optional email address.
- **Service:** name, description, price, duration, color, and active status.
- **Booking:** customer and service links, vehicle details, date, time, notes, wash status, and payment details.
- **Business settings:** business name and contact details, opening and closing times, and number of wash bays.

Each customer, service, and booking has a unique ID. A booking stores the customer's ID and the service's ID. It also keeps the booked service name, price, and duration as a snapshot. Updating a service price later does not silently change older bookings.

## Booking and payment flow

```text
Scheduled -----> In progress -----> Completed
    |                 |
    +-----> Cancelled <+
```

Completed and cancelled bookings are final wash states. Payment status is separate from wash status: a completed wash may still need payment. The interface offers payment recording after the wash is completed.

Paid bookings cannot be deleted or cancelled. Their customer link, service, vehicle details, date, time, and recorded payment method are protected from later changes. A recorded payment cannot be changed back to unpaid. Completed and cancelled bookings also have their customer link, service, vehicle details, date, and time locked.

A payment record contains its status and a selected method: Cash, UPI, or Card. It records what the staff member entered; it does not move money. The printed receipt uses the booking's saved price.

Report periods use the **booking date**, rather than the date a payment was entered. “Total collected” adds paid booking amounts in the chosen period; “Outstanding” adds unpaid, non-cancelled booking amounts. The seven-day chart has its own fixed seven-day range, as indicated on the page.

## Validation worth showing the reviewer

- Required information is checked before records are saved.
- Dates and times must be valid, and a wash must finish within business hours.
- Active bookings cannot exceed the configured wash bay capacity at the same time.
- The number of washes marked in progress on one booking date cannot exceed the wash bay count, even when their originally scheduled times differ.
- The same vehicle cannot have overlapping active bookings.
- Only valid wash status transitions are accepted.
- Customer and service records referenced by bookings cannot be deleted.
- Inactive services are not available for new bookings.
- Editing a service does not change the price snapshot of existing bookings.

Changing business hours or reducing the bay count is also checked against existing scheduled and in-progress bookings. If the change would make those bookings invalid, the server asks the staff member to resolve the bookings first.

The backend performs validation even when a request does not come from the website. Frontend form checks improve the user experience, but they are not the only checks.

## Seven-step presentation demo

1. **Start at Dashboard.** Explain how the summary is calculated from saved booking and payment records. Point out that sample data is included for the demonstration.
2. **Show Services.** Open a service package and explain its price and duration. Mention that services can be made inactive when they are no longer offered.
3. **Create a booking.** Choose an existing customer or add a new one, enter vehicle details, select a service, and choose a free time within opening hours.
4. **Show the wash queue.** Find the new booking, start the wash, and then mark it completed. Explain the status flow.
5. **Record a payment.** Choose Cash, UPI, or Card, mark the payment received, and open the printable receipt.
6. **Open Customers and Reports.** Show the customer history, review totals, and export CSV records. Explain that the report comes from the same saved bookings.
7. **Demonstrate persistence.** Refresh the page to show the booking remains. Finish with Settings and describe how opening hours and bay count affect new bookings.

Use a distinct vehicle number and an available time for the new booking. If the selected time is full, choose another time; that message demonstrates the scheduling check working.

## Common reviewer questions

**Why did you use React?**

React lets me split the interface into reusable components. When application state changes, React updates the displayed information without reloading the whole page.

**What is a component?**

A component is a reusable piece of the interface, such as a modal, booking form, or page. It receives values and callbacks through props.

**What is state?**

State is data React remembers while the page is open, such as the selected page, records loaded from the server, or the values in a form. Persistent records are also saved by the backend.

**What is an API?**

An API is the set of routes used to communicate with the backend. For example, creating a booking sends an HTTP request containing the form values, and the server returns the saved booking or an error message.

**Where is the data stored?**

In `server/data/store.json` on the machine running the backend. React does not write this file directly; it sends a request to Express.

**Why not MySQL or MongoDB?**

The goal was a simple project with easy setup. JSON persistence is enough to demonstrate the complete workflow locally. For multiple staff members and heavier use, I would replace the file storage with a proper database.

**Why validate in the backend if the form already checks inputs?**

A user can send a request without using the form. Server-side validation ensures that all changes follow the same rules.

**How do you avoid changing the amount on an old booking when a price changes?**

Each booking keeps its own service name, price, and duration snapshot. An edit to the service catalog applies to new bookings.

**Is recording a payment the same as collecting money?**

No. The project stores payment status and payment method for the demonstration. A real online payment feature would need a payment provider and server-side verification.

**What are environment variables used for?**

They hold configuration such as ports, the API path, and the data file location. This lets someone change the local setup without editing application logic. `VITE_` values are public browser configuration.

**What would you improve next?**

Add staff login and permissions, move storage to a database, add automated backups, and integrate a real payment provider if online payments are required.

## Suggested explanation order for the code

1. Show the frontend entry point and explain how React mounts the application.
2. Show `App.jsx` and explain page selection, loaded records, and shared actions.
3. Show a booking form and its submit handler.
4. Follow the API request to the Express route.
5. Explain the validation and JSON storage update.
6. Return to the interface and show how refreshed data appears.
7. Open one backend test to demonstrate how a business rule is checked.

Explain the feature and data flow first, then use the code to support the explanation. There is no need to memorize every line.
