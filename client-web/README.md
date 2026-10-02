# Digitalness Client Portal (React Web)

A modern, high-performance **React Web Portal** converted from the Digitalness Client Mobile Application. Designed for enterprise clients to track marketing campaigns, development deliverables, assigned team members, brand files, and billing retainers.

---

## 🚀 Key Features & Screen Mapping

| Mobile App Screen (`client app`) | React Web App (`client-web`) | Description |
| :--- | :--- | :--- |
| **`LoginScreen.js`** | **`/login` (`LoginPage.jsx`)** | Secure client sign-in hitting `https://server.digitalness.co.in/api/clients/login`, password visibility toggle, and instant one-click demo login. |
| **`DashboardScreen.js`** | **`/` (`DashboardPage.jsx`)** | Real-time project overview, overall completion percentage, metric KPI cards, status & priority distribution bars, recent works, and priority support. |
| **`WorksScreen.js`** | **`/works` (`WorksPage.jsx`)** | Filterable works & tasks by status (*All, In Progress, Review, Pending, Revision, Completed*), search bar, deliverables tracker, SLA days, expandable milestones, and client feedback modal. |
| **`TeamScreen.js`** | **`/team` (`TeamPage.jsx`)** | Assigned Digitalness specialists (Frontend leads, UI/UX designers, Performance marketers) with direct contact actions (*Email, Phone, WhatsApp*). |
| **`AttachmentsScreen.js`** | **`/attachments` (`AttachmentsPage.jsx`)** | Secure asset vault for logos, brand guidelines, product catalogues, and copy docs with direct multipart upload to `/client-attachments`. |
| **`PaymentsScreen.js`** | **`/payments` (`PaymentsPage.jsx`)** | Professional invoice ledger, GST tax receipts, total settled / pending balance, and official agency bank transfer (HDFC Bank) & UPI settlement information. |
| **`ProfileScreen.js`** | **`/profile` (`ProfilePage.jsx`)** | Company profile, representative contact details, branch allocation, retainer package level, security password change, and sign-out confirmation. |

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom dark mode & golden branding
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **API Base**: `https://server.digitalness.co.in/api`

---

## ⚡ Quick Start

```bash
# 1. Navigate to the client-web directory
cd "client-web"

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The web application will launch locally at `http://localhost:5174/`.

---

## 🌐 Production Build & Deployment

```bash
# Build production bundle into /dist
npm run build

# Preview production build locally
npm run preview
```

### Recommended Domains
- Production: `https://client.digitalness.co.in` or `https://portal.digitalness.co.in`
