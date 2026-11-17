// CAPO sample records — safe to rerun; no passwords or real customers.
// Run after init.js. All amounts are PHP centavos.
const demoDB = db.getSiblingDB("capo_db");
const now = new Date();
const N = NumberInt;
function seeded(col, filter, doc) {
  demoDB.getCollection(col).updateOne(filter, { $setOnInsert: doc }, { upsert: true });
  return demoDB.getCollection(col).findOne(filter);
}

const customer = seeded("customers", { email: "demo.customer@example.com" }, {
  fullName: "Demo Customer", phone: "09000000000",
  email: "demo.customer@example.com", createdAt: now
});

const table1 = seeded("restaurantTables", { code: "T01" }, {
  code: "T01", capacity: N(2), isActive: true
});
const table2 = seeded("restaurantTables", { code: "T02" }, {
  code: "T02", capacity: N(4), isActive: true
});
seeded("restaurantTables", { code: "T03" }, {
  code: "T03", capacity: N(6), isActive: true
});

const silog = seeded("menuCategories", { code: "SILOG" }, {
  code: "SILOG", name: "All-Day Silog", sortOrder: N(1), isActive: true
});
const wings = seeded("menuCategories", { code: "WINGS" }, {
  code: "WINGS", name: "Chicken Wings", sortOrder: N(2), isActive: true
});
const bbq = seeded("menuCategories", { code: "BBQ" }, {
  code: "BBQ", name: "Barbecue", sortOrder: N(3), isActive: true
});

seeded("menuItems", { sku: "SILOG-TOCINO" }, {
  sku: "SILOG-TOCINO", categoryId: silog._id, name: "Pork Tocino",
  description: "Demo item with rice and egg", priceCentavos: N(12500),
  isAvailable: true, modifierGroups: [], createdAt: now, updatedAt: now
});
const buffalo = seeded("menuItems", { sku: "WINGS-BUFFALO" }, {
  sku: "WINGS-BUFFALO", categoryId: wings._id, name: "Buffalo Wings",
  description: "Demo chicken wings", priceCentavos: N(14000),
  isAvailable: true,
  modifierGroups: [{
    code: "SAUCE", name: "Extra Sauce", minSelect: N(0), maxSelect: N(1),
    options: [{ code: "DIP", name: "Extra Dip", priceDeltaCentavos: N(2000), isAvailable: true }]
  }],
  createdAt: now, updatedAt: now
});
const porkBBQ = seeded("menuItems", { sku: "BBQ-PORK" }, {
  sku: "BBQ-PORK", categoryId: bbq._id, name: "Pork BBQ",
  description: "Demo barbecue stick", priceCentavos: N(3500),
  isAvailable: true, modifierGroups: [], createdAt: now, updatedAt: now
});

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const later = new Date(tomorrow.getTime() + 90 * 60 * 1000);
seeded("reservations", { reservationCode: "DEMO-RSV-0001" }, {
  reservationCode: "DEMO-RSV-0001",
  customerId: customer._id, tableId: table2._id, startAt: tomorrow, endAt: later,
  guestCount: N(3), status: "CONFIRMED", notes: "Fictional booking for testing",
  createdAt: now, updatedAt: now
});

// Embedded snapshots preserve billed amounts even if the menu is edited later.
// Buffalo Wings: 140.00 + 20.00 dip = 160.00; Pork BBQ: 2 x 35.00 = 70.00.
// Total: PHP 230.00.
const order = seeded("orders", { orderNumber: "DEMO-0001" }, {
  orderNumber: "DEMO-0001", customerId: customer._id, tableId: table1._id,
  orderType: "DINE_IN", status: "COMPLETED",
  items: [
    {
      menuItemId: buffalo._id, sku: buffalo.sku, name: buffalo.name,
      quantity: N(1), unitPriceCentavos: N(14000),
      selectedModifiers: [{ groupCode: "SAUCE", optionCode: "DIP", name: "Extra Dip", priceDeltaCentavos: N(2000) }],
      lineTotalCentavos: N(16000)
    },
    {
      menuItemId: porkBBQ._id, sku: porkBBQ.sku, name: porkBBQ.name,
      quantity: N(2), unitPriceCentavos: N(3500),
      selectedModifiers: [], lineTotalCentavos: N(7000)
    }
  ],
  totals: {
    subtotalCentavos: N(23000), discountCentavos: N(0),
    taxCentavos: N(0), deliveryFeeCentavos: N(0), totalCentavos: N(23000)
  },
  notes: "Fictional completed order", createdAt: now, updatedAt: now
});

seeded("payments", { transactionReference: "DEMO-PAY-0001" }, {
  orderId: order._id, amountCentavos: N(23000), method: "CASH",
  status: "PAID", transactionReference: "DEMO-PAY-0001",
  paidAt: now, createdAt: now
});

print("Seed complete: demo customer, 3 tables, 3 categories, 3 menu items, 1 reservation, 1 order, 1 payment.");
print("Demo order = " + order.orderNumber + " | PHP " + order.totals.totalCentavos / 100);
