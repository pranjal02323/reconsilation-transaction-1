# Take-Home Assignment B: The Reconciliation Problem

> A robust, testable, and persistent financial transaction reconciliation engine and interactive web dashboard built with **Node.js, Express, TypeScript, SQLite, and React**.

---

## 📌 Executive Summary & Core Features

Two financial systems record identical trades: your **Internal Ledger (System A)** and an **External Counterparty Statement (System B)**. Because they are built independently, they disagree on column names, date formats, transaction sides (`BUY` vs `B`), amounts, timestamps, and row status.

This application provides an automated daily reconciliation workflow that handles:

1. **Extensible Schema Normalization**: Auto-detects and normalizes field names, date formats (`ISO 8601` vs `SQL datetime`), transaction sides (`BUY`/`PURCHASE`/`B`), and statuses (`SETTLED`/`CANCELLED`).
2. **Configurable Tolerance Engine**:
   - **Amount Drift**: Minor fee variances or rounding differences (e.g. $\le \$0.05$) are classified as `TOLERATED_MATCH`.
   - **Clock Skew**: Slight timestamp drifts due to un-synced system clocks (e.g. $\le 1$ hour) are classified as `TOLERATED_MATCH`.
   - **Major Mismatches**: Flagged as `DISCREPANCY` with field-level delta calculations.
3. **Cancelled Transactions**: Filtered out automatically (`CANCELLED` state records are excluded from active comparison).
4. **Idempotency & File Revision Versioning**:
   - **Idempotency**: Duplicate file uploads are detected via SHA-256 hash.
   - **Revisions**: Uploading a corrected file updates the transaction to a new version (`version + 1`) and deactivates the older row while retaining audit history.
5. **Persistent Manual Resolutions**: Decisions made by operators (pairing two unmatched transactions or accepting a standalone entry) persist across subsequent daily reconciliation runs.
6. **Pure Domain Logic (Database & Browser Agnostic)**: All matching logic is written as pure domain functions and covered by 100% passing Vitest unit tests.

---

## 🏗️ Architecture & Database Design

### System Overview
```
Atlas Reconciliation Engine
├── backend/
│   ├── src/
│   │   ├── domain/             # Pure comparison & parser logic (0 DB dependencies!)
│   │   │   ├── parsers.ts      # CSV normalizer & schema adapter
│   │   │   ├── matchEngine.ts  # Matching rules & tolerance engine
│   │   │   └── types.ts        # Shared domain models
│   │   ├── db/                 # SQLite database & table initialization
│   │   ├── services/           # Ingestion, versioning & persistence service
│   │   └── server.ts           # Express REST API routes
│   └── tests/                  # Standalone Vitest unit test suite
├── frontend/                   # React + TypeScript + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── components/         # Grid diffs, summary cards, resolution drawer, upload modal
│   │   └── App.tsx
└── sample_data/                # Ready-to-use CSV files for evaluation
```

### Database Schema (SQLite)
- **`raw_files`**: Stores ingested file metadata, SHA-256 hash, and upload timestamp.
- **`transactions`**: Stores normalized trade records with versioning (`version`, `is_latest`).
- **`reconciliation_runs`**: Stores daily run executions and aggregate summary statistics.
- **`reconciliation_matches`**: Stores matched transaction pairs, status (`EXACT_MATCH`, `TOLERATED_MATCH`, `DISCREPANCY`, `UNMATCHED_INTERNAL`, `UNMATCHED_EXTERNAL`, `MANUALLY_RESOLVED`, `IGNORED_CANCELLED`), and field diff details (JSON).
- **`manual_resolutions`**: Stores persistent operator resolution overrides (`FORCE_MATCH`, `ACCEPT_UNMATCHED`, `IGNORE`) with audit notes.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Run Unit Tests (Pure Logic Verification)
The comparison engine is testable without a database or browser:
```bash
cd backend
npm install
npm test
```
*Expected Output: `✓ tests/matchEngine.test.ts (10 tests passed)`*

---

### 2. Start Backend & Frontend Application

#### Terminal 1 (Backend API):
```bash
cd backend
npm install
npm run dev
```
*Backend running at `http://localhost:4000`*

#### Terminal 2 (Frontend Dashboard):
```bash
cd frontend
npm install
npm run dev
```
*Dashboard running at `http://localhost:3000`*

---

## 🧪 Step-by-Step Evaluation Walkthrough

1. **Open Dashboard**: Navigate to `http://localhost:3000`.
2. **Initial Seed**: Click **"Load Sample Seed Data"** in the navbar to load the prompt's dataset:
   - `T-1001`: Exact Match
   - `T-1011`: Discrepancy ($34,000 vs $34,170)
   - `T-1015`: Tolerated Drift (25 min clock skew)
   - `T-1018`: Cancelled Ignored
   - `C-9001`: Unmatched External
3. **Inspect Discrepancies**: Click the **Eye icon** on row `T-1011` to inspect the exact field difference ($34,000 gross amount in ledger vs $34,170 in statement).
4. **Manual Resolution**:
   - Click **"Resolve"** on row `C-9001` (Unmatched External).
   - Select **"Accept Standalone Row"** or pair with another unmatched trade.
   - Enter an audit reason (e.g. *"Verified valid counterparty adjustment"*).
   - Click **"Confirm Resolution"**.
5. **Verify Persistence**: Trigger **"Run Reconciliation"** again or re-upload files — observe that row `C-9001` remains in `MANUALLY_RESOLVED` state!
6. **File Revision & Correction**:
   - Click **"Upload CSV"**, choose **Internal Ledger**, and upload `sample_data/ledger_day2_correction.csv`.
   - The system ingests the corrected `T-1011` trade ($34,170), creates version 2, and automatically resolves the discrepancy to `EXACT_MATCH` on the next run!

---

## 📐 Key Design Decisions & Trade-offs

| Decision | Rationale | Trade-off / Scope Choice |
| :--- | :--- | :--- |
| **Node.js + TypeScript + SQLite** | Portable, zero database setup for evaluators, fast synchronous SQLite execution via `better-sqlite3`. | Designed for single-node / local deployment rather than distributed cloud DB. |
| **Pure Function Match Engine** | Completely decouples matching logic from database and network layers. Allows instant, zero-mock unit testing. | Requires database service layer to hydrate models before running comparison. |
| **Versioned Transactions (`is_latest`)** | Allows file updates/corrections to overwrite active rows while preserving old row audit history. | Table size grows over time (can be archived periodically). |
| **1-to-1 Match Primary Engine** | Matches rows deterministically by normalized trade reference ID. | Complex 1-to-Many matching (e.g., 1 bulk trade matched to 3 partial fills) requires operator manual resolution. |

---

## 🔮 What I Would Do Next (Future Improvements)

1. **Fuzzy Reference Auto-Matching**: Implement Levenshtein distance and timestamp/amount proximity clustering to suggest probable matches for unmatched trades with missing reference IDs.
2. **Streaming CSV Ingestion**: For multi-gigabyte files, transition from memory buffer parsing to Node.js stream transformers (`csv-parser` stream pipelines).
3. **Role-Based Audit Logging**: Add granular permission controls (Maker/Checker authorization) for high-value transaction manual overrides.
