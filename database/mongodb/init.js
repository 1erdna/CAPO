// CAPO MongoDB database schema (mongosh / MongoDB 7+).
// Safe to rerun: creates or updates validators and recreates required indexes.
// Collections are intentionally separate while order-line snapshots are embedded.
const capoDB = db.getSiblingDB("capo_db");
const str = { bsonType: "string", minLength: 1 };
const bool = { bsonType: "bool" };
const oid = { bsonType: "objectId" };
const date = { bsonType: "date" };
const money = { bsonType: "int", minimum: 0 };
const nonnegative = { bsonType: "int", minimum: 0 };
const positive = { bsonType: "int", minimum: 1 };

function applyCollection(name, required, properties) {
  const validator = { $jsonSchema: { bsonType: "object", required, properties } };
  if (capoDB.getCollectionNames().includes(name)) {
    const result = capoDB.runCommand({ collMod: name, validator, validationLevel: "strict", validationAction: "error" });
    if (!result.ok) throw new Error("Failed updating " + name + ": " + tojson(result));
  } else {
    capoDB.createCollection(name, { validator, validationLevel: "strict", validationAction: "error" });
  }
  print("Configured: " + name);
}

applyCollection("users", ["fullName", "email", "passwordHash", "role", "isActive", "createdAt"], {
  fullName: str, email: str, passwordHash: str,
  role: { enum: ["ADMIN", "STAFF", "CASHIER"] },
  isActive: bool, createdAt: date, updatedAt: date
});

applyCollection("customers", ["fullName", "createdAt"], {
  fullName: str, phone: { bsonType: "string" }, email: { bsonType: "string" },
  createdAt: date
});

applyCollection("restaurantTables", ["code", "capacity", "isActive"], {
  code: str, capacity: positive, isActive: bool
});

applyCollection("reservations", ["reservationCode", "customerId", "tableId", "startAt", "endAt", "guestCount", "status", "createdAt"], {
  reservationCode: str, customerId: oid, tableId: oid, startAt: date, endAt: date,
  guestCount: positive,
  status: { enum: ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"] },
  notes: { bsonType: "string" }, createdAt: date, updatedAt: date
});

applyCollection("menuCategories", ["code", "name", "sortOrder", "isActive"], {
  code: str, name: str, sortOrder: nonnegative, isActive: bool
});

const modifierOption = {
  bsonType: "object", required: ["code", "name", "priceDeltaCentavos", "isAvailable"],
  properties: {
    code: str, name: str, priceDeltaCentavos: money, isAvailable: bool
  }
};
const modifierGroup = {
  bsonType: "object",
  required: ["code", "name", "minSelect", "maxSelect", "options"],
  properties: {
    code: str, name: str, minSelect: nonnegative, maxSelect: nonnegative,
    options: { bsonType: "array", items: modifierOption }
  }
};
applyCollection("menuItems", ["sku", "categoryId", "name", "priceCentavos", "isAvailable", "modifierGroups"], {
  sku: str, categoryId: oid, name: str, description: { bsonType: "string" },
  priceCentavos: money, isAvailable: bool,
  modifierGroups: { bsonType: "array", items: modifierGroup },
  createdAt: date, updatedAt: date
});

const orderModifier = {
  bsonType: "object",
  required: ["groupCode", "optionCode", "name", "priceDeltaCentavos"],
  properties: { groupCode: str, optionCode: str, name: str, priceDeltaCentavos: money }
};
const orderLine = {
  bsonType: "object",
  required: ["menuItemId", "sku", "name", "quantity", "unitPriceCentavos", "selectedModifiers", "lineTotalCentavos"],
  properties: {
    menuItemId: oid, sku: str, name: str, quantity: positive,
    unitPriceCentavos: money,
    selectedModifiers: { bsonType: "array", items: orderModifier },
    lineTotalCentavos: money,
    specialInstructions: { bsonType: "string" }
  }
};
const totals = {
  bsonType: "object",
  required: ["subtotalCentavos", "discountCentavos", "taxCentavos", "deliveryFeeCentavos", "totalCentavos"],
  properties: {
    subtotalCentavos: money, discountCentavos: money,
    taxCentavos: money, deliveryFeeCentavos: money, totalCentavos: money
  }
};
applyCollection("orders", ["orderNumber", "orderType", "status", "items", "totals", "createdAt", "updatedAt"], {
  orderNumber: str, orderType: { enum: ["DINE_IN", "TAKEOUT", "DELIVERY"] },
  status: { enum: ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"] },
  customerId: { bsonType: ["objectId", "null"] },
  tableId: { bsonType: ["objectId", "null"] },
  createdByUserId: { bsonType: ["objectId", "null"] },
  items: { bsonType: "array", minItems: 1, items: orderLine },
  totals, notes: { bsonType: "string" },
  createdAt: date, updatedAt: date
});

applyCollection("payments", ["orderId", "amountCentavos", "method", "status", "createdAt"], {
  orderId: oid, amountCentavos: positive,
  method: { enum: ["CASH", "CARD", "E_WALLET"] },
  status: { enum: ["PENDING", "PAID", "FAILED", "REFUNDED"] },
  transactionReference: { bsonType: "string" },
  paidAt: { bsonType: ["date", "null"] }, createdAt: date
});

// Fast lookups and duplicate prevention.
capoDB.users.createIndex({ email: 1 }, { unique: true, name: "uniq_user_email" });
capoDB.customers.createIndex({ phone: 1 }, { name: "customer_phone" });
capoDB.restaurantTables.createIndex({ code: 1 }, { unique: true, name: "uniq_table_code" });
capoDB.reservations.createIndex({ reservationCode: 1 }, { unique: true, name: "uniq_reservation_code" });
capoDB.reservations.createIndex({ tableId: 1, startAt: 1, endAt: 1 }, { name: "reservation_table_times" });
capoDB.menuCategories.createIndex({ code: 1 }, { unique: true, name: "uniq_category_code" });
capoDB.menuItems.createIndex({ sku: 1 }, { unique: true, name: "uniq_menu_sku" });
capoDB.menuItems.createIndex({ categoryId: 1, isAvailable: 1 }, { name: "menu_by_category" });
capoDB.orders.createIndex({ orderNumber: 1 }, { unique: true, name: "uniq_order_number" });
capoDB.orders.createIndex({ status: 1, createdAt: -1 }, { name: "orders_by_status" });
capoDB.orders.createIndex({ customerId: 1, createdAt: -1 }, { name: "orders_by_customer" });
capoDB.payments.createIndex({ orderId: 1, status: 1 }, { name: "payments_by_order" });
capoDB.payments.createIndex(
  { transactionReference: 1 },
  { unique: true, partialFilterExpression: { transactionReference: { $type: "string" } }, name: "uniq_payment_reference" }
);

print("CAPO MongoDB schema and indexes ready in database: " + capoDB.getName());
