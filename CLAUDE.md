# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Poolside is a college campus social events app where students can discover, create, and RSVP to events happening on their campus. Students verify using their school email (.edu) to access their college's Poolside community.

### Core Philosophy
- **Community-focused, not dating-focused**: This is NOT a dating app. The goal is to help students find fun events and build community.
- **No 1:1 messaging**: To prevent the app from becoming a dating platform, there is NO direct messaging between users.
- **Event Chat only**: The only messaging feature is Event Chat - group conversations tied to specific events where attendees (including the host) can coordinate and communicate.
- **Campus-isolated**: Each college has its own isolated Poolside community. Students only see events from their verified campus.

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
- **Services**: `src/api/services/` - API calls organized by domain (events, users, auth, rsvp, friends, event-chat, notifications)
- **State**: React Context (`AuthContext`, `RsvpContext`) for global state

### Backend
- **Module Pattern**: Each feature in `src/modules/` (auth, users, events, rsvp, friends, event-chat, notifications)
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

## Playwright MCP Server (Browser Automation)

A Playwright MCP server is configured for browser automation tasks.

### When to Use Playwright

Use Playwright when the user asks to:
- **View/test HTML mockups**: Open and screenshot files in `poolside-app/mockups/` or any `.html` files
- **Test web interfaces**: Navigate to URLs and verify UI elements
- **Take screenshots**: Capture visual references of web pages
- **Fill forms and click buttons**: Test interactive web flows
- **Extract content**: Scrape text, links, or data from web pages
- **Visual verification**: Compare UI against design references

### How to Use

The Playwright tools are available via MCP. Common tasks:
- `playwright_navigate` - Go to a URL
- `playwright_screenshot` - Take a screenshot
- `playwright_click` - Click an element
- `playwright_fill` - Fill in a form field
- `playwright_evaluate` - Run JavaScript on the page

### Example Use Cases for This Project

1. **Preview HTML mockups**: "Open the profile mockup and take a screenshot"
2. **Test the backend API docs**: "Navigate to http://localhost:3000/docs and screenshot the Swagger UI"
3. **Verify deployed pages**: "Check if the landing page loads correctly"
4. **Copy UI/animations from the web**: When the user shares a URL with a UI element or animation they like:
   - Navigate to the page and screenshot it
   - Inspect the element's CSS styles (colors, fonts, spacing, shadows)
   - Extract animation CSS/JS code
   - Recreate the design in React Native for this project
   - Example: "I like this button style at [URL] - implement it for my app"
