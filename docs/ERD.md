# CAPO Entity Relationship Diagram (initial draft)

~~~mermaid
erDiagram
    USERS o|--o{ ORDERS : creates
    CUSTOMERS o|--o{ RESERVATIONS : makes
    CUSTOMERS o|--o{ ORDERS : places
    RESTAURANT_TABLES ||--o{ RESERVATIONS : booked_for
    RESTAURANT_TABLES o|--o{ ORDERS : hosts
    MENU_CATEGORIES ||--o{ MENU_ITEMS : contains
    MENU_ITEMS ||--o{ MODIFIER_GROUPS : allows
    MODIFIER_GROUPS ||--o{ MODIFIER_OPTIONS : offers
    ORDERS ||--|{ ORDER_ITEMS : contains
    MENU_ITEMS ||--o{ ORDER_ITEMS : ordered_as
    ORDER_ITEMS ||--o{ ORDER_ITEM_MODIFIERS : customized_by
    MODIFIER_OPTIONS ||--o{ ORDER_ITEM_MODIFIERS : selected_as
    ORDERS ||--o{ PAYMENTS : settled_by
~~~

**Scope:** Ordering, reservations, menu management, customizations, checkout, billing, administrative users.

**Business rules to implement in the API:** Prevent overlapping reservations, validate seating capacity, enforce modifier group selections, calculate order totals in a transaction, verify payments, and hash passwords. The SQL schema by itself does not enforce all these rules.

**Money:** Amounts use DECIMAL, not floats. Orders, items, and selected modifier prices preserve billing snapshots even if menu prices later change.

**Status:** This ERD is a database starter, not yet reconciled with the team's approved class diagram.
