// Run with npm test. Tests use temporary files and never change the demo store.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createApp } from "../server/index.js";

async function fixture(t) {
  const folder = mkdtempSync(join(tmpdir(), "washwise-test-"));
  const dataFile = join(folder, "store.json");
  let server;
  let base;
  async function start() {
    server = createApp({ dataFile }).listen(0, "127.0.0.1");
    await once(server, "listening");
    base = `http://127.0.0.1:${server.address().port}`;
  }
  await start();
  t.after(async () => {
    if (server.listening) await new Promise((done) => server.close(done));
    rmSync(folder, { recursive: true, force: true });
  });
  async function request(path, method = "GET", body) {
    const response = await fetch(`${base}/api${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      headers: response.headers,
    };
  }
  const initial = (await request("/bootstrap")).data;
  const customer = initial.customers[0];
  const service = initial.services[0];
  function booking(overrides = {}) {
    return {
      customerId: customer.id,
      serviceId: service.id,
      vehicle: "Test Sedan",
      vehicleNumber: "TN 01 ZZ 9999",
      date: "2030-01-10",
      time: "10:00",
      notes: "",
      ...overrides,
    };
  }
  return {
    request,
    initial,
    booking,
    dataFile,
    async restart() {
      await new Promise((done) => server.close(done));
      await start();
    },
  };
}

test("first boot creates demo data, health responds, unknown APIs return JSON 404", async (t) => {
  const { request, initial } = await fixture(t);
  assert.equal(initial.services.length, 4);
  assert.equal(initial.customers.length, 9);
  assert.ok(initial.bookings.length > 8);
  assert.equal((await request("/health")).data.status, "ok");
  assert.equal(
    (await request("/bootstrap")).headers.get("cache-control"),
    "no-store",
  );
  assert.equal((await request("/missing")).status, 404);
});

test("customer and service CRUD persists across a server restart", async (t) => {
  const { request, restart } = await fixture(t);
  const customer = await request("/customers", "POST", {
    name: "Test Customer",
    phone: "9123456789",
    email: "test@example.com",
  });
  assert.equal(customer.status, 201);
  assert.ok(customer.data.id);
  assert.equal(
    (
      await request(`/customers/${customer.data.id}`, "PUT", {
        name: "Updated Customer",
      })
    ).status,
    200,
  );
  const service = await request("/services", "POST", {
    name: "Test Wash",
    description: "",
    price: 450,
    duration: 35,
    color: "blue",
  });
  assert.equal(service.status, 201);
  await restart();
  const saved = (await request("/bootstrap")).data;
  assert.equal(
    saved.customers.find((entry) => entry.id === customer.data.id).name,
    "Updated Customer",
  );
  assert.equal(
    saved.services.find((entry) => entry.id === service.data.id).price,
    450,
  );
  assert.equal(
    (await request(`/customers/${customer.data.id}`, "DELETE")).status,
    200,
  );
  assert.equal(
    (await request(`/services/${service.data.id}`, "DELETE")).status,
    200,
  );
});

test("invalid input is rejected without changing stored records", async (t) => {
  const { request, initial, booking, dataFile } = await fixture(t);
  const before = readFileSync(dataFile, "utf8");
  assert.equal(
    (
      await request("/customers", "POST", {
        name: "",
        phone: "1",
        email: "bad",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/customers", "POST", {
        name: "Name",
        phone: "9876543299",
        email: "bad",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/customers", "POST", {
        name: "Duplicate",
        phone: initial.customers[0].phone,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request("/services", "POST", {
        name: "Bad",
        price: -1,
        duration: 30,
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("/bookings", "POST", booking({ date: "2030-02-30" })))
      .status,
    400,
  );
  assert.equal(
    (await request("/bookings", "POST", booking({ time: "25:00" }))).status,
    400,
  );
  assert.equal(
    (await request("/bookings", "POST", booking({ time: "07:30" }))).status,
    400,
  );
  assert.equal(
    (await request("/bookings", "POST", booking({ time: "18:45" }))).status,
    400,
  );
  assert.equal(
    (await request("/bookings", "POST", booking({ vehicleNumber: "???" })))
      .status,
    400,
  );
  assert.equal((await request("/customers", "POST", [])).status, 400);
  assert.equal((await request("/settings", "PUT", { bays: 0 })).status, 400);
  assert.equal(readFileSync(dataFile, "utf8"), before);
});

test("booking capacity and vehicle overlap checks respect exact boundaries", async (t) => {
  const { request, booking } = await fixture(t);
  for (let index = 0; index < 3; index++) {
    assert.equal(
      (
        await request(
          "/bookings",
          "POST",
          booking({ vehicleNumber: `TN 01 ZZ ${9000 + index}` }),
        )
      ).status,
      201,
    );
  }
  assert.equal(
    (
      await request(
        "/bookings",
        "POST",
        booking({ vehicleNumber: "TN 01 ZZ 9010" }),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        "/bookings",
        "POST",
        booking({ vehicleNumber: "TN01ZZ9000" }),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        "/bookings",
        "POST",
        booking({ vehicleNumber: "TN 01 ZZ 9000", time: "10:30" }),
      )
    ).status,
    201,
  );
});

test("a long wash may span separate bookings when simultaneous capacity remains free", async (t) => {
  const { request, initial, booking } = await fixture(t);
  for (const hour of ["10:00", "11:00"]) {
    for (let index = 0; index < 2; index++) {
      const result = await request(
        "/bookings",
        "POST",
        booking({
          time: hour,
          vehicleNumber: `TN 02 AA ${hour.slice(0, 2)}0${index}`,
        }),
      );
      assert.equal(result.status, 201);
    }
  }
  const result = await request(
    "/bookings",
    "POST",
    booking({
      serviceId: initial.services[2].id,
      time: "09:30",
      vehicleNumber: "TN 02 BB 9999",
    }),
  );
  assert.equal(result.status, 201);
});

test("service snapshots preserve the price and duration agreed at booking time", async (t) => {
  const { request, initial, booking } = await fixture(t);
  const created = (await request("/bookings", "POST", booking())).data;
  assert.equal(created.price, initial.services[0].price);
  await request(`/services/${created.serviceId}`, "PUT", {
    price: 999,
    duration: 45,
    name: "New Name",
  });
  const updated = await request(`/bookings/${created.id}`, "PUT", {
    notes: "Please clean the wheels",
  });
  assert.equal(updated.data.price, created.price);
  assert.equal(updated.data.duration, created.duration);
  assert.equal(updated.data.serviceName, created.serviceName);
  const changed = await request(`/bookings/${created.id}`, "PUT", {
    serviceId: initial.services[1].id,
  });
  assert.equal(changed.data.price, initial.services[1].price);
  await request(`/services/${initial.services[1].id}`, "PUT", {
    active: false,
  });
  assert.equal(
    (
      await request(
        "/bookings",
        "POST",
        booking({ serviceId: initial.services[1].id, time: "14:00" }),
      )
    ).status,
    400,
  );
});

test("workflow protects terminal states and paid records while allowing payment after completion", async (t) => {
  const { request, booking } = await fixture(t);
  const created = (await request("/bookings", "POST", booking())).data;
  assert.equal(
    (await request(`/bookings/${created.id}`, "PUT", { status: "completed" }))
      .status,
    400,
  );
  assert.equal(
    (await request(`/bookings/${created.id}`, "PUT", { status: "in-progress" }))
      .status,
    200,
  );
  assert.equal(
    (await request(`/bookings/${created.id}`, "PUT", { status: "completed" }))
      .status,
    200,
  );
  assert.equal(
    (await request(`/bookings/${created.id}`, "PUT", { status: "scheduled" }))
      .status,
    400,
  );
  assert.equal(
    (await request(`/bookings/${created.id}`, "PUT", { time: "14:00" })).status,
    400,
  );
  assert.equal(
    (
      await request(`/bookings/${created.id}`, "PUT", {
        paymentStatus: "paid",
        paymentMethod: "UPI",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/bookings/${created.id}`, "PUT", {
        paymentStatus: "unpaid",
      })
    ).status,
    400,
  );
  assert.equal(
    (await request(`/bookings/${created.id}`, "DELETE")).status,
    409,
  );
  const other = (await request("/bookings", "POST", booking({ time: "14:00" })))
    .data;
  assert.equal(
    (await request(`/bookings/${other.id}`, "PUT", { status: "cancelled" }))
      .status,
    200,
  );
  assert.equal(
    (await request(`/bookings/${other.id}`, "PUT", { paymentStatus: "paid" }))
      .status,
    400,
  );
  assert.equal((await request(`/bookings/${other.id}`, "DELETE")).status, 200);
});

