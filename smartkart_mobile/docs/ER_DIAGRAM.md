# SmartKart E-Commerce - Entity Relationship Diagram

## Overview

This document describes the database schema for the SmartKart microservices backend. Each microservice owns its database following the **Database per Service** pattern.

---

## ER Diagram (Conceptual View)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER SERVICE                             │
│                         Database: sc_users                       │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════╗
║            USERS                  ║
╠═══════════════════════════════════╣
║ PK │ id          : SERIAL         ║
║    │ name        : VARCHAR(255)   ║
║ UK │ email       : VARCHAR(255)   ║
║    │ password    : VARCHAR(255)   ║ ← bcrypt hashed
║    │ role        : VARCHAR(50)    ║ ← 'user' or 'admin'
║    │ created_at  : TIMESTAMP      ║
╚═══════════════════════════════════╝

---

┌─────────────────────────────────────────────────────────────────┐
│                       PRODUCT SERVICE                            │
│                       Database: sc_products                      │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════╗
║           PRODUCTS                ║
╠═══════════════════════════════════╣
║ PK │ id          : SERIAL         ║
║    │ name        : VARCHAR(255)   ║
║    │ description : TEXT           ║
║    │ price       : DECIMAL(10,2)  ║
║    │ stock       : INTEGER        ║
║    │ category    : VARCHAR(100)   ║
║    │ image_url   : VARCHAR(500)   ║
║    │ created_at  : TIMESTAMP      ║
║    │ updated_at  : TIMESTAMP      ║
╚═══════════════════════════════════╝

---

┌─────────────────────────────────────────────────────────────────┐
│                        ORDER SERVICE                             │
│                        Database: sc_orders                       │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════╗
║             CARTS                 ║
╠═══════════════════════════════════╣
║ PK │ id          : SERIAL         ║
║ FK │ user_id     : INTEGER        ║ → references users.id (logical)
║    │ created_at  : TIMESTAMP      ║
╚═══════════════════════════════════╝
                │
                │ 1:N
                ▼
╔═══════════════════════════════════╗
║          CART_ITEMS               ║
╠═══════════════════════════════════╣
║ PK │ id          : SERIAL         ║
║ FK │ cart_id     : INTEGER        ║ → carts.id
║ FK │ product_id  : INTEGER        ║ → references products.id (logical)
║    │ quantity    : INTEGER        ║
║    │ unit_price  : DECIMAL(10,2)  ║
║ UK │ (cart_id, product_id)        ║ ← prevents duplicate products
╚═══════════════════════════════════╝

╔═══════════════════════════════════╗
║            ORDERS                 ║
╠═══════════════════════════════════╣
║ PK │ id              : SERIAL     ║
║ FK │ user_id         : INTEGER    ║ → references users.id (logical)
║    │ total_amount    : DECIMAL    ║
║    │ status          : VARCHAR(50)║ ← PENDING, CONFIRMED, SHIPPED, etc.
║    │ shipping_address: TEXT       ║
║    │ created_at      : TIMESTAMP  ║
║    │ updated_at      : TIMESTAMP  ║
╚═══════════════════════════════════╝
                │
                │ 1:N
                ▼
╔═══════════════════════════════════╗
║         ORDER_ITEMS               ║
╠═══════════════════════════════════╣
║ PK │ id          : SERIAL         ║
║ FK │ order_id    : INTEGER        ║ → orders.id
║ FK │ product_id  : INTEGER        ║ → references products.id (logical)
║    │ product_name: VARCHAR(255)   ║ ← denormalized for history
║    │ quantity    : INTEGER        ║
║    │ unit_price  : DECIMAL(10,2)  ║ ← snapshot at time of order
╚═══════════════════════════════════╝

---

┌─────────────────────────────────────────────────────────────────┐
│                      PAYMENT SERVICE                             │
│                      Database: sc_payments                       │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════╗
║           PAYMENTS                ║
╠═══════════════════════════════════╣
║ PK │ id            : SERIAL       ║
║ FK │ order_id      : INTEGER      ║ → references orders.id (logical)
║ FK │ user_id       : INTEGER      ║ → references users.id (logical)
║    │ amount        : DECIMAL      ║
║    │ status        : VARCHAR(50)  ║ ← PENDING, SUCCESS, FAILED
║    │ payment_method: VARCHAR(50)  ║ ← CARD, UPI, NET_BANKING, etc.
║    │ created_at    : TIMESTAMP    ║
╚═══════════════════════════════════╝

```

---

## Relationships (Cross-Service)

### Logical References (No Foreign Keys Across Databases)

```
USER (User Service)
  │
  │ 1:N (logical reference via user_id)
  ├─────► CARTS (Order Service)
  │
  │ 1:N (logical reference via user_id)
  ├─────► ORDERS (Order Service)
  │
  │ 1:N (logical reference via user_id)
  └─────► PAYMENTS (Payment Service)

