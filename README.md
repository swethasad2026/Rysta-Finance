# Rysta FMCG — Financial Management & ERP Platform

A complete, production-grade FMCG (Fast-Moving Consumer Goods) Financial Management web application designed for multi-tier distribution networks, trade scheme budgeting, Indian GST compliance, and automated accounting workflows.

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **TanStack Query & Table**, and **Recharts**, seamlessly wired to an **n8n webhook backend** backed by PostgreSQL.

---

## 1. Key Capabilities & Features

### 🏢 Sales & Distribution Management
- **Products & SKUs**: Master catalog with FMCG packaging units (PKT, BAG, POUCH, CASE), HSN codes, GST slabs (0%, 5%, 12%, 18%, 28%), MRP, cost price, and warehouse stock levels.
- **Customers & Retailers**: Hierarchical classification into Super Distributors, Modern Trade (Supermarkets), and General Trade (Kirana Stores) with GSTIN verification, credit limits, payment terms, and ledger statements.
- **Sales Orders Flow**: Complete lifecycle (`Draft` → `Confirmed` → `Dispatched` → `Delivered` → `Invoiced` / `Cancelled`) with automated GST calculation, interstate (IGST) vs intrastate (CGST/SGST) handling, and credit-limit warning safeguards.
- **GST Tax Invoices**: Rule-46 compliant printable GST Tax Invoices featuring company headers, E-Way Bill references, HSN breakdown, Indian numbering system currency formatting (`₹12,34,567.89`), amount in words (*"Rupees Only"*), NEFT/RTGS bank details, and digital authorization signatures.
- **Payments & Receipts**: Multi-mode vouchers (UPI, NEFT/RTGS, Cheque, Cash) with FIFO auto-allocation against open receivables.

### 🏭 Supply & Procurement
- **Suppliers & Millers**: Vendor profiles with full bank account particulars for automated direct payout disbursements.
- **Purchase Orders & Bills**: Procurement workflow (`Draft` → `Approved` → `Sent` → `Received` → `Billed`) with automated bill conversion and payables tracking.
- **Inventory & Batches**: Multi-warehouse stock tracking (Bhiwandi Hub, Pune DC, Delhi Hub), physical stock variance adjustments, inter-hub transfers, and near-expiry batch monitoring.

### 💰 Finance, Accounting & Compliance
- **Double-Entry General Ledger**: Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses), balanced Journal Vouchers, and real-time Trial Balance.
- **GST Filing Reports**: GSTR-1 (Table 4A B2B outward supplies), GSTR-3B monthly return computation, and Table 12 HSN outward summary with GSTN JSON/Excel export.
- **Financial Analytics**: Receivables aging slabs (0-30, 31-60, 61-90, 90+ days), territorial gross margins, and monthly P&L statements.
- **Trade Promotion Schemes**: Trade budget allocation vs actual spend tracking for festive discounts, volume slab rebates, and buy-X-get-Y deals.

### 🔐 Security & Administration
- **Role-Based Access Control (RBAC)**: Distinct permissions for `admin`, `accountant`, and `sales` roles with route guards and UI button guards.
- **Token Expiry Management**: 8-hour JWT token sessions with proactive 15-minute countdown expiration warnings and session refresh capability.
- **Audit Trails**: Security login audit logs recording IP address, user agent, timestamps, and authentication results.

---

## 2. Tech Stack

| Technology | Purpose |
|---|---|
| **React 18 + Vite** | High-performance frontend build pipeline |
| **TypeScript** | Strict compile-time typing for all FMCG entities |
| **Tailwind CSS** | Professional corporate finance design system with Dark/Light modes |
| **TanStack Query (v5)** | Server state management and caching |
| **TanStack Table (v8)** | Data tables with search, sorting, pagination, and CSV export |
| **React Hook Form + Zod** | Form validation with inline error messaging |
| **Recharts** | Interactive financial charts (Bar, Line, Donut) |
| **Zustand** | Auth store with persistent storage and token timers |
| **Lucide Icons** | Accessible iconography |

