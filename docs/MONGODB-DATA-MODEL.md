# CAPO MongoDB data model (initial implementation)

MongoDB is the team's chosen DBMS based on the professor's suggestion. The database is named **`capo_db`**.

## Core collections

| Collection | Key fields | Role |
| --- | --- | --- |
| `users` | `_id`, `email`, `passwordHash`, `role` | Staff/cashier/admin authentication; only salted password hashes, never raw passwords |
| `customers` | `_id`, `fullName`, `phone` | Optional customer profile for orders, required for reservations |
| `restaurantTables` | `_id`, `code`, `capacity` | Dine-in table inventory |
| `reservations` | `reservationCode`, `customerId`, `tableId`, `startAt`, `endAt`, `guestCount`, `status` | Reservation lifecycle |
| `menuCategories` | `code`, `name`, `sortOrder` | Digital menu grouping |
| `menuItems` | `sku`, `categoryId`, `name`, `priceCentavos`, `modifierGroups[]` | Menu items and customization options |
| `orders` | `orderNumber`, `orderType`, `status`, `items[]`, `totals` | Restaurant orders and checkout snapshots |
| `payments` | `orderId`, `amountCentavos`, `method`, `status` | Cash/card/e-wallet payment tracking |

### Why embedded documents?

- Each **menuItem** contains its modifier groups and choices. The API can render the item and its customization choices in one read.
- Each **order** contains the ordered item names, price snapshots and selected modifiers. Editing a menu later does not retroactively alter a paid receipt.
- **Payments**, **customers**, **tables**, and **reservations** are separate because they have independent lifecycles and queries.

References use MongoDB `ObjectId` values; documents are not relational tables. A database validator checks document shape, while the backend must check reference existence and cross-document rules.

## Monetary convention

`priceCentavos` and every `*Centavos` amount are integer centavos, for example **PHP 125.00 = 12500**. Never use binary floating point for billing calculations.

- `lineTotalCentavos = quantity * (unitPriceCentavos + sum(selectedModifiers.priceDeltaCentavos))`
- `totalCentavos = subtotalCentavos - discountCentavos + taxCentavos + deliveryFeeCentavos`
- Calculate and verify totals **server-side**; never accept frontend totals as authoritative.

## Reservation and order rules for backend integration

- Prevent overlapping table reservations: for a candidate `[startAt, endAt)`, reject active reservations with `startAt < newEndAt` and `endAt > newStartAt`; compare `guestCount` to table capacity.
- Require `tableId` for `DINE_IN` orders and ensure it references an active table; validate delivery fields if delivery becomes part of scope.
- Enforce modifier group's `minSelect` and `maxSelect` and only allow currently available options.
- Generate collision-resistant `orderNumber` and `reservationCode`; unique indexes reject duplicates.
- Only accept authorized status transitions. A paid or cancelled order should not be silently overwritten.
- Payment collection does **not** store card credentials or e-wallet tokens. Verify external provider callbacks on the server.
- For multi-document payment/order updates, use a MongoDB **replica set with transactions** (MongoDB Atlas provides this). The single-container demo is for development and does not provide transactions.
- Database validators cannot enforce cross-collection foreign keys, billing arithmetic, or reservation overlap on their own.

## Relationship sketch

~~~mermaid
erDiagram
  CUSTOMERS ||--o{ RESERVATIONS : makes
  RESTAURANT_TABLES ||--o{ RESERVATIONS : hosts
  CUSTOMERS o|--o{ ORDERS : places
  RESTAURANT_TABLES o|--o{ ORDERS : assigned
  MENU_CATEGORIES ||--o{ MENU_ITEMS : contains
  MENU_ITEMS ||--o{ ORDERS : item_snapshots
  ORDERS ||--o{ PAYMENTS : settled_by
  USERS o|--o{ ORDERS : entered_by
~~~

**Pending project review:** The team's Trello board has a CAPO class diagram and UI/UX tasks; exact entity names, features, delivery support, discounts and receipt/tax logic should be reconciled with that approved class diagram and the backend contract.
