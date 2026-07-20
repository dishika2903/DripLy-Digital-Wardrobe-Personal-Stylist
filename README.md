# DripLy — AI-Powered Digital Wardrobe & Personal Stylist

DripLy is a digital wardrobe and personal stylist application built with a Node.js/Express.js backend and a React (Vite) + Tailwind CSS frontend.

## Project Structure

- `client/`: React/Vite SPA (JavaScript)
- `server/`: Node/Express modular monolith with Prisma ORM (JavaScript)
- `ai-service/`: Future FastAPI service for ML/AI visual features

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (or Neon connection)

### Local Development

1. Create a `.env` file in the `server/` directory based on `server/.env.example`.
2. Run Prisma migrations on the backend:
   ```bash
   cd server
   npx prisma migrate dev
   ```
   Seed a ready-to-use test account and sample wardrobe with `npx prisma db seed` (login: `test@driply.dev` / `DripLyTest123!`).
3. Install dependencies from the root directory:
   ```bash
   npm install
   ```
4. Run the development environment (both frontend and backend concurrently):
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.
