// Run against an initialized, seeded CAPO database.
// Fails with an exception when collections, validators or sample records are wrong.
const testDB = db.getSiblingDB("capo_db");
const expected = ["users", "customers", "restaurantTables", "reservations", "menuCategories", "menuItems", "orders", "payments"];
function verify(condition, message) {
  if (!condition) throw new Error("FAIL: " + message);
  print("PASS: " + message);
}

for (const name of expected) {
  const info = testDB.getCollectionInfos({ name })[0];
  verify(!!info && !!info.options && !!info.options.validator, name + " has a collection validator");
}
verify(expected.every(name => testDB.getCollectionNames().includes(name)), "all 8 collections exist");

const menuIndexes = testDB.menuItems.getIndexes();
const ordersIndexes = testDB.orders.getIndexes();
verify(menuIndexes.some(idx => idx.name === "uniq_menu_sku" && idx.unique), "unique menu SKU index");
verify(ordersIndexes.some(idx => idx.name === "uniq_order_number" && idx.unique), "unique order number index");

const order = testDB.orders.findOne({ orderNumber: "DEMO-0001" });
verify(!!order && order.items.length === 2, "seeded order contains 2 items");
const itemsTotal = order.items.reduce((sum, item) => sum + item.lineTotalCentavos, 0);
verify(itemsTotal === order.totals.subtotalCentavos, "line totals equal subtotal");
verify(
  order.totals.totalCentavos ===
  order.totals.subtotalCentavos - order.totals.discountCentavos +
  order.totals.taxCentavos + order.totals.deliveryFeeCentavos,
  "order amount reconciles"
);
const payments = testDB.payments.find({ orderId: order._id, status: "PAID" }).toArray();
verify(payments.reduce((sum, payment) => sum + payment.amountCentavos, 0) === order.totals.totalCentavos,
  "payment equals billed total");
verify(testDB.menuItems.countDocuments({}) >= 3, "demo menu items seeded");

let blocked = false;
try {
  testDB.menuItems.insertOne({ sku: "SHOULD-NOT-BE-INSERTED", name: "Invalid" });
} catch (error) {
  blocked = error.code === 121 || String(error.message).includes("Document failed validation");
}
verify(blocked, "invalid menu document is rejected by MongoDB");
print("\nAll CAPO MongoDB smoke tests passed.");
