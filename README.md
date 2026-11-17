# CAPO — Restaurant Ordering and Management System

Software Engineering group project. This repository includes an **initial database starter** for CAPO.

> **Status:** Database schema draft in branch `andrei/database`. It uses **MySQL 8.0+ provisionally**. The team must verify the DBMS, entity names, and application requirements against the approved CAPO class diagram before backend integration.

## Database features covered

- Staff/admin accounts and roles
- Customers and restaurant tables
- Table reservations
- Digital menu and categories
- Menu item customization (modifier groups and options)
- Dine-in, takeout and optional delivery orders
- Order items, historic prices, payment records and billing queries

## Repository layout

~~~text
CAPO/
├── .env.example
├── .gitignore
├── README.md
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── sample_queries.sql
└── docs/
    └── ERD.md
~~~

## How to run locally (MySQL Workbench)

1. Install **MySQL Server 8.0+** and **MySQL Workbench**.
2. Open and execute `database/schema.sql` to create database `capo_db` and the tables.
3. **Optional:** execute `database/seed.sql` **one time on an empty database** to insert fictional sample data.
4. Execute `database/sample_queries.sql` to inspect the results.
5. Read `docs/ERD.md` for the draft entity-relationship diagram.

You can also use the MySQL CLI:

~~~bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
mysql -u root -p < database/sample_queries.sql
~~~

The `.env.example` file documents environment variable names. Keep your real credentials in a local `.env` file and **never commit it**.

## Relationships and API responsibilities

| Module | Tables |
| --- | --- |
| Authentication / Admin | `users` |
| Customers & Reservations | `customers`, `restaurant_tables`, `reservations` |
| Digital Menu | `menu_categories`, `menu_items` |
| Item Customization | `modifier_groups`, `modifier_options` |
| Order Processing | `orders`, `order_items`, `order_item_modifiers` |
| Billing / Payments | `orders`, `payments` |

Primary and foreign keys model relationships. Financial values use `DECIMAL`. Order item names and prices are stored as billed snapshots.

### Important application rules not enforced by this starter SQL

The backend must enforce permissions, password hashing, reservation overlap and table-capacity checks, modifier selection limits, atomic order-total calculations, payment validation, and receipt rules. Real-time order updates require an API transport such as WebSockets or polling; the database does not push updates on its own.

## Questions to confirm with CAPO team

1. Is the backend using MySQL, PostgreSQL, or MongoDB?
2. Is delivery included, or only dine-in and takeout?
3. Does the approved class diagram match these entities and field names?
4. What taxes, discounts, reservations, and payment methods are in scope?
5. Will the team use separate migration files or a single SQL initialization script?

**Contribution workflow:** Do the database work on `andrei/database`, review changes with the backend team, and merge into `main` only when the schema has been agreed upon.
