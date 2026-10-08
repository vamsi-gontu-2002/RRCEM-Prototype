# ReturnFlow — Retail Returns, Refunds & Claims Exception Management
## Functional Frontend Prototype & Mendix Replication Blueprint

A complete, production-grade frontend prototype for an enterprise retail reverse logistics and exception management platform. Built strictly with **HTML5, CSS3, and Vanilla JavaScript**, running 100% locally in any browser with **zero external dependencies, CDNs, or server installations**.

---

## 1. Business Context & Objective

In modern multi-channel retail operations, managing returns, customer refunds, and supplier warranty claims is often fragmented across customer support, finance, vendor management, and fulfillment warehouses.

### Core Value Proposition:
- **70% Straight-Through Auto-Decisioning:** Automatically evaluate, policy-check, and approve low-risk, standard return claims (≤ ₹5,000 within 30-day window) in seconds.
- **Controlled Exception Workflows:** Systematically route high-value (≥ ₹10,000), damaged, suspected-fraud, or out-of-policy returns to specialized human review queues with strict SLA countdowns.
- **Closed-Loop Financial & Inventory Reconciliation:** Link approved customer refunds directly to Finance settlement disbursement, Supplier Warranty Chargebacks, and Warehouse WMS physical disposition (Restock, Refurbish, Liquidate, Scrap).
- **Audit Compliance & Visibility:** Maintain an immutable event log for every manual override, AI decision, and financial transaction.

---

## 2. Quick Start & How to Launch

1. Open `index.html` directly in any web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
2. No command line, `npm`, node server, database, or network connection required.
3. Everything is persisted in browser `localStorage`. Refreshing or reopening the browser preserves all submitted returns, decisions, refunds, claims, and activity logs.

---

## 3. Demo Credentials & Role-Based Access Control (RBAC)

The application simulates a multi-stakeholder enterprise system with 6 distinct user personas:

| Role | Username | Password | Key Capabilities & Assigned Modules |
| :--- | :--- | :--- | :--- |
| **Customer Service Agent** | `cs.agent` | `demo123` | Create Returns, View Cases, Run Live AI Review, Submit Exceptions. |
| **Returns Manager** | `returns.manager` | `demo123` | Full Exception Work Queue, Approve/Reject Refunds, AI Overrides, Analytics. |
| **Finance Approver** | `finance.approver` | `demo123` | Finance Settlement Queue, UPI / Card Disbursement Authorization, Ledger Totals. |
| **Vendor Manager** | `vendor.manager` | `demo123` | Supplier Recovery Claims, Warranty Chargebacks, Accept/Dispute Resolution. |
| **Warehouse Manager** | `warehouse.manager` | `demo123` | Return Disposition (Restock, Refurbish, Liquidate, Scrap), WMS Bay Updates. |
| **Administrator** | `admin` | `admin123` | All modules, Audit Activity Log, Environment Reset & Demo Data Management. |

> **Quick Switching:** You can switch between personas at any time using the **Persona Switcher** dropdown in the top navigation bar, or via the **One-Click Demo Roles** on the Sign-In screen.

---

## 4. End-to-End Multi-Role Demonstration Flow

To demonstrate the full business lifecycle to stakeholders, follow this recommended 6-step walkthrough:

```
[1. CS Agent] Create Return (₹18,499) + AI Review
                    ↓
[2. Returns Manager] Review Exception & Approve Refund
                    ↓
[3. Finance Approver] Authorize Bank Settlement Disbursement
                    ↓
[4. Vendor Manager] Process Supplier Warranty Chargeback Claim
                    ↓
[5. Warehouse Lead] Confirm Inspection & WMS Disposition (Refurbish)
                    ↓
[6. Admin] Audit Log Verification & Executive Intelligence Analytics
```

### Step-by-Step Script:

1. **Step 1 — Login as Customer Service (`cs.agent` / `demo123`)**
   - Click **Create Return** from the sidebar.
   - Enter a high-value damaged or defective item (e.g., Robotic Vacuum at ₹18,499).
   - Click **Run AI Review**: Observe the live evaluation showing policy checks, risk rating, confidence gauge, and human reasoning.
   - Click **Submit Return Case**. Notice how the case is automatically routed to the Exception Queue.

2. **Step 2 — Switch to Returns Manager (`returns.manager`)**
   - Click the top-bar persona switcher and select **Returns Manager**.
   - Navigate to the **Exception Queue**.
   - Click **Review & Decide** on the newly created case.
   - Review the customer notes and OCR-verified diagnostic evidence.
   - Click **Approve Refund**. Notice how the case moves to `Refund Approved` and dispatches a notification to Finance.

