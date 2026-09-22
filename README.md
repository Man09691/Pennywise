# 💰 Pennywise

**A full-stack personal expense tracker built with the MERN stack.**

Pennywise is a personal finance management application designed to make everyday income and expense tracking simple, organized, searchable, and easy to manage — complete with bank statement import and smart transaction categorization.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Database Design](#-database-design)
- [API Design](#-api-design)
- [Security](#-security)
- [Bank Import Details](#-bank-import-details)
- [Getting Started](#-getting-started)
- [API Testing](#-api-testing)
- [Testing Checklist](#-testing-checklist)
- [Future Improvements](#-future-improvements)
- [Project Status](#-project-status)
- [Author](#-author)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Protected routes with public/private route handling
- Password change functionality
- Password hashing with `bcryptjs`

### 💸 Transaction Management
- Add income and expenses
- Edit transactions
- Soft-delete transactions
- Transaction history
- Search and filtering
- Categories, payment methods, dates, and notes
- Dashboard transaction actions

### 📊 Dashboard
- Total income
- Total expenses
- Current balance
- Recent transactions
- Weekly income/expense visualization
- Financial activity summaries

### 🏷️ Category Management
Pennywise supports **shared default categories** and **user-owned custom categories**.

| | Default Categories | Custom Categories |
|---|---|---|
| Ownership | Shared between users | Belong to the creating user |
| `isDefault` | `true` | `false` |
| `user` | `null` | Owner's user ID |
| Edit/Delete | Not allowed | Owner only |
| Deletion rules | N/A | Cannot be deleted while referenced by transactions |

> Category names are handled **case-insensitively**.

Example default categories: `Food`, `Health`, `Bills`, `Income`

### 🏦 Bank Statement Import
A review-based import workflow supporting **CSV** and **PDF** bank statements:

```
Upload
  ↓
Bank Detection
  ↓
Preview
  ↓
Table / Column Detection
  ↓
Transaction Extraction
  ↓
Normalization
  ↓
Validation
  ↓
Review
  ↓
Category Assignment
  ↓
Import
```

Capabilities include:
- Bank detection
- Date extraction
- Debit/credit detection
- Balance extraction
- Description extraction
- Duplicate detection
- Transaction normalization
- Searchable imported transactions
- Review before saving

#### SBI PDF Extraction
The PDF parser uses `pdfjs-dist` and PDF text coordinates to reconstruct transaction tables from **State Bank of India** statements. It's designed to:

- Detect SBI statements and locate the transaction table
- Detect transaction columns and reconstruct rows using PDF X/Y coordinates
- Handle multi-line descriptions
- Ignore repeated table headers and statement metadata
- Separate debit, credit, and balance
- Validate transaction candidates, normalize, and remove duplicates
- Track extraction confidence

The following are **never** treated as transactions:

> Statement From/To/Period · Account Number/No · Customer ID · Branch · IFSC · MICR · Statement Summary · Opening/Closing/Clear Balance · Interest Rate · Page/Footer information

### 🔍 Transaction Search
Imported transactions are normalized into searchable fields: title, description, payment method, reference number, UPI information, merchant information, and category.

Example searches: `rahul` · `upi` · `123456` · `atm`

### 💳 Payment Method Detection
Automatically detected from transaction descriptions: **UPI · ATM · POS/Card · NEFT · RTGS · IMPS · Cheque · Cash · NACH · ECS**

---

## 🛠 Technology Stack

**Frontend**
- React
- Vite
- React Router
- Lucide React
- CSS
- pdfjs-dist

**Backend**
- Node.js
- Express.js (ES Modules)

**Database**
- MongoDB / MongoDB Atlas

**Security**
- JWT
- bcryptjs

**Development Tools**
- Git & GitHub
- VS Code
- Postman
- npm

---

## 🏗 Architecture

```
                    ┌───────────────────┐
                    │       User        │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ React + Vite      │
                    │ Frontend          │
                    └─────────┬─────────┘
                              │ REST / HTTP
                              ▼
                    ┌───────────────────┐
                    │ Express.js        │
                    │ Backend API       │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
       ┌───────────┐    ┌───────────┐   ┌─────────────┐
       │ Auth      │    │ Categories│   │ Transactions│
       │ Routes    │    │ Routes    │   │ Routes      │
       └───────────┘    └───────────┘   └─────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ MongoDB Atlas     │
                    └───────────────────┘
```

---

## 📁 Project Structure

```
Pennywise/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── ...
│   └── package.json
│
└── README.md
```

> The exact structure may evolve as development continues.

---

## 🗄 Database Design

### User
Stores user identity and authentication information.

### Transaction
| Field | Description |
|---|---|
| `user` | Owning user |
| `date` | Transaction date |
| `title` | Transaction title |
| `amount` | Transaction amount |
| `type` | `income` \| `expense` |
| `category` | Linked category |
| `paymentMethod` | Detected/assigned method |
| `note` | Optional note |
| `isDeleted` | Soft-delete flag |
| `deletedAt` | Deletion timestamp |

### Category
| Field | Description |
|---|---|
| `name` | Category name |
| `type` | `expense` \| `income` |
| `user` | `null` for default, owner ID for custom |
| `isDefault` | Whether shared/default |
| `isDeleted` | Soft-delete flag |
| `deletedAt` | Deletion timestamp |

### Budget
The backend architecture includes budget support reserved for future budget-management functionality.

---

## 🔌 API Design

| Route | Description |
|---|---|
| `/api/auth` | Login, registration, and password changes |
| `/api/transactions` | Create, read, update, soft delete |
| `/api/categories` | Get, create, update, delete custom categories |
| `/api/budgets` | Reserved for future budget-management functionality |

---

## 🔒 Security

- **Password Hashing** — Passwords are hashed using `bcryptjs` rather than stored as plain text.
- **JWT Authentication** — Authenticated requests use JSON Web Tokens; protected backend routes verify tokens via authentication middleware.
- **Authorization** — User-owned resources are protected so users cannot modify another user's private categories or transactions.
- **Soft Delete** — Transactions are never permanently deleted. Instead:
  ```
  isDeleted = true
  deletedAt = current timestamp
  ```
  Normal application queries exclude deleted records, preserving historical data.

---

## 🏦 Bank Import Details

### PDF Extraction Pipeline

```
PDF
 ↓
PDF.js text extraction
 ↓
Visual line grouping
 ↓
Bank detection
 ↓
Transaction header detection
 ↓
Column detection
 ↓
Row reconstruction
 ↓
Transaction validation
 ↓
Normalization
 ↓
Deduplication
 ↓
Search preparation
```

The parser extracts PDF text objects together with their `x`, `y`, `width`, and `height` to reconstruct the visual transaction table.

### Transaction Validation
A candidate transaction must have:
- A valid date
- A positive, finite amount
- A meaningful description
- A position inside the transaction table
- A valid debit/credit/amount source
- No metadata/header indicators

> ⚠️ The balance column is informational and must **never** automatically become the transaction amount.

**Example**

Raw bank row:
```
20/08/2026 | UPI/RAHUL SHARMA/HDFC | 500.00 | | 10,500.00
```

Normalized output:
```json
{
  "date": "2026-08-20",
  "title": "UPI/RAHUL SHARMA/HDFC",
  "amount": 500,
  "type": "expense",
  "debit": 500,
  "credit": null,
  "balance": 10500,
  "paymentMethod": "UPI"
}
```

> **Transaction Amount = 500** — **Balance = 10,500** (these are always kept distinct)

### CSV Import
The CSV import workflow is built around **preview and review before importing**.

Known fields: `date`, `type`, `amount`, `category`, `paymentMethod`, `title`, `note`
Required fields: `date`, `type`, `amount`

Missing fields can be reviewed and edited before import. The workflow also includes bank selection/detection and normalized review stages.

---

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm
- MongoDB Atlas account
- Git

Check installations:
```bash
node --version
npm --version
```

### Backend Setup
```powershell
cd Q:\Pennywise\backend
npm install
```
Configure the required environment variables in the backend `.env` file, then start the server:
```powershell
npm run dev
```
Backend runs at: `http://localhost:5000`

### Frontend Setup
Open a second terminal window:
```powershell
cd Q:\Pennywise\frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Running the Complete Application
Use two terminals — one for backend, one for frontend:

```powershell
# Terminal 1 — Backend
cd Q:\Pennywise\backend
npm run dev
```

```powershell
# Terminal 2 — Frontend
cd Q:\Pennywise\frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🧪 API Testing

Postman can be used to test the backend. Recommended flow:

```
Register
  ↓
Login
  ↓
Get JWT
  ↓
Test protected routes
  ↓
Create category
  ↓
Create transaction
  ↓
Get transactions
  ↓
Update transaction
  ↓
Soft delete transaction
```

---

## ✅ Testing Checklist

**Authentication**
- [x] Registration works
- [x] Login works
- [x] Invalid credentials are rejected
- [x] Protected routes require authentication
- [x] Password change works

**Categories**
- [x] Default categories are available
- [x] Default categories cannot be edited
- [x] Default categories cannot be deleted
- [x] Custom categories can be created
- [x] Custom categories can be edited by their owner
- [x] Custom categories can be deleted by their owner
- [x] Category names are case-insensitive
- [x] Referenced categories cannot be deleted

**Transactions**
- [x] Income can be added
- [x] Expense can be added
- [x] Transactions can be edited
- [x] Transactions can be deleted
- [x] Soft-deleted transactions are excluded
- [x] Dashboard refreshes after transaction changes
- [x] Search works
- [x] Filters work

**Bank Import**
- [x] CSV upload works
- [x] PDF upload works
- [x] Bank detection works
- [x] SBI statements are detected
- [x] Transaction table is detected
- [x] Debit and credit are separated
- [x] Balance is not used as transaction amount
- [x] Repeated headers are ignored
- [x] Statement metadata is ignored
- [x] Multi-line transactions are reconstructed
- [x] Duplicate transactions are handled
- [x] Imported rows can be reviewed
- [x] Categories can be assigned before import

---

## 🔮 Future Improvements

- Budget tracking & alerts
- Recurring transactions
- Monthly reports
- Advanced spending analytics
- More bank-specific parsers
- OCR support for scanned statements
- Automatic category suggestions
- Merchant normalization
- Import history
- Advanced duplicate detection
- Export to CSV/PDF
- Production deployment
- Improved mobile experience

---

## 📌 Project Status

Pennywise currently contains the core foundations of a personal expense tracker:

- MERN architecture
- JWT authentication & protected routes
- Transaction CRUD with soft deletion
- Shared default categories & user-owned custom categories
- Dashboard analytics
- Transaction search/filtering
- CSV import workflow
- PDF bank-statement extraction with bank detection
- Transaction normalization & duplicate handling
- Import review workflow
- SBI-focused PDF extraction improvements

The bank-import system is designed to be **extensible**, so additional bank formats can be supported without replacing the entire parser.

---

## 👤 Author

**Man Varmora**
Computer Engineering
Institute of Infrastructure, Technology, Research and Management (IITRAM)

GitHub: [@Man09691](https://github.com/Man09691)

---

## 📄 License

This project is currently a personal/learning project. A formal open-source license can be added if the repository is released under one.

---

## 🙏 Acknowledgements

Pennywise was developed as a hands-on project to explore:

- Full-stack web development
- REST API development
- Authentication and authorization
- MongoDB database design
- React application development
- PDF parsing
- Financial data normalization
- Search and filtering
- Bank-statement processing
- Software development lifecycle practices
