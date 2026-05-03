# BrightCore Merch Store

An internal employee merchandise e-commerce platform built for BrightCore. Employees can browse a product catalog, place orders, and pay via Stripe Checkout. Fulfillment admins manage order status and record payments. Product admins manage the catalog and restock inventory.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Getting Started — Backend](#getting-started--backend)
6. [Getting Started — Frontend](#getting-started--frontend)
7. [Test Credentials](#test-credentials)
8. [Stripe Test Card](#stripe-test-card)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)
11. [Key Features](#key-features)
12. [Group](#group)

---

## Project Overview

BrightCore Merch Store allows company employees to purchase branded merchandise (t-shirts, hoodies, caps, joggers) using an internal web portal. The platform handles the full order lifecycle from browsing to payment to fulfillment.

### User Roles

| Role | What They Can Do |
|---|---|
| **Employee** | Register/login, browse catalog with search and category filter, view product variants (size/color/stock), add items to cart, place orders via Stripe Checkout, view personal order history |
| **Fulfillment Admin** | View all orders across the system, update order status (Pending → Processing → Ready for Pickup → Fulfilled/Cancelled), record payments manually |
| **Product Admin** | Add, edit, and delete products and categories, restock variant inventory inline from the dashboard |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19.2, React Router 7.13, Vite 8, Tailwind CSS 4.2, Axios 1.14, Lucide React |
| **Backend** | Django 5.2, Django REST Framework 3.17, DRF Simple JWT 5.5 |
| **Database** | MySQL 8.0 |
| **Payments** | Stripe Checkout (server-side hosted sessions) |
| **Auth** | Custom JWT authentication using `employee_id` claim |

---

## Prerequisites

- **Node.js** v18 or higher
- **Python** 3.11 or higher
- **MySQL** 8.0 installed and running locally
- **Stripe account** in test mode (test keys are included in `.env.example`)

---

## Project Structure

```
CPSC-471-G-32/
├── backend/
│   ├── accounts/          # Employee, FulfillmentAdmin, ProductAdmin models + auth
│   ├── catalog/           # Category, Product, Size, Color, Variant, ProductImage
│   ├── orders/            # Order, OrderLine — placement and status management
│   ├── payments/          # Payment recording + Stripe Checkout session
│   ├── notifications/     # EmailLog — notification audit trail
│   ├── brightcore/        # Django project config (settings.py, urls.py)
│   ├── media/             # Uploaded/seeded product images
│   ├── seed.py            # Database seed script
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env               # Your local env (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── pages/         # All page components (13 pages)
│   │   ├── components/    # Layout, CartDrawer, ProtectedRoute
│   │   ├── context/       # AuthContext, CartContext
│   │   ├── services/      # authService.js
│   │   ├── App.jsx        # Router configuration
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env               # Your local env (not committed)
│
└── docs/
    ├── CPSC 471_Proposal_G-32.pdf
    ├── CPSC_471_EERD_G-32_(OLD).pdf
    └── CPSC_471_RM_G-32_(OLD).pdf
```

---

## Getting Started — Backend

### 1. Clone the repository

```bash
git clone https://github.com/shazil343/CPSC-471-G-32.git
cd CPSC-471-G-32
```

### 2. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the MySQL database

Log in to MySQL and run:

```sql
CREATE DATABASE brightcore_merch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Configure environment variables

```bash
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
DB_NAME=brightcore_merch
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
FRONTEND_URL=http://localhost:5173
```

> `SECRET_KEY` is optional — a default insecure key is used when not set (development only).

### 6. Run migrations

```bash
python manage.py migrate
```

### 7. Seed the database

```bash
python seed.py
```

This creates 5 employees, 4 products with 20 variants, product images, 3 sample orders, 2 payments, and 2 email logs.

### 8. Start the backend server

```bash
python manage.py runserver 8001
```

> Port 8000 may already be in use on some machines. Use `8001` to avoid conflicts.

The API will be available at `http://127.0.0.1:8001`.  
The Django admin panel is at `http://127.0.0.1:8001/admin` — create a superuser first with `python manage.py createsuperuser`.

---

## Getting Started — Frontend

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> Make sure `VITE_API_URL` matches the port your backend is running on.

### 3. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

---

## Test Credentials

All seeded accounts use the password `test123`.

| Email | Role | Name |
|---|---|---|
| `alice@brightcore.com` | Employee | Alice Johnson |
| `bob@brightcore.com` | Employee | Bob Smith |
| `carol@brightcore.com` | Fulfillment Admin | Carol White |
| `emma@brightcore.com` | Fulfillment Admin | Emma Davis |
| `david@brightcore.com` | Product Admin | David Lee |

---

## Stripe Test Card

Use the following details on the Stripe Checkout page:

| Field | Value |
|---|---|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g. `12/30`) |
| CVC | Any 3 digits (e.g. `123`) |
| Name / ZIP | Any value |

---

## API Endpoints

### Auth — `/api/auth/`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login/` | Login with email + password, returns JWT |
| POST | `/api/auth/register/` | Register a new employee account |
| GET | `/api/auth/employees/` | List all employees |
| GET / PUT / DELETE | `/api/auth/employees/<id>/` | Get, update, or delete an employee |
| GET / POST | `/api/auth/fulfillment-admins/` | List all or create fulfillment admin role |
| DELETE | `/api/auth/fulfillment-admins/<id>/` | Remove fulfillment admin role |
| GET / POST | `/api/auth/product-admins/` | List all or create product admin role |
| DELETE | `/api/auth/product-admins/<id>/` | Remove product admin role |

### Catalog — `/api/catalog/`

| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `/api/catalog/categories/` | List all or create category |
| GET / PUT / DELETE | `/api/catalog/categories/<id>/` | Get, update, or delete category |
| GET / POST | `/api/catalog/products/` | List all or create product |
| GET / PUT / DELETE | `/api/catalog/products/<id>/` | Get, update, or delete product |
| GET / POST | `/api/catalog/sizes/` | List all or create size |
| GET / POST | `/api/catalog/colors/` | List all or create color |
| GET / POST | `/api/catalog/variants/` | List variants (supports `?product_id=`) or create |
| PUT | `/api/catalog/variants/<id>/` | Update variant stock quantity |

### Orders — `/api/orders/`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders/place/` | Place a new order (atomic transaction, decrements stock) |
| GET | `/api/orders/` | List all orders |
| GET / PATCH | `/api/orders/<id>/` | Get or update an order's status |
| GET | `/api/orders/my-orders/<employee_id>/` | Get orders for a specific employee |

### Payments — `/api/payments/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/payments/` | List all payments |
| POST | `/api/payments/record/` | Record a payment for an order |
| GET | `/api/payments/<id>/` | Get a single payment |
| POST | `/api/payments/create-checkout-session/` | Create a Stripe Checkout session, returns `{ url }` |

### Notifications — `/api/notifications/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/` | List all email logs |
| POST | `/api/notifications/create/` | Create an email log entry |
| GET | `/api/notifications/order/<order_id>/` | Get email logs for a specific order |

---

## Database Schema

| Table | Primary Key | Key Foreign Keys |
|---|---|---|
| `EMPLOYEE` | `employee_id` | — |
| `FULFILLMENTADMIN` | `fulfillment_admin_id` | `Employee_ID → EMPLOYEE` |
| `PRODUCTADMIN` | `product_admin_id` | `Employee_ID → EMPLOYEE` |
| `CATEGORY` | `category_id` | — |
| `PRODUCT` | `product_id` | `Category_ID → CATEGORY`, `Product_Admin_ID → PRODUCTADMIN` |
| `SIZE` | `size_id` | — |
| `COLOR` | `color_id` | — |
| `VARIANT` | `variant_id` | `Product_ID → PRODUCT`, `Size_ID → SIZE`, `Color_ID → COLOR` |
| `PRODUCTIMAGE` | `image_id` | `Product_ID → PRODUCT`, `Color_ID → COLOR` |
| `ORDER` | `order_id` | `Employee_ID → EMPLOYEE`, `Fulfillment_Admin_ID → FULFILLMENTADMIN` |
| `ORDERLINE` | `orderline_id` | `Order_ID → ORDER`, `Variant_ID → VARIANT` |
| `PAYMENT` | `payment_id` | `Order_ID → ORDER` (OneToOne), `Fulfillment_Admin_ID → FULFILLMENTADMIN` |
| `EMAILLOG` | `email_log_id` | `Order_ID → ORDER` |

---

## Key Features

- **Atomic order placement** — order creation and stock decrement run in a single database transaction; if any variant is out of stock the entire order is rejected
- **Role-based JWT authentication** — custom `EmployeeJWTAuthentication` encodes `employee_id`, `email`, `name`, and `role` into the token; role-based route guards enforce access on both frontend and backend
- **Stripe Checkout integration** — backend creates a hosted Stripe Checkout session; the browser redirects to Stripe's payment page; on return, `OrderConfirmationPage` records the payment via `/api/payments/record/`
- **Inventory restock** — Product admins can select a variant, enter a quantity to add, and confirm inline from the product dashboard row without opening a separate modal
- **Email notification logging** — every order event logs an `EmailLog` record (to_email, subject, body) as an audit trail; viewable in Django admin under Notifications
- **Product variant system** — each product has independent variants by size and color, each with its own stock quantity; product images are linked to specific colors for accurate display

---

## Group

**CPSC 471 — Group G-32**

- Shazil Khan
- Tameem Aboueldahab
- Surkhab Mundi
