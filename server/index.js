import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSeed } from "./seed.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const statuses = ["scheduled", "in-progress", "completed", "cancelled"];
const paymentMethods = ["Cash", "UPI", "Card"];
const activeBooking = (booking) =>
  ["scheduled", "in-progress"].includes(booking.status);
const minutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const normalizedPlate = (plate) => plate.replace(/[^A-Z0-9]/g, "");

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function text(value, label, max = 120, required = true) {
  if (typeof value !== "string") {
    if (!required && value === undefined) return "";
    fail(`${label} must be text.`);
  }
  const result = value.trim();
  if (required && !result) fail(`${label} is required.`);
  if (result.length > max) fail(`${label} must be ${max} characters or fewer.`);
  return result;
}

function phone(value) {
  const result = text(value, "Phone", 24);
  const digits = result.replace(/\D/g, "");
  if (!/^[+\d\s()-]+$/.test(result) || digits.length < 7 || digits.length > 15)
    fail("Enter a valid phone number with 7 to 15 digits.");
  return result;
}

function email(value) {
  const result = text(value, "Email", 160, false);
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail("Enter a valid email address.");
  return result;
}

function number(value, label, min, max, integer = false) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    fail(
      `${label} must be ${integer ? "a whole number " : ""}between ${min} and ${max}.`,
    );
  }
  return value;
}

