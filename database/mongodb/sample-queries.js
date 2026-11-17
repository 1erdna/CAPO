// Run in mongosh after init.js and seed.js. This prints sample CAPO reports.
const queryDB = db.getSiblingDB("capo_db");

print("\n--- Available menu (PHP pesos) ---");
queryDB.menuItems.aggregate([
  { $match: { isAvailable: true } },
  { $lookup: { from: "menuCategories", localField: "categoryId", foreignField: "_id", as: "category" } },
  { $unwind: "$category" },
  { $project: { _id: 0, sku: 1, name: 1, category: "$category.name", pricePHP: { $divide: ["$priceCentavos", 100] } } },
  { $sort: { category: 1, name: 1 } }
]).forEach(printjson);

print("\n--- Upcoming active reservations ---");
queryDB.reservations.aggregate([
  { $match: { status: { $in: ["PENDING", "CONFIRMED"] }, endAt: { $gte: new Date() } } },
  { $lookup: { from: "restaurantTables", localField: "tableId", foreignField: "_id", as: "table" } },
  { $unwind: "$table" },
  { $project: { _id: 0, reservationCode: 1, table: "$table.code", guestCount: 1, startAt: 1, endAt: 1, status: 1 } },
  { $sort: { startAt: 1 } }
]).forEach(printjson);

print("\n--- Pending/active orders ---");
queryDB.orders.find({ status: { $nin: ["COMPLETED", "CANCELLED"] } }, {
  _id: 0, orderNumber: 1, status: 1, orderType: 1, totals: 1
}).sort({ createdAt: -1 }).forEach(printjson);

print("\n--- Amount paid and balance by order ---");
queryDB.orders.aggregate([
  { $lookup: { from: "payments", let: { orderId: "$_id" },
    pipeline: [
      { $match: { $expr: { $and: [{ $eq: ["$orderId", "$$orderId"] }, { $eq: ["$status", "PAID"] }] } } },
      { $group: { _id: null, paidCentavos: { $sum: "$amountCentavos" } } }
    ], as: "paid" } },
  { $addFields: { paidCentavos: { $ifNull: [{ $arrayElemAt: ["$paid.paidCentavos", 0] }, 0] } } },
  { $project: { _id: 0, orderNumber: 1,
    totalPHP: { $divide: ["$totals.totalCentavos", 100] },
    paidPHP: { $divide: ["$paidCentavos", 100] },
    balancePHP: { $divide: [{ $subtract: ["$totals.totalCentavos", "$paidCentavos"] }, 100] } } }
]).forEach(printjson);

print("\n--- Daily paid revenue (Asia/Manila) ---");
queryDB.payments.aggregate([
  { $match: { status: "PAID", paidAt: { $type: "date" } } },
  { $group: {
    _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt", timezone: "Asia/Manila" } },
    revenueCentavos: { $sum: "$amountCentavos" }
  } },
  { $project: { _id: 0, date: "$_id", revenuePHP: { $divide: ["$revenueCentavos", 100] } } },
  { $sort: { date: -1 } }
]).forEach(printjson);

print("\n--- Most ordered items (excluding cancelled orders) ---");
queryDB.orders.aggregate([
  { $match: { status: { $ne: "CANCELLED" } } },
  { $unwind: "$items" },
  { $group: { _id: "$items.sku", name: { $first: "$items.name" }, units: { $sum: "$items.quantity" } } },
  { $project: { _id: 0, sku: "$_id", name: 1, units: 1 } },
  { $sort: { units: -1, sku: 1 } }
]).forEach(printjson);
