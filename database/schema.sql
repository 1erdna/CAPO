-- CAPO Database | MySQL 8.0+
-- Educational draft: confirm schema and DB engine with the CAPO backend team.
CREATE DATABASE IF NOT EXISTS capo_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE capo_db;

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','STAFF','CASHIER') NOT NULL DEFAULT 'STAFF',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  customer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(190) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS restaurant_tables (
  table_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  table_number VARCHAR(20) NOT NULL UNIQUE,
  capacity TINYINT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (capacity > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
  reservation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  table_id BIGINT UNSIGNED NOT NULL,
  reserved_at DATETIME NOT NULL,
  party_size TINYINT UNSIGNED NOT NULL,
  status ENUM('PENDING','CONFIRMED','SEATED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'PENDING',
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  CONSTRAINT fk_reservations_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(table_id),
  CHECK (party_size > 0),
  INDEX idx_reservations_table_time (table_id, reserved_at),
  INDEX idx_reservations_customer (customer_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_categories (
  category_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_items (
  item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_menu_items_category FOREIGN KEY (category_id) REFERENCES menu_categories(category_id),
  CHECK (base_price >= 0),
  INDEX idx_menu_items_category (category_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS modifier_groups (
  group_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  min_select TINYINT UNSIGNED NOT NULL DEFAULT 0,
  max_select TINYINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_modifier_groups_item FOREIGN KEY (item_id) REFERENCES menu_items(item_id),
  CHECK (max_select >= min_select),
  UNIQUE KEY uq_modifier_group_item_name (item_id, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS modifier_options (
  option_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  extra_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_modifier_options_group FOREIGN KEY (group_id) REFERENCES modifier_groups(group_id),
  CHECK (extra_price >= 0),
  UNIQUE KEY uq_modifier_option_group_name (group_id, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  order_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(40) NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NULL,
  table_id BIGINT UNSIGNED NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  order_type ENUM('DINE_IN','TAKEOUT','DELIVERY') NOT NULL,
  status ENUM('PENDING','CONFIRMED','PREPARING','READY','SERVED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes VARCHAR(500) NULL,
  ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(table_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (created_by_user_id) REFERENCES users(user_id),
  CHECK (subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0),
  INDEX idx_orders_status_time (status, ordered_at),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_table (table_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  item_name_snapshot VARCHAR(150) NOT NULL,
  unit_base_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  special_instructions VARCHAR(500) NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
  CONSTRAINT fk_order_items_item FOREIGN KEY (item_id) REFERENCES menu_items(item_id),
  CHECK (quantity > 0 AND unit_base_price >= 0 AND line_total >= 0),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_item_modifiers (
  order_item_modifier_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_item_id BIGINT UNSIGNED NOT NULL,
  option_id BIGINT UNSIGNED NOT NULL,
  option_name_snapshot VARCHAR(100) NOT NULL,
  extra_price_snapshot DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_item_modifiers_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
  CONSTRAINT fk_order_item_modifiers_option FOREIGN KEY (option_id) REFERENCES modifier_options(option_id),
  CHECK (extra_price_snapshot >= 0),
  UNIQUE KEY uq_order_item_option (order_item_id, option_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method ENUM('CASH','CARD','E_WALLET') NOT NULL,
  status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  transaction_reference VARCHAR(100) NULL UNIQUE,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
  CHECK (amount > 0),
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB;
