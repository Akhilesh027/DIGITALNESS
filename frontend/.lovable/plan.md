
## Plan: Complete Client Management & Invoice System

### 1. Data Models & Store Updates
- Add new types: Invoice, Deliverable, PaymentRecord, ClientWorkReport, WorkComment
- Extend CRM store with invoice CRUD, deliverable tracking, payment tracking
- Add dummy data for invoices, deliverables, and payments

### 2. Invoice System (Web + PDF Export)
- Invoice creation form (select customer, add line items, tax, discounts)
- Invoice preview page with professional layout
- PDF export using browser print/jsPDF
- Invoice status tracking (Draft, Sent, Paid, Overdue)
- Invoice history per customer

### 3. Client Deliverables Board (Full Project Management)
- Per-client monthly deliverables (e.g., "4 videos, 10 social posts, 2 designs")
- Kanban board view (Not Started → In Progress → Review → Completed)
- Assign employees to deliverables
- Comments/notes per deliverable
- Progress bars and completion percentages
- Timeline/due dates

### 4. Payment Tracking & Reminders
- Payment history per customer with dates and amounts
- Outstanding dues dashboard
- Payment reminder UI (mark as "Reminder Sent")
- Payment status badges (Paid, Partial, Overdue)

### 5. Monthly Work Report Generator
- Auto-generated summary of work done per client per month
- Shows: deliverables completed, pending, employee hours, on-time rate
- Export as PDF for sharing with clients

### 6. Client Portal View
- Read-only dashboard showing client's work status
- Progress of current deliverables
- Payment history and pending amounts
- Recent updates/activity feed

### 7. Performance Analytics
- Charts: work completion rate, on-time delivery %, revenue per client
- Employee performance per client
- Monthly trend comparisons

### Pages to create/modify:
- NEW: `InvoicesPage.tsx` - Invoice management
- NEW: `InvoiceDetailPage.tsx` - Invoice view + PDF export
- NEW: `ClientPortalPage.tsx` - Client-facing dashboard
- NEW: `DeliverablesPage.tsx` - Kanban deliverables board
- MODIFY: `CustomersPage.tsx` - Add tabs for deliverables, payments, reports
- MODIFY: `crmStore.ts` - Split into multiple store slices
- MODIFY: `dummyData.ts` - Add new dummy data
- MODIFY: `Sidebar.tsx` - Add new nav items
- MODIFY: `App.tsx` - Add new routes
