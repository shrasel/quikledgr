# QuikLedgr ⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose_v2-2496ED.svg?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20_Alpine-339933.svg?logo=node.js&logoColor=white)](backend/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](frontend/)
[![MariaDB](https://img.shields.io/badge/MariaDB-11_LTS-003545.svg?logo=mariadb&logoColor=white)](docker-compose.yml)
[![Nginx](https://img.shields.io/badge/Nginx-1.27_Alpine-009639.svg?logo=nginx&logoColor=white)](nginx/)

**QuikLedgr** is a modern, enterprise-grade invoicing web platform modeled after QuickBooks with built-in banking-grade security. Specifically architected for consulting agreements requiring monthly billing submissions, encrypted wire transfer details, recipient access code verification, and executive dashboard metrics.

---

## ✨ Features

- 📊 **Executive Dashboard**: Real-time KPI aggregation displaying strictly **Total**, **Pending**, **Paid**, **Sent**, and **Not Sent** invoice counts and dollar volumes.
- 💼 **QuickBooks-Style Invoicing**: Streamlined itemized invoice generation with real-time calculations, discount/tax handling, pre-approved reimbursable expenses, and currency customization.
- 🔐 **Banking-Grade Wire Transfer Protection**: Sensitive wire transfer banking information (account number, IBAN, SWIFT/BIC, routing) is protected with a 6-digit access PIN.
- 🌐 **Self-Contained Recipient Portal**: Clients receive a clean verification link (`/#/view?id=...`) prompting for the security PIN before revealing wire details.
- 🖨️ **Client-Side PDF & Print Engine**: Pixel-perfect invoice printing and one-click PDF generation via `jsPDF` and `html2canvas`.
- 🔑 **Multi-Factor Authentication**: Clean consultant onboarding with Email & Password or 1-Click Google OAuth simulation.
- 🐳 **Production Docker Monorepo**: Turnkey deployment using Docker Compose orchestrating React, Node.js API, MariaDB with automated schema migrations, and Nginx reverse proxy.

---

## 🏛️ Monorepo Architecture

```text
quikledgr/
├── docker-compose.yml              # Production multi-container orchestration
├── package.json                    # Root monorepo workspace scripts
├── .env.example                    # Reference environment configuration
├── .gitignore                      # Git exclusion rules
├── LICENSE                         # MIT License
├── README.md                       # Documentation
│
├── frontend/                       # React 18 + Vite Web Application
│   ├── Dockerfile                  # Multi-stage build (Node build -> Nginx Alpine)
│   ├── nginx.conf                  # Container Nginx proxy & rate limiting
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── api/client.js           # API client with JWT & offline fallback
│       ├── components/             # Dashboard, Editor, Security Gate, Modals
│       ├── utils/                  # Auth session, crypto, storage
│       └── index.css               # Modern design system & styles
│
├── backend/                        # Node.js + Express REST API Service
│   ├── Dockerfile                  # Node 20 Alpine lightweight container
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── config/db.js            # MariaDB connection pool
│       ├── migrations/             # SQL schema migrations & automated runner
│       │   ├── 001_create_schema.sql
│       │   └── runMigrations.js
│       ├── controllers/            # Auth, Invoices, Dashboard stats, Public unlock
│       ├── middleware/             # JWT auth, error handlers
│       ├── routes/                 # Express API routes
│       └── server.js               # Express application entrypoint
│
└── nginx/                          # Standalone Nginx reverse proxy configurations
    └── default.conf
```

---

## 🐳 Dockerized Services

| Service | Container Name | Technology | Port (Host:Container) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Database** | `quikledgr_db` | MariaDB 11 LTS | `3306:3306` | Transactional database with automated schema migration runner. |
| **Backend API** | `quikledgr_backend` | Node.js 20 + Express | `5000:5000` (internal) | REST API handling auth, invoice records, and PIN hashing. |
| **Web Ingress** | `quikledgr_web` | Nginx 1.27 Alpine | `8085:80` | High-performance reverse proxy serving React frontend and proxying `/api/`. |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/) & [Docker Compose v2](https://docs.docker.com/compose/)
- Node.js 20+ (only required if developing outside Docker)

### 1. Clone & Setup Environment

```bash
git clone https://github.com/shrasel/quikledgr.git
cd quikledgr

# Copy example environment configuration
cp .env.example .env
```

### 2. Launch with Docker Compose

```bash
# Build and launch all 3 containers in detached mode
docker compose up -d --build
```

Access the application in your browser:
- 🌐 **Web Application & Dashboard**: [http://localhost:8085/](http://localhost:8085/)
- 🩺 **API Health Check**: [http://localhost:8085/api/health](http://localhost:8085/api/health)
- 🗄️ **MariaDB Database**: `localhost:3306` (`user: quikledgr_user`, `db: quikledgr_db`)

### 3. Demo Login Credentials

The initial database migration pre-seeds a demo consultant profile:
- **Email**: `alex@wrightsolutions.io`
- **Password**: `demoPassword123`
- *(Alternatively, click **1-Click Sign In** on the authentication screen)*

### 4. Optional: Enable Live Google OAuth 2.0

QuikLedgr supports production Google Identity Services (GIS):
1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** (Web application).
2. Set Authorized JavaScript origins to `http://localhost:8085` (or your production domain).
3. Set `GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com` in `.env`.
*(If no Google Client ID is configured, QuikLedgr seamlessly runs in 1-Click Demo Mode for rapid testing).*

### 5. Viewing Logs & Stopping Containers

```bash
# View combined live container logs
docker compose logs -f

# View backend API logs
docker compose logs -f backend

# Stop all containers
docker compose down
```

---

## 💻 Local Development (Without Docker)

You can run the frontend and backend directly on your host machine for rapid development:

### Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run migrate  # Applies SQL migrations to local MariaDB instance
npm run dev      # Starts API on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status, database connectivity, service info |
| `GET` | `/api/auth/config` | Public | Returns OAuth client configuration (e.g. Google Client ID) |
| `POST` | `/api/auth/register` | Public | Register new consultant account |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password, returns JWT |
| `POST` | `/api/auth/google` | Public | Authenticate and verify Google ID Token (or fallback payload) |
| `GET` | `/api/auth/me` | Bearer JWT | Retrieve currently authenticated user profile |
| `GET` | `/api/dashboard/stats` | Bearer JWT | Returns counts & amounts for Total, Paid, Pending, Sent, Not Sent |
| `GET` | `/api/invoices` | Bearer JWT | List all invoices for authenticated consultant |
| `POST` | `/api/invoices` | Bearer JWT | Create or update invoice with items and wire details |
| `DELETE`| `/api/invoices/:id` | Bearer JWT | Soft or hard delete invoice record |
| `GET` | `/api/public/invoices/:id` | Public | Recipient view of non-sensitive invoice metadata |
| `POST` | `/api/public/invoices/:id/unlock` | Public (Rate Limited) | Verify security PIN and decrypt wire transfer details |

---

## 🔒 Security Best Practices

1. **Brute-Force Rate Limiting**: Nginx enforces a strict rate limit (`rate=5r/m`) on the PIN unlock endpoint `/api/public/invoices/unlock`.
2. **Encrypted Wire Details**: Sensitive wire numbers (IBAN, SWIFT/BIC, bank account numbers) are hashed/encrypted at rest using bcrypt & AES-GCM and never exposed over plain public GET requests.
3. **Hardened HTTP Headers**: Automatic insertion of `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, and `Referrer-Policy`.
4. **Environment Isolation**: Production credentials and secrets are managed via `.env` and kept strictly out of git history.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.
