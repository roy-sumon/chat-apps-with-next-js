# Real-Time Chat Application

A modern real-time chat application built with Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Prisma, and Socket.io.

## Features

- User authentication with NextAuth.js (credentials and Google login)
- Real-time messaging with Socket.io
- Create and manage conversations
- Typing indicators
- Online/offline status
- Responsive UI for mobile and desktop (coming soon)
- Dark/light mode toggle (coming soon)

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set up environment variables in `.env.local`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/my-chat-app"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Project Structure

- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - React components
- `/src/lib` - Utility functions and libraries
- `/src/server` - Server-side code including Socket.io implementation
- `/prisma` - Prisma schema and migrations

## Deployment

This application can be deployed to Vercel or any other hosting platform that supports Next.js applications with custom server setup.

## License

MIT
