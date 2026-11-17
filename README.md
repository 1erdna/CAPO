# CAPO — Restaurant Ordering and Management System

Software Engineering group project for the CAPO restaurant. **Database implementation: MongoDB**.

The database work is on branch `andrei/database`; `main` remains separate for team integration.

## What's implemented

- 8 MongoDB collections: `users`, `customers`, `restaurantTables`, `reservations`, `menuCategories`, `menuItems`, `orders`, `payments`
- Collection-level **JSON Schema validation**, unique indexes and query indexes
- Embedded menu modifiers and immutable-by-convention order item price snapshots
- Repeatable demo data for a menu, reservations, customer order and payment
- Sample reporting queries, smoke tests and **Docker Compose local MongoDB startup**

**This is a runnable local MongoDB database implementation, not an already-hosted MongoDB Atlas cluster.** Actual Atlas provisioning requires an Atlas account and connection.

## Start the database (easy way)

Install **Docker Desktop** and ensure it is running. From this branch's repository folder:

~~~bash
cp .env.example .env
# Open .env and set a private MONGO_ROOT_PASSWORD
docker compose up -d
docker compose ps
~~~

Windows PowerShell: use `Copy-Item .env.example .env` instead of `cp`, then edit `.env`.

On first startup, Docker creates `capo_db`, configures validators and indexes, and inserts fictional demo records. MongoDB is accessible on **127.0.0.1:27017**; a named Docker volume keeps your data between restarts.

### Test the database

~~~bash
docker compose exec -T mongo sh -lc 'mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /workspace/database/smoke-test.js'
~~~

### Run sample MongoDB queries

~~~bash
docker compose exec -T mongo sh -lc 'mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /workspace/database/sample-queries.js'
~~~

### Connect with MongoDB Compass

Use MongoDB Compass and connect with:

~~~text
mongodb://capo_root:<YOUR_LOCAL_PASSWORD>@127.0.0.1:27017/capo_db?authSource=admin
~~~

Replace the password placeholder with your value in `.env` (URL-encode special characters).

### Apply database changes to an existing Docker volume

MongoDB's Docker initialization scripts run **only when the database volume is empty**. Reapply validation rules and indexes after editing the schema:

~~~bash
docker compose exec -T mongo sh -lc 'mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /workspace/database/init.js'
~~~

Rerun the seed script if you need any missing demo records (it uses upserts):

~~~bash
docker compose exec -T mongo sh -lc 'mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /workspace/database/seed.js'
~~~

**Warning:** `docker compose down -v` deletes the MongoDB volume, including local data. Do not run it on data you need to keep.

## Key files

| File | Purpose |
| --- | --- |
| `database/mongodb/init.js` | Creates `capo_db`, collections, validators, indexes |
| `database/mongodb/seed.js` | Inserts fictional test data |
| `database/mongodb/sample-queries.js` | Menu, bookings, orders, balances, revenue, popular items |
| `database/mongodb/smoke-test.js` | Tests collections, validators, totals, payment and indexes |
| `docs/MONGODB-DATA-MODEL.md` | Collection relationships and backend business rules |
| `docker-compose.yml` | Starts MongoDB 8 locally |
| `.env.example` | Safe example for local credentials |

## API integration notes

- Use the **MongoDB Node.js driver** or **Mongoose**, depending on the team's backend.
- `ObjectId` fields reference other collections; nested menu modifier groups and order items are embedded.
- Prices are stored as integer centavos: **₱125.00 = 12500**, not floating-point currency.
- Validate monetary totals, modifier limits, table capacity, reservation overlaps and user authorization in the API.
- Do not commit `.env`, real connection strings, customer data or passwords to this public repo.
- Do not expose a database URI in the frontend; access MongoDB **through the backend API**.
- For production payments and cross-document atomic updates use MongoDB Atlas or another properly configured **replica set** with transactions.

## Status

The initial collections, indexes and seed code have been implemented. The team's approved Trello class diagram and API contract should still be checked for field names and requirements before merging `andrei/database` into `main`. GitHub Actions can exercise the scripts against an ephemeral MongoDB container, but no claim of live Atlas deployment is made.
