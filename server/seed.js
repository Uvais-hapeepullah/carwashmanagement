// Demo data is created once, when the JSON data file does not exist yet.
import { randomUUID } from "node:crypto";

export function localDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function createSeed() {
  const settings = {
    businessName: "Washwise",
    ownerName: "Alex Morgan",
    phone: "+91 98765 43210",
    email: "hello@washwise.example",
    address: "24 Green Park Road, Chennai",
    openingTime: "08:00",
    closingTime: "19:00",
    bays: 3,
  };
  const services = [
    {
      id: randomUUID(),
      name: "Express Wash",
      description: "A fresh exterior wash, wheel clean, and towel dry.",
      price: 399,
      duration: 30,
      color: "teal",
      active: true,
    },
    {
      id: randomUUID(),
      name: "Premium Wash",
      description: "Exterior foam wash, interior vacuum, and dashboard care.",
      price: 799,
      duration: 60,
      color: "blue",
      active: true,
    },
    {
      id: randomUUID(),
      name: "Full Detailing",
      description:
        "A deep clean inside and out, finished with protective polish.",
      price: 1999,
      duration: 120,
      color: "purple",
      active: true,
    },
    {
      id: randomUUID(),
      name: "Interior Care",
      description: "Seats, carpets, glass, and surfaces, cleaned with care.",
      price: 599,
      duration: 45,
      color: "orange",
      active: true,
    },
  ];
  const names = [
    "Arjun Sharma",
    "Priya Nair",
    "Rahul Mehta",
    "Sneha Iyer",
    "Vikram Patel",
    "Ananya Rao",
    "Karthik Kumar",
    "Neha Singh",
    "Aditya Menon",
  ];
  const customers = names.map((name, index) => ({
    id: randomUUID(),
    name,
    phone: `98765432${String(10 + index).padStart(2, "0")}`,
    email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
  }));
  const vehicles = [
    "Hyundai Creta",
    "Maruti Baleno",
    "Honda City",
    "Tata Nexon",
    "Kia Seltos",
    "Toyota Innova",
    "Hyundai i20",
    "Mahindra XUV700",
    "Maruti Swift",
  ];
  const bookings = [];
  let reference = 1001;
  function addBooking(
    customerIndex,
    serviceIndex,
    date,
    time,
    status,
    paymentStatus,
  ) {
    const service = services[serviceIndex];
    bookings.push({
      id: randomUUID(),
      reference: `WW-${reference++}`,
      customerId: customers[customerIndex].id,
      serviceId: service.id,
      vehicle: vehicles[customerIndex],
      vehicleNumber: `TN 09 AB ${1201 + customerIndex}`,
      date,
      time,
      notes: "",
      status,
      paymentStatus,
      paymentMethod: ["UPI", "Cash", "Card"][customerIndex % 3],
      price: service.price,
      duration: service.duration,
      serviceName: service.name,
    });
  }
  for (let daysAgo = 6; daysAgo >= 1; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const day = localDate(date);
    for (let index = 0; index < 3 + (daysAgo % 3); index++) {
      addBooking(
        (daysAgo + index) % customers.length,
        (daysAgo + index) % services.length,
        day,
        `${String(9 + index * 2).padStart(2, "0")}:00`,
        "completed",
        "paid",
      );
    }
  }
  const today = localDate();
  addBooking(0, 0, today, "08:00", "completed", "paid");
  addBooking(1, 1, today, "08:30", "completed", "paid");
  addBooking(2, 3, today, "09:00", "completed", "paid");
  addBooking(3, 2, today, "10:00", "in-progress", "unpaid");
  addBooking(4, 1, today, "11:00", "in-progress", "unpaid");
  addBooking(5, 0, today, "13:00", "scheduled", "unpaid");
  addBooking(6, 3, today, "14:30", "scheduled", "unpaid");
  addBooking(7, 1, today, "16:00", "scheduled", "unpaid");
  return { settings, services, customers, bookings };
}
