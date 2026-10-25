💰 Pennywise
A full-stack personal expense tracker built with the MERN stack.

Pennywise is a personal finance management application designed to make everyday income and expense tracking simple, organized, searchable, and easy to manage — complete with bank statement import, transaction categorization, and a local-LLM-powered AI assistant.
📋 Table of Contents
- Features
- Technology Stack
- Architecture
- AI Assistant and MCP (V2)
- Project Structure
- Database Design
- API Design
- Security
- Bank Import Details
- Getting Started
- API Testing
- Testing Checklist
- Future Improvements
- Project Status
- Author
- License
- Acknowledgements
✨ Features
🔐 Authentication
- User registration and login
- JWT-based authentication
- Protected routes with public/private route handling
- Password change functionality
- Password hashing with bcryptjs
💸 Transaction Management
- Add income and expenses
- Edit transactions
- Soft-delete transactions
- Transaction history
- Search and filtering
- Categories, payment methods, dates, and notes
- Dashboard transaction actions
📊 Dashboard
- Total income
- Total expenses
- Current balance
- Recent transactions
- Weekly income/expense visualization
- Financial activity summaries
🏷️ Category Management
Pennywise supports shared default categories and user-owned custom categories.
	Default Categories	Custom Categories
Ownership	Shared between users	Belong to the creating user
isDefault	true	false
user	null	Owner's user ID
Edit/Delete	Not allowed	Owner only
Deletion rules	N/A	Cannot be deleted while referenced by transactions


Category names are handled case-insensitively.

Example default categories: Food, Health, Bills, Income
🏦 Bank Statement Import
A review-based import workflow supporting CSV and PDF bank statements:
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
SBI PDF Extraction
The PDF parser uses pdfjs-dist and PDF text coordinates to reconstruct transaction tables from State Bank of India statements. It's designed to:
- Detect SBI statements and locate the transaction table
- Detect transaction columns and reconstruct rows using PDF X/Y coordinates
- Handle multi-line descriptions
- Ignore repeated table headers and statement metadata
- Separate debit, credit, and balance
- Validate transaction candidates, normalize, and remove duplicates
- Track extraction confidence
The following are never treated as transactions:
Statement From/To/Period · Account Number/No · Customer ID · Branch · IFSC · MICR · Statement Summary · Opening/Closing/Clear Balance · Interest Rate · Page/Footer information

🤖 AI Financial Assistant (V2)
- Conversational assistant for general questions and questions about your own Pennywise financial data
- Local Ollama language model for development, without requiring a paid LLM API
- Intent routing between general conversation and account-data questions
- Read-only MCP tools for transactions, monthly summaries, category spending, categories, and budget status
- Authenticated, user-scoped data access through the existing backend API
- Conversation history sent with chat requests (currently not persisted across logins)
- AI-assisted transaction creation under development; no automatic transaction write is enabled yet
🔍 Transaction Search
Imported transactions are normalized into searchable fields: title, description, payment method, reference number, UPI information, merchant information, and category.

Example searches: rahul · upi · 123456 · atm
💳 Payment Method Detection
Automatically detected from transaction descriptions: UPI · ATM · POS/Card · NEFT · RTGS · IMPS · Cheque · Cash · NACH · ECS
🛠 Technology Stack
Frontend
- React
- Vite
- React Router
- Lucide React
- CSS
- pdfjs-dist
Backend
- Node.js
- Express.js (ES Modules)
Database
- MongoDB / MongoDB Atlas
Security
- JWT
- bcryptjs
AI and Integration
- Ollama (local LLM; currently tested with llama3.2:3b)
- Model Context Protocol (MCP) server/client
- AJV tool-argument validation
Development Tools
- Git & GitHub
- VS Code
- Postman
- npm
🏗 Architecture
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
🤖 AI Assistant and MCP (V2)
Pennywise V2 extends the MERN application with a conversational assistant. During local development, Ollama runs the language model on the developer's machine. The MCP server exposes a limited set of tools that retrieve account data through authenticated Pennywise API calls.
React Assistant chat
        |
        v
