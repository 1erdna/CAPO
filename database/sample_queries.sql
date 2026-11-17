USE capo_db;

-- 1. Browse available menu items and categories.
SELECT c.name AS category, m.item_id, m.name AS item, m.base_price
FROM menu_items m
JOIN menu_categories c ON c.category_id = m.category_id
WHERE m.is_available = TRUE AND c.is_active = TRUE
ORDER BY c.name, m.name;

-- 2. Check upcoming reservations.
SELECT r.reservation_id, t.table_number, c.full_name, r.party_size, r.reserved_at, r.status
FROM reservations r
JOIN restaurant_tables t ON r.table_id = t.table_id
JOIN customers c ON r.customer_id = c.customer_id
WHERE r.status IN ('PENDING', 'CONFIRMED')
ORDER BY r.reserved_at;

-- 3. View active orders.
SELECT order_code, order_type, status, total_amount, ordered_at
FROM orders
WHERE status NOT IN ('COMPLETED', 'CANCELLED')
ORDER BY ordered_at DESC;

-- 4. View order totals and total received (successful payments only).
SELECT o.order_code, o.total_amount,
       COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) AS amount_paid,
       o.total_amount - COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) AS balance_due
FROM orders o
LEFT JOIN payments p ON p.order_id = o.order_id
GROUP BY o.order_id, o.order_code, o.total_amount;

-- 5. Revenue by date: based on successful payment timestamps (not orders created).
SELECT DATE(p.paid_at) AS sale_date, SUM(p.amount) AS paid_revenue
FROM payments p
WHERE p.status = 'PAID' AND p.paid_at IS NOT NULL
GROUP BY DATE(p.paid_at)
ORDER BY sale_date DESC;

-- 6. Most-ordered menu items (excluding cancelled orders).
SELECT oi.item_name_snapshot AS item_name, SUM(oi.quantity) AS quantity_sold
FROM order_items oi
JOIN orders o ON o.order_id = oi.order_id
WHERE o.status <> 'CANCELLED'
GROUP BY oi.item_name_snapshot
ORDER BY quantity_sold DESC;