test("referenced customers and services cannot be deleted, settings validate active slots", async (t) => {
  const { request, initial } = await fixture(t);
  assert.equal(
    (await request(`/customers/${initial.customers[0].id}`, "DELETE")).status,
    409,
  );
  assert.equal(
    (await request(`/services/${initial.services[0].id}`, "DELETE")).status,
    409,
  );
  assert.equal(
    (await request("/settings", "PUT", { openingTime: "18:00" })).status,
    400,
  );
  assert.equal(
    (await request("/settings", "PUT", { closingTime: "07:00" })).status,
    400,
  );
  assert.equal((await request("/settings", "PUT", { bays: 1 })).status, 409);
  const settings = await request("/settings", "PUT", {
    businessName: "My Car Wash",
    bays: 4,
  });
  assert.equal(settings.status, 200);
  assert.equal(settings.data.businessName, "My Car Wash");
});

test("paid bookings preserve receipt details and payment method even before completion", async (t) => {
  const { request, initial, booking, dataFile } = await fixture(t);
  const created = (await request("/bookings", "POST", booking())).data;
  assert.equal(
    (
      await request(`/bookings/${created.id}`, "PUT", {
        paymentStatus: "paid",
        paymentMethod: "UPI",
      })
    ).status,
    200,
  );
  const before = readFileSync(dataFile, "utf8");
  const changes = [
    { customerId: initial.customers[1].id },
    { serviceId: initial.services[1].id },
    { vehicle: "Different Sedan" },
    { vehicleNumber: "TN 01 AB 8888" },
    { date: "2030-01-11" },
    { time: "14:00" },
    { paymentMethod: "Cash" },
  ];
  for (const change of changes) {
    assert.equal(
      (await request(`/bookings/${created.id}`, "PUT", change)).status,
      400,
    );
  }
  assert.equal(readFileSync(dataFile, "utf8"), before);
  assert.equal(
    (
      await request(`/bookings/${created.id}`, "PUT", {
        notes: "Receipt issued",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request(`/bookings/${created.id}`, "PUT", { status: "in-progress" }))
      .status,
    200,
  );
});

test("starting washes respects actual occupied bays even when appointment times do not overlap", async (t) => {
  const { request, booking } = await fixture(t);
  const bookings = [];
  for (let index = 0; index < 4; index++) {
    const result = await request(
      "/bookings",
      "POST",
      booking({
        time: `${10 + index}:00`,
        vehicleNumber: `TN 01 CC ${8000 + index}`,
      }),
    );
    assert.equal(result.status, 201);
    bookings.push(result.data);
  }
  for (const entry of bookings.slice(0, 3)) {
    assert.equal(
      (await request(`/bookings/${entry.id}`, "PUT", { status: "in-progress" }))
        .status,
      200,
    );
  }
  assert.equal(
    (
      await request(`/bookings/${bookings[3].id}`, "PUT", {
        status: "in-progress",
      })
    ).status,
    409,
  );
  assert.equal((await request("/settings", "PUT", { bays: 2 })).status, 409);
  assert.equal(
    (
      await request(`/bookings/${bookings[0].id}`, "PUT", {
        status: "completed",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/bookings/${bookings[3].id}`, "PUT", {
        status: "in-progress",
      })
    ).status,
    200,
  );
});