Express /assistant (JWT authentication)
        |
        v
Intent router (GENERAL / PENNYWISE)
        |                         |
        | GENERAL                 | PENNYWISE
        v                         v
Ollama general response      Ollama + MCP tool selection
                                  |
                            Reply classification
                                  |
                            AJV argument validation
                                  |
                            MCP client / MCP server
                                  |
                            Authenticated REST API
                                  |
                               MongoDB
Available read-only MCP tools
Tool	Purpose
get_transactions	Retrieve the signed-in user's transactions, with supported filters
get_monthly_summary	Summarize income and expenses for a specified month
get_spending_by_category	Break down spending by category
get_categories	List accessible categories
get_budget_status	Retrieve budget status where supported by the backend


The assistant uses the existing authentication boundary: the backend forwards the authenticated user's JWT to the MCP-to-API layer; the token is not supplied to the language model. MCP tools are read-only and cannot delete transactions.
AI transaction creation — work in progress
The next milestone is a confirmation-first write flow. The pure date, type, category, and draft validation resolvers are implemented, and their 11 unit tests passed in the last recorded test run. A PendingAction schema and a Transaction.sourceActionId unique partial index have also been added and checked. MongoDB transaction/rollback support has been verified using an isolated temporary collection.

Planned flow:
User requests transaction
        ↓
Resolve fields and ask for missing information
        ↓
Save pending draft and show confirmation
        ↓
User confirms
        ↓
Atomically claim action for processing
        ↓
Create transaction with sourceActionId idempotency
        ↓
Mark action confirmed / recover safely on retry
Unknown categories will require explicit selection or confirmation of a new category. Draft confirmation, transaction creation, and recovery are not yet wired into the running assistant.
📁 Project Structure
Pennywise/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   │   └── ai/
│   │       └── writeActions/
│   ├── test/
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
├── mcp-server/
│   ├── src/
│   └── package.json
│
└── README.md
The exact structure may evolve as development continues.

🗄 Database Design
User
Stores user identity and authentication information.
Transaction
Field	Description
user	Owning user
date	Transaction date
title	Transaction title
amount	Transaction amount
type	income | expense
category	Linked category
paymentMethod	Detected/assigned method
note	Optional note
isDeleted	Soft-delete flag
deletedAt	Deletion timestamp
sourceActionId	Optional reference to an AI pending action; unique for idempotency


Category
Field	Description
name	Category name
type	expense | income
user	null for default, owner ID for custom
isDefault	Whether shared/default
isDeleted	Soft-delete flag
deletedAt	Deletion timestamp


PendingAction (V2, write workflow in progress)
Stores a user-owned proposed transaction, its missing fields, optional proposed new category, status (PENDING, PROCESSING, CONFIRMED, CANCELLED, FAILED), processing timestamps, and expiration. The model is present, but the full confirmation workflow is not yet active.
Budget
The backend architecture includes budget support reserved for future budget-management functionality.
🔌 API Design
Route	Description
/api/auth	Login, registration, and password changes
/api/transactions	Create, read, update, soft delete
/api/categories	Get, create, update, delete custom categories
/api/budgets	Reserved for future budget-management functionality
/assistant	JWT-protected AI assistant endpoint (mounted path depends on backend router configuration)


🔒 Security
- Password Hashing — Passwords are hashed using bcryptjs rather than stored as plain text.
- JWT Authentication — Authenticated requests use JSON Web Tokens; protected backend routes verify tokens via authentication middleware.
- Authorization — User-owned resources are protected so users cannot modify another user's private categories or transactions.
- AI Tool Isolation — MCP reads use the authenticated user context, and the JWT is kept out of LLM prompts.
- AI Write Safety (in progress) — A unique sourceActionId index has been added to support idempotent confirmed writes; the end-to-end write flow is not yet implemented.
- Soft Delete — Transactions are never permanently deleted. Instead:isDeleted = true
  deletedAt = current timestamp
  Normal application queries exclude deleted records, preserving historical data.
