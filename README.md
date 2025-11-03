# Track Bee – MERN Courier Service Management

A MERN-stack courier service app with JWT auth for Admin, Rider, and Customer, RBAC-protected dashboards, real-time assignments via Socket.io, shipment creation and tracking, rider attendance, analytics, dark mode, and a lightweight chatbot.

## Features
- Admin: totals, riders list, packages list, assign riders, revenue chart.
- Rider: assigned deliveries, real-time assignment notifications, status updates, check-in/out attendance, earnings summary, map link to receiver location.
- Customer: create shipments with auto-pricing (distance-based; express cost multiplier), extra payment for fastest delivery, real-time tracking, history, reports.
- Security: JWT login/register, RBAC on backend and frontend with access denied redirect.
- Realtime: Socket.io for admin→rider assignment and rider→customer status updates.
- UI: Vite + React, no Tailwind/TS, Dark Mode toggle, basic styles.
- Chatbot: basic in-app helper (placeholder for OpenAI/Dialogflow integration).

## Tech
- Backend: Node.js, Express, Mongoose, JWT, Socket.io
- Frontend: Vite + React, React Router, Recharts, Socket.io client
- DB: MongoDB

## Project Structure
- `server/` Express API
- `client/` Vite React app

## Setup
1) Prereqs
- Node.js 18+
- MongoDB running locally (or change `MONGO_URI`)

2) Environment
- Copy env templates and edit if necessary
```
server/.env.example → server/.env
client/.env.example → client/.env
```

3) Install deps
```
# in server/
npm install

# in client/
npm install
```

4) Seed sample users
```
# in server/
node seed.js
```
- Admin: kitty1911@gmail.com / kitty1911 (ADMIN001)
- Customer: sai@gmail.com / ammu1119
- Rider: sravi@gmail.com / sravanthi (RIDER001)

5) Run
```
# in server/
node index.js
# API at http://localhost:4000

# in client/
npm run dev
# Web at http://localhost:5173
```

## Notes
- Pricing is calculated in `server/utils/pricing.js`: base + per-km; express = 1.4x; `extraPaid` adds to price and sets status to prioritized flow.
- RBAC is enforced on backend via `requireRole()` and on frontend via `ProtectedRoute` and redirect to `/denied`.
- Realtime rooms use `user:{_id}` and `role:{role}`. Rider receives `assignment`, customer receives `package:update`.
- Proof of delivery upload stores file path only (no cloud storage). Adjust as needed.
- To enable real OpenAI/Dialogflow, replace `client/src/components/Chatbot.jsx` logic with API calls and secure keys.