---

## 3. Environment Configuration

Create a `.env` file in the root directory (copied from `.env.example`):

```env
# FMCG Financial Management Environment Configuration
VITE_API_BASE_URL=https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47
VITE_SIGNUP_WEBHOOK_URL=https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47
VITE_USE_MOCK=false
VITE_APP_NAME="Rysta FMCG Financials"
```

### Switching From Mock to Real n8n Webhook API

The application has a pluggable API layer inside `/src/api/*`.
- When `VITE_USE_MOCK=true`: The in-memory / local-storage persistent mock service is used with preloaded FMCG datasets (orders, invoices, ledgers, products, users).
- When `VITE_USE_MOCK=false`: Every API call dispatches real HTTP requests to the n8n webhook base URL configured in `VITE_API_BASE_URL`.

All HTTP calls pass through `/src/api/client.ts`, which automatically injects `Authorization: Bearer <token>` and intercepts 401 unauthorized errors to safely terminate sessions.

---

## 4. Backend Endpoints (n8n Webhook / Postgres)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register new user `{ name, email, password }` |
| `POST` | `/login` | Authenticate user `{ email, password }` -> returns `{ token, user }` |
| `GET / POST` | `/products` | List all SKUs or create a new SKU |
| `PUT / DELETE`| `/products/:id` | Update or remove product |
| `GET / POST` | `/customers` | List or create customer / trade partner |
| `GET / POST` | `/suppliers` | List or create raw material supplier |
| `GET / POST` | `/sales-orders` | Fetch orders or create new sales order |
| `PATCH` | `/sales-orders/:id/status` | Advance status (`confirmed`, `dispatched`, etc.) |
| `POST` | `/sales-orders/:id/convert-to-invoice` | Convert sales order to GST tax invoice |
| `GET / POST` | `/invoices` | List invoices or generate tax invoice |
| `POST` | `/invoices/:id/void` | Void invoice and reverse customer ledger |
| `GET / POST` | `/payments` | List or record customer receipts / vendor disbursements |
| `GET / POST` | `/purchase-orders` | Procurement PO workflow |
| `POST` | `/purchase-orders/:id/convert-to-bill` | Convert PO to vendor bill |
| `GET / POST` | `/inventory/adjustments` | Record stock audits and adjustments |
| `GET / POST` | `/promotions` | Manage trade promotion schemes |
| `GET / POST` | `/ledger/journal-entries` | Double-entry journal voucher posting |
| `GET / POST` | `/taxes/rates` | GST tax slab rate master |
| `POST` | `/settings/test-webhook` | Test connectivity with n8n workflow |

---

## 5. Demo Credentials

Quick-fill buttons are provided on the login page for testing different role permissions:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@rystafmcg.com` | `admin123` | Full access to all modules, User management, Company Settings |
| **Accountant** | `accountant@rystafmcg.com` | `acc123` | Invoices, Bills, Ledgers, GST Taxes, Stock Adjustments, Reports |
| **Sales Officer** | `sales@rystafmcg.com` | `sales123` | Products, Customers, Sales Orders, Invoices (view), Receipts |

---

## 6. Development & Build

### Install Dependencies
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### Typecheck & Production Build
```bash
npm run build
```
This generates the optimized bundle in the `/dist` directory.

---

## 7. Quality & Architecture Highlights

- **Indian Rupee Formatting**: Currency formatted using Indian comma grouping (Lakhs & Crores, e.g., `₹12,34,567.89`) via `/src/utils/formatters.ts`.
- **Numbers to Words**: Generates official legal text on GST invoices (e.g. *"Rupees Sixty Two Thousand Four Hundred Two Only"*).
- **Responsive Navigation**: Collapsible desktop sidebar with grouped navigation, mobile drawer menu, and global quick search shortcut (`Cmd/Ctrl + K`).
- **Print Optimization**: Native `@media print` stylesheets hide headers and sidebars, rendering clean letterheads and invoices.