🏦 Bank Import Details
PDF Extraction Pipeline
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
The parser extracts PDF text objects together with their x, y, width, and height to reconstruct the visual transaction table.
Transaction Validation
A candidate transaction must have:
- A valid date
- A positive, finite amount
- A meaningful description
- A position inside the transaction table
- A valid debit/credit/amount source
- No metadata/header indicators
⚠️ The balance column is informational and must never automatically become the transaction amount.

Example

Raw bank row:
20/08/2026 | UPI/RAHUL SHARMA/HDFC | 500.00 | | 10,500.00
Normalized output:
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
Transaction Amount = 500 — Balance = 10,500 (these are always kept distinct)

CSV Import
The CSV import workflow is built around preview and review before importing.

Known fields: date, type, amount, category, paymentMethod, title, note
Required fields: date, type, amount

Missing fields can be reviewed and edited before import. The workflow also includes bank selection/detection and normalized review stages.
🚀 Getting Started
Prerequisites
- Node.js
- npm
- MongoDB Atlas account
- Git
Check installations:
node --version
npm --version
Backend Setup
cd Q:\Pennywise\backend
npm install
Configure the required environment variables in the backend .env file, then start the server:
npm run dev
Backend runs at: http://localhost:5000
Frontend Setup
Open a second terminal window:
cd Q:\Pennywise\frontend
npm install
npm run dev
Frontend runs at: http://localhost:5173
Local AI / MCP setup (V2)
Install Ollama and pull the model used for local development:
ollama pull llama3.2:3b
ollama list
Install the MCP server dependencies:
cd Q:\Pennywise\mcp-server
npm install
The MCP server uses stdio and is launched by its client integration or for standalone inspection. Configure the backend and MCP environment variables using the project's local environment files. Do not commit .env, MongoDB credentials, JWT secrets, or tokens. A local Ollama instance must be running for AI responses; this README does not claim a deployed cloud LLM service.
Running the Complete Application
Use two terminals — one for backend, one for frontend:
# Terminal 1 — Backend
cd Q:\Pennywise\backend
npm run dev
# Terminal 2 — Frontend
cd Q:\Pennywise\frontend
npm run dev
Then open http://localhost:5173 in your browser.
🧪 API Testing
Postman can be used to test the backend. Recommended flow:
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
✅ Testing Checklist
Authentication
- [x] Registration works
- [x] Login works
- [x] Invalid credentials are rejected
- [x] Protected routes require authentication
- [x] Password change works
Categories
- [x] Default categories are available
- [x] Default categories cannot be edited
- [x] Default categories cannot be deleted
- [x] Custom categories can be created
- [x] Custom categories can be edited by their owner
- [x] Custom categories can be deleted by their owner
- [x] Category names are case-insensitive
- [x] Referenced categories cannot be deleted
Transactions
- [x] Income can be added
- [x] Expense can be added
- [x] Transactions can be edited
- [x] Transactions can be deleted
- [x] Soft-deleted transactions are excluded
- [x] Dashboard refreshes after transaction changes
- [x] Search works
- [x] Filters work
Bank Import
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
AI resolver tests
Run the existing resolver unit tests from the backend folder:
cd Q:\Pennywise\backend
node --test .\test\writeActionResolvers.test.js
The last recorded run passed all 11 tests. Re-run after changes to verify the current working tree.
🔮 Future Improvements
- Complete AI transaction draft, confirmation, and idempotent creation workflow
- Recover interrupted AI actions and confirm new categories safely
- Persist user-specific chat history across sessions
- Add hosted AI support for deployment without requiring end users to install Ollama
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
📌 Project Status
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
- Local Ollama AI assistant with authenticated read-only MCP integration
- AI write-action resolvers and initial persistence/index groundwork (confirmation flow still in development)
The bank-import system is designed to be extensible, so additional bank formats can be supported without replacing the entire parser.
👤 Author
Man Varmora
Computer Engineering
Institute of Infrastructure, Technology, Research and Management (IITRAM)

GitHub: @Man09691
📄 License
This project is currently a personal/learning project. A formal open-source license can be added if the repository is released under one.
🙏 Acknowledgements
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
- Local language models and MCP-based tool integration