PRODUCT (Product Service)
  │
  │ N:1 (logical reference via product_id)
  ├─────► CART_ITEMS (Order Service)
  │
  │ N:1 (logical reference via product_id)
  └─────► ORDER_ITEMS (Order Service)

ORDER (Order Service)
  │
  │ 1:N (logical reference via order_id)
  └─────► PAYMENTS (Payment Service)
```

**Important**: These are logical relationships only. No actual foreign key constraints exist across databases to maintain microservice independence.

---

## Entity Descriptions

### USERS
- **Purpose**: Store registered user accounts
- **Authentication**: Password stored as bcrypt hash
- **Authorization**: Role field determines access level
- **Unique Constraints**: Email must be unique
- **Indexes**: email (for login queries)

### PRODUCTS
- **Purpose**: Product catalog master data
- **Pricing**: Decimal type for precise currency handling
- **Stock Management**: Integer quantity available
- **Categorization**: Simple string-based categories
- **Indexes**: name (for search), category (for filtering)

### CARTS
- **Purpose**: Temporary shopping carts per user
- **Lifecycle**: Created on first add-to-cart, cleared on checkout
- **User Association**: One active cart per user (upsert pattern)

### CART_ITEMS
- **Purpose**: Line items in a cart
- **Deduplication**: Unique constraint on (cart_id, product_id) prevents duplicates
- **Price Snapshot**: unit_price captured from product at time of add-to-cart
- **Quantity Management**: Updated via increment on duplicate add

### ORDERS
- **Purpose**: Confirmed purchase records
- **Status Flow**: PENDING → CONFIRMED → SHIPPED → DELIVERED
- **Failed Path**: PENDING → FAILED (if payment fails)
- **Cancellation**: Any status → CANCELLED
- **Audit Trail**: created_at and updated_at timestamps

### ORDER_ITEMS
- **Purpose**: Immutable line items in an order
- **Product Snapshot**: product_name and unit_price captured at checkout time
- **Historical Record**: Even if product is deleted, order items persist
- **No Updates**: Once created, never modified (append-only)

### PAYMENTS
- **Purpose**: Payment transaction log
- **Event Sourcing**: Append-only, multiple attempts create multiple rows
- **Status**: PENDING (initial), SUCCESS (completed), FAILED (declined)
- **Methods**: Supports multiple payment types
- **Reconciliation**: Links to order via order_id

---

## Database Schema SQL

### User Service

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Product Service

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
```

### Order Service

```sql
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_carts_user_id ON carts(user_id);

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Payment Service

```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## Data Consistency Patterns

### Eventual Consistency
- Order status changes trigger payment events via RabbitMQ
- Payment service consumes `order.placed` events
- Choreography Saga pattern ensures distributed transaction coordination

### Data Integrity
- Within each service: ACID transactions enforced by PostgreSQL
- Cross-service: No distributed transactions, compensating actions handle failures

### Referential Integrity
- **Within Service**: Enforced via foreign keys (cart_items → carts, order_items → orders)
- **Cross-Service**: Logical references only, validated at application layer

---

## Scalability Considerations

### Database per Service Benefits
- Independent scaling (e.g., scale product DB separately from orders)
- Independent schema evolution
- Failure isolation (one DB down doesn't break entire system)
- Technology diversity possible (could use MongoDB for product catalog)

### Query Optimization
- Indexes on foreign keys and frequently filtered columns
- Pagination for large result sets (limit/offset)
- Denormalization in order_items (product_name) avoids cross-service joins

### Future Enhancements
- Read replicas for product catalog (high read volume)
- Caching layer (Redis) for frequently accessed products
- Database sharding if user base exceeds single-node capacity
- CQRS for complex reporting queries

---

## Mobile App Integration

The Flutter mobile app accesses this data exclusively through the REST API Gateway. No direct database connections from mobile devices. All queries go through:

```
Mobile App → API Gateway → Microservice → PostgreSQL
```

This architecture ensures:
- Security (no exposed database ports)
- Backend flexibility (can change DB without mobile app changes)
- Proper authentication/authorization enforcement
- Consistent API versioning

---

## Backup & Recovery

### Recommendations
- Daily automated PostgreSQL backups
- Point-in-time recovery enabled
- Backup retention: 30 days
- Test restore procedures quarterly
- Separate backup storage location

### Disaster Recovery
- Database replication for high availability
- Automated failover with connection pooling
- RTO target: < 1 hour
- RPO target: < 5 minutes

---

## Privacy & Compliance

### PII Protection
- User passwords: bcrypt hashed, never stored plain text
- Email addresses: Considered PII, encrypted at rest recommended
- Shipping addresses: Stored in orders table, subject to GDPR/privacy laws

### Data Retention
- User data: Retained until account deletion
- Order history: 7 years (for tax/legal compliance)
- Payment records: Append-only audit log
- Cart data: Auto-purge after 30 days of inactivity

### GDPR Compliance
- Right to access: API endpoint to export user data
- Right to erasure: Anonymize user records on delete request
- Data portability: JSON export of user orders/payments
