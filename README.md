# DripLy — Digital Wardrobe & Personal Stylist

DripLy is a state-of-the-art web application designed to catalog your personal closet, track laundry status, and suggest outfits. Powered by AI and custom rules, DripLy coordinates your tops, bottoms, outerwear, footwear, and accessories to keep you looking your best.

---

## Key Features

1. **AI Closet Classification**: Take or upload a picture of a clothing item. DripLy classifies it (category, subcategory, color details, patterns, fabrics, seasons, and occasions) automatically.
2. **Laundry Manager**: Keep track of what is clean (`Available`) and what is dirty (`Dirty`). Toggle laundry status instantly with dedicated action buttons and live closet statistics.
3. **Personalized Outfit Suggestions**:
   - **AI-Powered Suggestions**: Request custom recommendations based on occasion and style goals (e.g. "something warm for a rainy day"). Powered by Google Gemini AI.
   - **Rules-Based Matches**: Fallback matches automatically generated from clean, active clothes in your closet.
4. **Favorites System**: Save and favorite outfit combinations. Manage them all from a dedicated page.
5. **Style Profile Settings**: Record style metrics (gender, height, weight, body type) to customize outfit generation algorithms.
6. **Smart Caching & Real-Time Sync**: Driven by TanStack React Query, all count tallies, outfit status indicators, and session states update instantly across pages without manual refreshes. Wipes in-memory cache upon logout to ensure absolute privacy between switching accounts.

---

## Technology Stack

* **Frontend**: React (Vite), Tailwind CSS, TanStack React Query, React Hook Form, Framer Motion, Lucide Icons.
* **Backend**: Node.js, Express, Prisma ORM, Zod Validation, Pino Logging.
* **AI Integration**: Google Gemini AI (`@google/genai` with `gemini-3.5-flash`).
* **Database**: PostgreSQL (Neon Serverless PgBouncer support).
* **Media Uploads**: Cloudinary API.

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- NPM (v9 or higher)
- PostgreSQL database instance (or a Neon.tech connection)

### 2. Database Setup
Ensure you have a PostgreSQL database running. Initialize the database schema using Prisma:
```bash
# In the server directory
npx prisma db push
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory. Use the structure in [server/.env.example](file:///d:/DripLy-Digital-Wardrobe-Personal-Stylist/server/.env.example):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db_name>?sslmode=require&pgbouncer=true
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Running the Application
DripLy uses NPM Workspaces. You can boot the server and client concurrently from the project **root directory**:
```bash
# Run both frontend and backend concurrently
npm run dev
```
The client will run on [http://localhost:5173](http://localhost:5173) and proxy API requests automatically to the backend on [http://localhost:5000](http://localhost:5000).

---

## Deployment Guide

### Frontend Client (Vercel)
1. Import the repository or the `client` directory to Vercel.
2. In the Vercel project configuration, set the **Framework Preset** to `Vite`.
3. Add the following **Environment Variable**:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://driply-api.onrender.com/api/v1`).
4. Vercel's static router will serve the React build and route static page requests securely.

### Backend Server (Render / Railway)
1. Deploy the `server` directory or configure the deploy command to build the workspace.
2. Ensure you add all the Environment Variables listed in your server's `.env` configuration.
3. Set the build and start commands:
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `node src/server.js`
4. Add your deployed Vercel client URL to the server's `allowedOrigins` list in [app.js](file:///d:/DripLy-Digital-Wardrobe-Personal-Stylist/server/src/app.js) to configure CORS securely.
