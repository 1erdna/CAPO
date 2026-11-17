-- Optional demo data. Run once after schema.sql on an empty database.
USE capo_db;

INSERT INTO customers (customer_id, full_name, phone, email) VALUES
  (1, 'Sample Customer', '09170000001', 'sample.customer@example.com');

INSERT INTO restaurant_tables (table_id, table_number, capacity) VALUES
  (1, 'T01', 2), (2, 'T02', 4), (3, 'T03', 6);

INSERT INTO menu_categories (category_id, name, description) VALUES
  (1, 'Drinks', 'Hot and cold beverages'),
  (2, 'Meals', 'Main dishes');

INSERT INTO menu_items (item_id, category_id, name, description, base_price) VALUES
  (1, 1, 'Iced Coffee', 'Demo menu item', 120.00),
  (2, 2, 'Rice Meal', 'Demo menu item', 180.00);

INSERT INTO modifier_groups (group_id, item_id, name, min_select, max_select) VALUES
  (1, 1, 'Sweetness', 0, 1),
  (2, 1, 'Add-ons', 0, 2);

INSERT INTO modifier_options (option_id, group_id, name, extra_price) VALUES
  (1, 1, 'Less Sugar', 0.00),
  (2, 1, 'Regular Sugar', 0.00),
  (3, 2, 'Extra Shot', 30.00);

INSERT INTO reservations (customer_id, table_id, reserved_at, party_size, status) VALUES
  (1, 2, '2026-12-01 18:00:00', 3, 'CONFIRMED');

-- Example completed purchase: 2 iced coffees, 1 with extra shot.
INSERT INTO orders (order_id, order_code, customer_id, table_id, order_type,
  status, subtotal, discount_amount, tax_amount, total_amount)
VALUES (1, 'DEMO-0001', 1, 2, 'DINE_IN', 'COMPLETED', 270.00, 0.00, 0.00, 270.00);

INSERT INTO order_items (order_item_id, order_id, item_id, quantity,
  item_name_snapshot, unit_base_price, line_total)
VALUES (1, 1, 1, 1, 'Iced Coffee', 120.00, 150.00),
       (2, 1, 1, 1, 'Iced Coffee', 120.00, 120.00);

INSERT INTO order_item_modifiers (order_item_id, option_id, option_name_snapshot, extra_price_snapshot)
VALUES (1, 3, 'Extra Shot', 30.00);

INSERT INTO payments (order_id, amount, method, status, paid_at)
VALUES (1, 270.00, 'CASH', 'PAID', '2026-12-01 18:30:00');
