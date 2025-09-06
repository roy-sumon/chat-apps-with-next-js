# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

This is a real-time chat application built with Next.js 15, React 19, TypeScript, Prisma (MongoDB), Socket.io, and NextAuth.js. The application features user authentication, real-time messaging, conversation management, and online status tracking.

## Development Commands

### Core Development
```bash
# Start Next.js development server
npm run dev

# Start Socket.io server (required for real-time features)
npm run server

# Build the application
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Operations
```bash
# Apply database migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Push schema changes without migration (development)
npx prisma db push
```

### Testing Commands
```bash
# Run TypeScript type checking
npx tsc --noEmit

# Check TypeScript for server files
npx tsc --project tsconfig.server.json --noEmit
```

## Architecture Overview

### Dual Server Architecture
The application runs on a **dual-server architecture**:
- **Next.js Server** (port 3000): Handles web requests, API routes, and SSR
- **Socket.io Server** (port 3002): Manages real-time WebSocket connections

Both servers must be running simultaneously for full functionality. The Socket.io server (`server.ts`) is a custom Node.js server that integrates Next.js with Socket.io for real-time features.

### Database Design
Uses **MongoDB** with Prisma ORM featuring a relationship-based chat system:
- **User**: Authentication, online status, and profile data
- **Conversation**: One-to-one conversations between users
- **Message**: Chat messages linked to conversations and users
- **Account/Session**: NextAuth.js authentication tables

Key relationships:
- Users can have multiple conversations (many-to-many through separate userOne/userTwo fields)
- Each conversation contains multiple messages
- Messages track sender, receiver, read status, and timestamps

### Authentication Flow
Implements **NextAuth.js v5** with dual providers:
- **Credentials**: Email/password with bcrypt hashing
- **Google OAuth**: Social login integration

Authentication uses JWT strategy with custom callbacks for user status tracking. Middleware protects routes and handles redirects.

### Real-time Communication
**Socket.io** implementation with event-driven architecture:
- User-specific rooms for private messaging
- Conversation rooms for group messaging
- Real-time message delivery and typing indicators
- Online/offline status updates
- Automatic database persistence of messages

### UI Architecture
Built with **shadcn/ui** components using:
- **Tailwind CSS** with CSS variables for theming
- **Radix UI** primitives for accessibility
- **Lucide React** icons
- **Framer Motion** for animations
- **next-themes** for dark/light mode

## Key File Patterns

### Authentication Files
- `src/auth.ts` - NextAuth configuration with custom callbacks
- `src/auth.config.ts` - Provider configurations and authorization logic
- `src/middleware.ts` - Route protection and authentication middleware
- `src/routes.ts` - Route definitions and access control

### Real-time Communication
- `server.ts` - Main Socket.io server with Next.js integration
- `src/lib/socket.ts` - Client-side Socket.io utilities and connection management
- `src/server/socket.ts` - Alternative Socket.io setup (currently unused)

### Database Layer
- `prisma/schema.prisma` - Database schema with MongoDB ObjectId relationships
- `src/lib/prisma.ts` - Prisma client configuration
- `src/lib/user.ts` - User-related database operations

### Component Structure
- `src/components/ui/` - shadcn/ui base components
- `src/components/` - Custom application components
- `src/app/` - Next.js App Router pages and layouts

## Development Notes

### Environment Setup
Required environment variables:
```
DATABASE_URL="mongodb://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Database Considerations
- Uses MongoDB with Prisma's ObjectId mapping
- No traditional foreign key constraints - relies on Prisma's relationship modeling
- Manual cascade deletions handled in Prisma schema
- Real-time features require both database updates and Socket.io events

### Socket.io Configuration
- Client connects on application load with user ID
- Automatic room management for conversations
- Message persistence happens before Socket.io emission
- Error handling for connection issues and message failures

### TypeScript Configuration
- Dual TypeScript configs: `tsconfig.json` for Next.js, `tsconfig.server.json` for Socket.io server
- Path aliases configured for `@/*` imports
- Strict mode enabled with comprehensive type checking

### Common Patterns
- Server actions for form handling (`src/actions/`)
- Zod schemas for validation (`src/schemas/`)
- Custom hooks pattern (when needed in `@/hooks` alias)
- Consistent error handling with `console.error` and user feedback
- Theme-aware components using CSS variables

## Known Issues & Considerations

- The application has two Socket.io server implementations - `server.ts` is actively used, `src/server/socket.ts` appears to be an alternative approach
- MongoDB ObjectId relationships require careful handling in Prisma queries
- Real-time features depend on both servers being operational
- Authentication state synchronization between Next.js and Socket.io requires user ID in connection handshake