function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail("Enter a valid booking date.");
  const parsed = new Date(`${value}T12:00:00Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    fail("Enter a real calendar date.");
  return value;
}

function time(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    fail("Enter a valid time in HH:mm format.");
  return value;
}

function enumValue(value, allowed, label) {
  if (!allowed.includes(value))
    fail(`${label} must be one of: ${allowed.join(", ")}.`);
  return value;
}

function findItem(store, collection, id) {
  const item = store[collection].find((entry) => entry.id === id);
  if (!item) fail("The requested record was not found.", 404);
  return item;
}

function validateCustomer(input, store, id) {
  const result = {
    name: text(input.name, "Customer name", 80),
    phone: phone(input.phone),
    email: email(input.email),
  };
  if (
    store.customers.some(
      (entry) =>
        entry.id !== id &&
        entry.phone.replace(/\D/g, "") === result.phone.replace(/\D/g, ""),
    )
  ) {
    fail("A customer with this phone number already exists.", 409);
  }
  return result;
}

function validateService(input) {
  if (input.active !== undefined && typeof input.active !== "boolean")
    fail("Service availability must be true or false.");
  return {
    name: text(input.name, "Service name", 80),
    description: text(input.description, "Description", 300, false),
    price: Math.round(number(input.price, "Price", 1, 100000) * 100) / 100,
    duration: number(input.duration, "Duration", 5, 480, true),
    color: enumValue(
      input.color ?? "teal",
      ["teal", "blue", "purple", "orange"],
      "Service color",
    ),
    active: input.active ?? true,
  };
}

function validateSlot(booking, store, excludeId) {
  if (!activeBooking(booking)) return;
  if (
    booking.status === "in-progress" &&
    store.bookings.filter(
      (entry) =>
        entry.id !== excludeId &&
        entry.status === "in-progress" &&
        entry.date === booking.date,
    ).length >= store.settings.bays
  ) {
    fail(
      "All wash bays are occupied. Complete another wash before starting this one.",
      409,
    );
  }
  const start = minutes(booking.time);
  const end = start + booking.duration;
  if (
    start < minutes(store.settings.openingTime) ||
    end > minutes(store.settings.closingTime)
  ) {
    fail(
      `This service must fit within business hours (${store.settings.openingTime}–${store.settings.closingTime}).`,
    );
  }
  const overlapping = store.bookings.filter(
    (entry) =>
      entry.id !== excludeId &&
      activeBooking(entry) &&
      entry.date === booking.date &&
      minutes(entry.time) < end &&
      minutes(entry.time) + entry.duration > start,
  );
  if (
    overlapping.some(
      (entry) =>
        normalizedPlate(entry.vehicleNumber) ===
        normalizedPlate(booking.vehicleNumber),
    )
  ) {
    fail("This vehicle already has an overlapping booking.", 409);
  }
  // Count simultaneous washes at each interval boundary, not all bookings that
  // overlap any part of a long service (which would reject valid free slots).
  const points = [
    start,
    ...overlapping
      .map((entry) => minutes(entry.time))
      .filter((point) => point >= start && point < end),
  ];
  if (
    points.some(
      (point) =>
        overlapping.filter(
          (entry) =>
            minutes(entry.time) <= point &&
            minutes(entry.time) + entry.duration > point,
        ).length >= store.settings.bays,
    )
  ) {
    fail(
      "All wash bays are booked during this time. Choose another time.",
      409,
    );
  }
}

function validateBooking(input, store, previous) {
  const merged = { ...previous, ...input };
  const customer = findItem(store, "customers", merged.customerId);
  const service = findItem(store, "services", merged.serviceId);
  const changedService = !previous || previous.serviceId !== service.id;
  if (changedService && !service.active)
    fail("This service is inactive. Choose an available service.");
  const status = enumValue(
    merged.status ?? "scheduled",
    statuses,
    "Booking status",
  );
  const paymentStatus = enumValue(
    merged.paymentStatus ?? "unpaid",
    ["unpaid", "paid"],
    "Payment status",
  );
  if (!previous && status !== "scheduled")
    fail("New bookings must start as scheduled.");
  if (previous && status !== previous.status) {
    const transitions = {
      scheduled: ["in-progress", "cancelled"],
      "in-progress": ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };
    if (!transitions[previous.status].includes(status))
      fail(`A ${previous.status} booking cannot change to ${status}.`);
  }
  const booking = {
    customerId: customer.id,
    serviceId: service.id,
    vehicle: text(merged.vehicle, "Vehicle model", 80),
    vehicleNumber: text(
      merged.vehicleNumber,
      "Vehicle registration",
      24,
    ).toUpperCase(),
    date: date(merged.date),
    time: time(merged.time),
    notes: text(merged.notes, "Notes", 500, false),
    status,
    paymentStatus,
    paymentMethod: enumValue(
      merged.paymentMethod ?? "Cash",
      paymentMethods,
      "Payment method",
    ),
    price: changedService ? service.price : previous.price,
    duration: changedService ? service.duration : previous.duration,
    serviceName: changedService ? service.name : previous.serviceName,
  };
  if (!/^[A-Z0-9][A-Z0-9 -]{2,23}$/.test(booking.vehicleNumber))
    fail("Enter a valid vehicle registration using letters and numbers.");
  if (
    previous &&
    (["completed", "cancelled"].includes(previous.status) ||
      previous.paymentStatus === "paid")
  ) {
    const locked = [
      "customerId",
      "serviceId",
      "vehicle",
      "vehicleNumber",
      "date",
      "time",
    ];
    if (locked.some((key) => booking[key] !== previous[key]))
      fail("Paid, completed, and cancelled booking details cannot be changed.");
  }
  if (previous?.paymentStatus === "paid" && paymentStatus !== "paid")
    fail("A recorded payment cannot be changed back to unpaid.");
  if (
    previous?.paymentStatus === "paid" &&
    booking.paymentMethod !== previous.paymentMethod
  )
    fail("The payment method on a paid booking cannot be changed.");
  if (status === "cancelled" && paymentStatus === "paid")
    fail("Paid bookings cannot be cancelled.");
  if (status === "cancelled" && input.paymentStatus === "paid")
    fail("Cancelled bookings cannot receive payments.");
  validateSlot(booking, store, previous?.id);
  return booking;
}

function validateSettings(input, previous) {
  const merged = { ...previous, ...input };
  const result = {
    businessName: text(merged.businessName, "Business name", 80),
    ownerName: text(merged.ownerName, "Owner name", 80),
    phone: phone(merged.phone),
    email: email(merged.email),
    address: text(merged.address, "Address", 240, false),
    openingTime: time(merged.openingTime),
    closingTime: time(merged.closingTime),
    bays: number(merged.bays, "Wash bays", 1, 20, true),
  };
  if (minutes(result.closingTime) <= minutes(result.openingTime))
    fail("Closing time must be later than opening time.");
  return result;
}

export function createApp({
  dataFile = resolve(
    process.cwd(),
    process.env.DATA_FILE || "server/data/store.json",
  ),
} = {}) {
  mkdirSync(dirname(dataFile), { recursive: true });
  let store;
  if (existsSync(dataFile)) {
    store = JSON.parse(readFileSync(dataFile, "utf8"));
    if (
      !store.settings ||
      !Array.isArray(store.customers) ||
      !Array.isArray(store.services) ||
      !Array.isArray(store.bookings)
    ) {
      throw new Error(
        "The data file has an invalid structure. Restore a backup or remove it to start with demo data.",
      );
    }
  } else {
    store = createSeed();
    writeFileSync(dataFile, JSON.stringify(store, null, 2));
  }
  function updateStore(change) {
    const next = structuredClone(store);
    const result = change(next);
    // Persist before replacing memory, so an unsuccessful write changes neither.
    const temporary = `${dataFile}.tmp`;
    writeFileSync(temporary, JSON.stringify(next, null, 2));
    renameSync(temporary, dataFile);
    store = next;
    return result;
  }
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    if (req.headers.origin === origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS",
      );
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", (req, res, next) => {
    if (
      ["POST", "PUT"].includes(req.method) &&
      (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
    ) {
      return res
        .status(400)
        .json({ message: "Send a JSON object as the request body." });
    }
    next();
  });
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.get("/api/bootstrap", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(store);
  });

  app.post("/api/customers", (req, res) => {
    const customer = { id: randomUUID(), ...validateCustomer(req.body, store) };
    updateStore((next) => next.customers.push(customer));
    res.status(201).json(customer);
  });
  app.put("/api/customers/:id", (req, res) => {
    const existing = findItem(store, "customers", req.params.id);
    const customer = {
      ...existing,
      ...validateCustomer({ ...existing, ...req.body }, store, existing.id),
    };
    updateStore((next) => {
      next.customers[
        next.customers.findIndex((entry) => entry.id === existing.id)
      ] = customer;
    });
    res.json(customer);
  });
  app.delete("/api/customers/:id", (req, res) => {
    findItem(store, "customers", req.params.id);
    if (store.bookings.some((booking) => booking.customerId === req.params.id))
      fail("This customer has bookings and cannot be deleted.", 409);
    updateStore((next) => {
      next.customers = next.customers.filter(
        (entry) => entry.id !== req.params.id,
      );
    });
    res.json({ message: "Customer deleted." });
  });

  app.post("/api/services", (req, res) => {
    const service = { id: randomUUID(), ...validateService(req.body) };
    updateStore((next) => next.services.push(service));
    res.status(201).json(service);
  });
  app.put("/api/services/:id", (req, res) => {
    const existing = findItem(store, "services", req.params.id);
    const service = {
      ...existing,
      ...validateService({ ...existing, ...req.body }),
    };
    updateStore((next) => {
      next.services[
        next.services.findIndex((entry) => entry.id === existing.id)
      ] = service;
    });
    res.json(service);
  });
  app.delete("/api/services/:id", (req, res) => {
    findItem(store, "services", req.params.id);
    if (store.bookings.some((booking) => booking.serviceId === req.params.id))
      fail("This service has bookings. Set it to inactive instead.", 409);
    updateStore((next) => {
      next.services = next.services.filter(
        (entry) => entry.id !== req.params.id,
      );
    });
    res.json({ message: "Service deleted." });
  });

  app.post("/api/bookings", (req, res) => {
    const values = validateBooking(req.body, store);
    const largestReference = store.bookings.reduce(
      (largest, booking) =>
        Math.max(largest, Number(booking.reference.replace("WW-", "")) || 1000),
      1000,
    );
    const booking = {
      id: randomUUID(),
      reference: `WW-${largestReference + 1}`,
      ...values,
    };
    updateStore((next) => next.bookings.push(booking));
    res.status(201).json(booking);
  });
  app.put("/api/bookings/:id", (req, res) => {
    const existing = findItem(store, "bookings", req.params.id);
    const booking = {
      id: existing.id,
      reference: existing.reference,
      ...validateBooking(req.body, store, existing),
    };
    updateStore((next) => {
      next.bookings[
        next.bookings.findIndex((entry) => entry.id === existing.id)
      ] = booking;
    });
    res.json(booking);
  });
  app.delete("/api/bookings/:id", (req, res) => {
    const booking = findItem(store, "bookings", req.params.id);
    if (booking.paymentStatus === "paid")
      fail(
        "Paid bookings cannot be deleted; keep them for your payment records.",
        409,
      );
    updateStore((next) => {
      next.bookings = next.bookings.filter(
        (entry) => entry.id !== req.params.id,
      );
    });
    res.json({ message: "Booking deleted." });
  });

  app.put("/api/settings", (req, res) => {
    const settings = validateSettings(req.body, store.settings);
    const candidate = { ...store, settings };
    store.bookings
      .filter(activeBooking)
      .forEach((booking) => validateSlot(booking, candidate, booking.id));
    updateStore((next) => {
      next.settings = settings;
    });
    res.json(settings);
  });

  app.use("/api", (req, res) =>
    res.status(404).json({ message: "API endpoint not found." }),
  );
  const dist = join(projectRoot, "dist");
  if (existsSync(join(dist, "index.html"))) {
    app.use(express.static(dist));
    app.get("/{*path}", (req, res) => res.sendFile(join(dist, "index.html")));
  }
  app.use((error, req, res, next) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error.message);
    res
      .status(status)
      .json({
        message:
          error.type === "entity.parse.failed"
            ? "Request body must be valid JSON."
            : status >= 500
              ? "The server could not save your changes. Please try again."
              : error.message,
      });
  });
  return app;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || "127.0.0.1";
  createApp().listen(port, host, () =>
    console.log(`Washwise API is ready at http://${host}:${port}`),
  );
}