3. **Step 3 — Switch to Finance Approver (`finance.approver`)**
   - Switch persona to **Finance**.
   - Open **Finance Approval**.
   - Locate the pending refund under the settlement queue.
   - Click **Approve Settlement**. The transaction is authorized, assigned a gateway reference, and status updates to `Settlement Approved`.

4. **Step 4 — Switch to Vendor Manager (`vendor.manager`)**
   - Switch persona to **Vendor Manager**.
   - Open **Vendor Recovery**.
   - View the automated warranty chargeback claim raised against the supplier.
   - Click **Review** → Enter supplier notes → Click **Accept & Settle Claim**.

5. **Step 5 — Switch to Warehouse Lead (`warehouse.manager`)**
   - Switch persona to **Warehouse**.
   - Open **Return Disposition**.
   - Click **Process** on the return item.
   - Choose **REFURBISH** or **RESTOCK**, update the warehouse bay location, and click **Confirm WMS Inventory Update**.

6. **Step 6 — Switch to Administrator (`admin`)**
   - Switch persona to **Administrator**.
   - Navigate to **Activity Log** to demonstrate the immutable compliance audit trail capturing every user action with timestamps.
   - Navigate to **Analytics** to view automated resolution rates, cycle time reductions, and supplier quality scorecards.

---

## 5. LocalStorage Data Model Architecture

The prototype simulates an enterprise relational backend through synchronized `localStorage` stores:

- `rrc_users`: User master records, credentials, avatars, and permission matrices.
- `rrc_current_user`: Active authenticated session object.
- `rrc_cases`: Master return cases containing customer data, order metadata, AI assessments, risk scores, and lifecycle statuses.
- `rrc_exceptions`: Active exception queue items with SLA timers and assignment owners.
- `rrc_refunds`: Financial refund disbursement records linked to cases and gateway references.
- `rrc_vendor_claims`: Supplier warranty claims and chargeback recovery records.
- `rrc_dispositions`: Physical warehouse intake records with grading and WMS inventory adjustments.
- `rrc_notifications`: Real-time operational alerts dispatched across roles upon lifecycle triggers.
- `rrc_activity_log`: Immutable compliance audit trail logging actor, action, timestamp, and details.
- `rrc_settings`: Configurable business policy thresholds (auto-approve ceiling, SLA windows).

---

## 6. Mendix Implementation Blueprint

This prototype is structurally engineered for seamless 1:1 replication in **Mendix Studio Pro**:

| Prototype Component | Mendix Studio Pro Architecture | Description / Logic |
| :--- | :--- | :--- |
| **Return Case Model** | Domain Model Entity: `ReturnCase` | Attributes: `CaseId`, `OrderId`, `CustomerName`, `PurchaseValue`, `ReturnReason`, `RiskLevel`, `Status`, `SLAHoursRemaining`. Associations to `Customer`, `Order`, `Vendor`. |
| **AI Decision Engine** | Microflow: `SUB_EvaluateReturnCaseWithAI` | Invokes Azure OpenAI / Amazon Bedrock / Claude REST API with document attachments; parses JSON output into domain entities. |
| **Policy Rules** | Business Rules / Decision Table (DMN) | Decision table checking `DaysSincePurchase <= 30`, `PurchaseValue <= 5000`, and `FraudScore < 20`. |
| **Exception Routing** | Mendix Workflow Engine | `Workflow_ReturnException` routing task to `ReturnsManager` role with SLA escalation timers. |
| **Refund Disbursement** | Payment Gateway REST Integration | `ACT_ProcessRefundDisbursement` microflow integrating with Razorpay / Stripe / PayU APIs. |
| **Vendor Claims** | Domain Entity: `VendorClaim` | Associated with `ReturnCase` and `VendorAccount`; exposed via role-restricted Vendor Portal pages. |
| **Warehouse Disposition** | WMS REST Connector | Microflow publishing inventory adjustments to Manhattan / SAP WMS endpoints upon barcode scan. |
| **RBAC Security** | Module & Page Security | Configured roles: `CustomerService`, `ReturnsManager`, `FinanceApprover`, `VendorManager`, `WarehouseLead`, `Administrator`. |

---

## 7. Resetting the Demo Environment

To restore the application to its pristine demonstration state at any time:
1. Log in as `admin` (password: `admin123`).
2. Navigate to **Admin Data** in the sidebar.
3. Click **Restore Default Demo Data (Full Reset)**.
4. Confirm the prompt to wipe modified localStorage records and re-seed original sample cases.
