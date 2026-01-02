# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Poolside is a cruise-specific social media app where passengers can create events, RSVP, make friends, and message each other. The app features a temporary, cruise-isolated social network with age-based event filtering.

## Repository Structure

This is a monorepo with two main directories:
- `poolside-app/` - React Native frontend (Expo)
- `poolside-backend/` - NestJS backend with SQLite/Prisma

## Commands

### Frontend (`poolside-app/`)
```bash
npm start              # Start Expo dev server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
```

### Backend (`poolside-backend/`)
```bash
npm run start:dev     # Development with hot reload
npm run build         # Compile TypeScript
npm start             # Production mode
npx prisma migrate dev    # Run database migrations
npx prisma studio         # Visual database browser
npx prisma db push        # Push schema changes without migration
```

## Architecture

### Frontend
- **Entry**: `App.tsx` - Sets up providers (Auth, RSVP), fonts, splash screen
- **Navigation**: `src/navigation/` - TabNavigator (main tabs) + AuthNavigator (login/register)
- **API Layer**: `src/api/client.ts` - Axios with JWT token refresh interceptors
- **Services**: `src/api/services/` - API calls organized by domain (events, users, auth, rsvp, friends, messages, notifications)
- **State**: React Context (`AuthContext`, `RsvpContext`) for global state

### Backend
- **Module Pattern**: Each feature in `src/modules/` (auth, users, events, rsvp, friends, messages, notifications)
- **Database**: Prisma ORM with SQLite, schema at `prisma/schema.prisma`
- **Auth**: JWT with access/refresh tokens via Passport.js
- **WebSockets**: Socket.io for real-time features
- **API Docs**: Swagger at `/docs`

### API Configuration
- Base URL: `http://192.168.1.251:3000/v1` (dev) or `https://api.poolside.app/v1` (prod)
- Global prefix: `/v1`
- Tokens stored in Expo SecureStore with automatic refresh on 401

## Key Patterns

- **Token Refresh**: `src/api/client.ts` queues requests during token refresh to prevent race conditions
- **Interests Field**: Stored as JSON string in SQLite, parsed/serialized in `users.service.ts`
- **Event Mapping**: `src/utils/eventMapper.ts` transforms API responses to frontend types
- **Frosted Glass UI**: Uses `expo-blur` BlurView for modal backgrounds
- **Haptics**: `expo-haptics` for touch feedback on interactions
