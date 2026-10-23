import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const token = "b".repeat(64);
const customer = {
  name: "Browser Test",
  email: "browser@example.com",
  phone: "+447707328060",
  notes: "",
};
let paid = false,
  authenticated = false;
let shopBody;
let bookingBody;
let consultation;
let record = {
  id: "ELS-browser-test",
  type: "sale",
  createdAt: new Date().toISOString(),
  customer,
  items: [
    {
      id: "tropic-skincare-kit-1",
      name: "Tropic ABC Skincare Essentials Collection",
      quantity: 1,
      unitPricePence: 3400,
    },
  ],
  subtotalPence: 3400,
  discountPence: 340,
  shippingPence: 0,
  totalPence: 3060,
  amountDuePence: 3060,
  paidPence: 0,
  refundedPence: 0,
  status: "awaiting_payment",
  paymentStatus: "unpaid",
  receiptToken: token,
  ownerNotes: "",
  revision: 1,
};
await context.route("**/api/**", async (route) => {
  const path = new URL(route.request().url()).pathname;
  const method = route.request().method();
  let body = {},
    status = 200;
  if (path === "/api/shop/checkout") {
    shopBody = route.request().postDataJSON();
    body = {
      recordId: record.id,
      receiptToken: token,
      url: `http://localhost:3000/?receipt=${token}#payment`,
    };
  } else if (path === "/api/availability") {
    const selection = route.request().postDataJSON();
    body = {
      date: selection.date,
      slots: ["11:00", "13:00", "16:00"],
      durationMinutes:
        30 +
        selection.customTreatments.reduce(
          (sum, item) => sum + item.durationMinutes,
          0,
        ),
      breakMinutes: 30,
      closed: false,
    };
  } else if (path.startsWith("/api/receipts/"))
    body = {
      receipt: {
        ...record,
        customer: undefined,
        paidPence: paid ? 3060 : 0,
        paymentStatus: paid ? "paid" : "unpaid",
        status: paid ? "confirmed" : "awaiting_payment",
      },
    };
  else if (path === "/api/bookings") {
    bookingBody = route.request().postDataJSON();
    record = {
      ...record,
      type: "booking",
      consultationStatus: "awaiting_review",
      status: "requested",
      paymentStatus: "unpaid",
      items: [
        {
          id: "hydrodemabrasion-facial",
          name: "Hydrodermabrasion Facial",
          quantity: 1,
          unitPricePence: 3500,
        },
        {
          id: "custom-0",
          name: "Custom relaxation",
          quantity: 1,
          unitPricePence: null,
          custom: true,
          duration: "30 mins",
        },
      ],
      date: bookingBody.date,
      time: bookingBody.time,
      totalPence: 3500,
      amountDuePence: 1750,
      discountPence: 0,
      paidPence: 0,
    };
    consultation = {
      input: bookingBody.consultation,
      submittedAt: new Date().toISOString(),
      status: "awaiting_review",
      notes: "",
    };
    body = { receipt: record, receiptToken: token };
    status = 201;
  } else if (path === "/api/owner/session") {
    body = authenticated
      ? { authenticated: true }
      : { error: "Sign in to the owner dashboard." };
    status = authenticated ? 200 : 401;
  } else if (path === "/api/owner/login") {
    authenticated = true;
    body = { authenticated: true };
  } else if (path === "/api/owner/records") body = { records: [record] };
  else if (path.endsWith("/consultation")) {
    if (method === "PATCH") {
      consultation = { ...consultation, ...route.request().postDataJSON() };
      record = { ...record, consultationStatus: consultation.status };
    }
    body = { consultation };
  } else if (path.endsWith("/approve")) {
    const payload = route.request().postDataJSON();
    assert.equal(payload.customPrices[0].pricePence, 2500);
    record = {
      ...record,
      items: record.items.map((i) =>
        i.custom ? { ...i, unitPricePence: 2500 } : i,
      ),
      totalPence: 6000,
      amountDuePence: 3000,
      status: "awaiting_payment",
      checkoutUrl: "https://checkout.stripe.com/test/browser",
      expiresAt: Date.now() + 86400000,
    };
    body = { record };
  } else if (path === "/api/owner/logout") {
    authenticated = false;
    body = { authenticated: false };
  } else if (method === "PATCH") {
    record = { ...record, ...route.request().postDataJSON() };
    body = { record };
  } else {
    status = 404;
    body = { error: "Unknown browser test route" };
  }
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
});
mkdirSync("./test-results/browser", { recursive: true });
try {
  await page.goto("http://localhost:3000/#shop");
  await page.evaluate(() =>
    localStorage.setItem(
      "elysian_cart",
      JSON.stringify([
        { product: { id: "tropic-skincare-kit-1" }, quantity: 1 },
      ]),
    ),
  );
  await page.goto("http://localhost:3000/#basket");
  await page.reload();
  await page.getByLabel("Full name", { exact: true }).fill("Browser Test");
  await page.getByLabel("Email", { exact: true }).fill(customer.email);
  await page.getByLabel("Phone", { exact: true }).fill(customer.phone);
  await page.getByLabel("Promotion code (optional)").fill("ELYSIAN10");
  assert.match(await page.locator("main").innerText(), /£3\.40/);
  await page.screenshot({
    path: "./test-results/browser/shop-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Continue to Stripe checkout" })
    .click();
  await page.waitForURL("**#payment");
  await page.getByRole("heading", { name: "Checking payment…" }).waitFor();
  assert.deepEqual(shopBody.items, [
    { productId: "tropic-skincare-kit-1", quantity: 1 },
  ]);
  assert.equal(shopBody.totalPence, undefined);
  paid = true;
  await page.getByRole("button", { name: "Refresh status" }).click();
  await page
    .getByRole("heading", { name: "Payment received — order confirmed" })
    .waitFor();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("elysian_cart")).length === 0,
  );
  await page.screenshot({
    path: "./test-results/browser/verified-receipt.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Back to Elysian" }).click();
  await page.getByRole("heading", { name: "Your basket is empty" }).waitFor();
  await page.locator("#nav-book-btn").click();
  const dialog = page.getByRole("dialog", { name: "Request an appointment" });
  await dialog.getByLabel("Full name", { exact: true }).fill(customer.name);
  await dialog.getByLabel("Email", { exact: true }).fill(customer.email);
  await dialog.getByLabel("Phone", { exact: true }).fill(customer.phone);
  await dialog
    .getByLabel("Appointment date", { exact: true })
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  await dialog.getByLabel("Treatment name").fill("Custom relaxation");
  await dialog.getByRole("button", { name: "Add custom treatment" }).click();
  await dialog
    .getByLabel("Available time (UK)", { exact: true })
    .selectOption("11:00");
  await dialog
    .getByLabel("Full name for health consent", { exact: true })
    .fill("Browser Test");
  const health = dialog.getByRole("region", {
    name: "Pre-treatment health screening",
  });
  for (const select of await health.getByRole("combobox").all())
    await select.selectOption("no");
  for (const checkbox of await health.getByRole("checkbox").all())
    await checkbox.check();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: "./test-results/browser/booking-mobile.png",
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Request appointment", exact: true })
    .click();
  await dialog
    .getByRole("heading", { name: "Appointment request received" })
    .waitFor();
  assert.equal(bookingBody.customTreatments[0].pricePence, undefined);
  assert.equal(bookingBody.consultation.participants[0].ageConfirmed, true);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.goto("http://localhost:3000/#owner");
  const owner = page.getByRole("dialog", {
    name: "Owner dashboard",
  });
  await owner.getByLabel("Username").fill("owner");
  await owner.getByLabel("Password").fill("local-browser-test");
  await owner.getByRole("button", { name: "Sign in", exact: true }).click();
  await owner.getByRole("button", { name: /Browser Test/ }).click();
  await owner
    .getByRole("button", { name: "Open private health review", exact: true })
    .click();
  await owner
    .getByRole("combobox", { name: "Consultation decision", exact: true })
    .selectOption("approved");
  await owner
    .getByRole("checkbox", {
      name: "I have checked the selected treatments against the exact product/device protocol, my training and insurance requirements.",
      exact: true,
    })
    .check();
  await owner
    .getByRole("checkbox", {
      name: "I have completed the client consultation and resolved relevant health questions for every guest.",
      exact: true,
    })
    .check();
  await owner
    .getByRole("button", { name: "Save private consultation", exact: true })
    .click();
  await owner
    .getByLabel("Approve unit price (£) — Custom relaxation")
    .fill("25");
  await owner
    .getByRole("checkbox", {
      name: "I have checked appointment availability and approved this quote.",
      exact: true,
    })
    .check();
  await owner
    .getByRole("button", { name: "Approve and create 50% deposit link" })
    .click();
  await owner.getByLabel("Customer checkout link").waitFor();
  await page.screenshot({
    path: "./test-results/browser/owner-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await owner.getByRole("button", { name: "Sign out", exact: true }).click();
  await owner.getByRole("heading", { name: "Owner sign in" }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: shop form, penny discount, verified receipt, purchased cart clearing, booking custom quote, mobile layout, owner approval, logout, Escape dismissal. Stripe API responses were fixtures; no actual sandbox checkout was performed.",
  );
} catch (error) {
  console.log("Browser failure URL:", page.url());
  console.log("Browser page errors:", JSON.stringify(errors));
  console.log(
    "Browser body:",
    (await page.locator("body").innerText()).slice(0, 6000),
  );
  await page.screenshot({
    path: "./test-results/browser/failure.png",
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
}
