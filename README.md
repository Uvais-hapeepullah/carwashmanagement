# Washwise — Car Wash Management

A simple car wash management project built with **React, JavaScript, and Express**. It includes a dashboard, bookings, a wash queue, customer records, service packages, payment records, and reports.

The backend saves data in a JSON file, so you do not need to install or configure a database. Sample records are created automatically when the server starts for the first time.

## Run the project

Install Node.js 22.12 or later, then open a terminal in this folder:

```powershell
cd "D:\dummy\car wash management"
npm install
npm run dev
```

Open **http://localhost:5173**. Keep the terminal running while using the website.

The development command starts both applications:

- React frontend: `http://localhost:5173`
- Express backend: `http://127.0.0.1:4000`

The included `.env` file is ready for local use. `.env.example` is a clean copy of the same settings to share with another developer.

## What you can do

| Area       | Features                                                                             |
| ---------- | ------------------------------------------------------------------------------------ |
| Dashboard  | Review daily bookings, revenue, wash activity, and recent bookings.                  |
| Bookings   | Create, view, and update bookings with a customer, vehicle, service, date, and time. |
| Wash queue | Start a scheduled wash, complete an active wash, or cancel a booking.                |
| Customers  | Add and edit customer contact details, and view their booking history.               |
| Services   | Manage service names, prices, durations, and availability.                           |
| Payments   | Record Cash, UPI, or Card payments and print a receipt.                              |
| Reports    | Review booking and payment totals and export records as CSV.                         |
| Settings   | Update business details, opening hours, and the number of wash bays.                 |

The server checks required fields, business hours, and wash bay availability. Customer and service records used by a booking cannot be deleted. A used service can be made inactive instead. Paid bookings cannot be deleted, and their booked service, price, vehicle, date, time, and payment method are protected.

## Useful commands

```powershell
npm run dev   # Start the frontend and backend for development
npm test      # Run backend checks
npm run build # Create the frontend production build
npm start     # Serve the built website and API from the Express server
```

After `npm run build` followed by `npm start`, open **http://127.0.0.1:4000**. Stop the development server first if it is already using port 4000.

## Environment settings

| Variable        | Default                    | Purpose                                                        |
| --------------- | -------------------------- | -------------------------------------------------------------- |
| `PORT`          | `4000`                     | Backend port.                                                  |
| `HOST`          | `127.0.0.1`                | Backend host for local use.                                    |
| `CLIENT_ORIGIN` | `http://localhost:5173`    | Allowed development frontend origin.                           |
| `DATA_FILE`     | `./server/data/store.json` | Location of the saved records, relative to the project folder. |
| `VITE_API_URL`  | `/api`                     | API address used by React.                                     |
| `VITE_APP_NAME` | `Washwise`                 | Application name used by the frontend.                         |
| `VITE_DEV_PORT` | `5173`                     | Frontend development port.                                     |

Restart the development server after changing environment settings. If you change the frontend port, update `CLIENT_ORIGIN` to match. Variables beginning with `VITE_` are included in the browser application; never put passwords or private keys in them.

## Saved data

The server creates `server/data/store.json` on first startup. Bookings and other changes remain after a browser refresh or server restart. The data file and `.env` are excluded from Git.

Sample booking dates are based on the day the data file is first created. They are not regenerated at every startup, so older sample bookings stay in the history.

To return to the sample data, stop the server, back up your data file if needed, and remove only `server/data/store.json`. Starting the server again creates fresh sample records. This removes your saved changes, so do it only when you intend to reset the demo.

## Deploy a free public demo on Render

The root `render.yaml` defines one free Node web service that serves both the React production build and the Express API. In Render, choose **New → Blueprint**, connect this GitHub repository, select the `main` branch, and use `render.yaml`. The Blueprint includes the build command, start command, environment settings, Singapore region, and `/api/health` health check. Render supplies `PORT` automatically.

The [free service sleeps after 15 minutes without traffic](https://render.com/docs/free), and its local JSON changes are lost when it sleeps, restarts, or redeploys. Fresh demo records are created when the data file is missing. This free configuration does not attach a paid disk or database.

This is a public demonstration with no login: anyone with the website address can read and change its records. Use sample customer details rather than real customer data. Payment buttons record a status; they do not charge money.

## Project explanation

See [the project guide](docs/PROJECT_GUIDE.md) for the architecture, a seven-step presentation demo, and answers to common reviewer questions.

This is a local educational project. Payment buttons record a payment status; they do not charge a bank card or connect to a payment provider. There is no login system, and JSON file storage is intended for a small local demonstration.

## Troubleshooting

- **The page cannot reach the server:** start the project using `npm run dev`, which runs both parts. Check the terminal for startup errors.
- **A port is already in use:** stop the other process or change the corresponding port in `.env`, then restart. Keep `CLIENT_ORIGIN` consistent with the frontend URL.
- **A booking cannot be saved:** check the form and the displayed server message. The chosen time must fit within business hours and available wash bays.
- **The built website is missing:** run `npm run build` before `npm start`.
- **Dependencies fail to install:** check your Node.js version and internet connection, then run `npm install` again.
