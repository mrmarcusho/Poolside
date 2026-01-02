# Poolside REST API Endpoints

Base URL: `https://api.poolside.app/v1`

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/logout` | Logout (invalidate token) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Reset password with token |

### POST /auth/register
```json
// Request
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "emoji": "👨"
}

// Response 201
{
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "John Doe",
    "emoji": "👨",
    "avatar": null,
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### POST /auth/login
```json
// Request
{
  "email": "user@example.com",
  "password": "securepassword"
}

// Response 200
{
  "user": { ... },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

---

## Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update current user profile |
| POST | `/users/me/avatar` | Upload avatar image |
| GET | `/users/:id` | Get user by ID |
| GET | `/users/:id/events` | Get user's hosted events |

### GET /users/me
```json
// Response 200
{
  "id": "usr_123",
  "email": "user@example.com",
  "name": "John Doe",
  "emoji": "👨",
  "avatar": "https://cdn.poolside.app/avatars/usr_123.jpg",
  "bio": "Love meeting new people!",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### PATCH /users/me
```json
// Request
{
  "name": "John Smith",
  "emoji": "🧔",
  "bio": "Updated bio"
}

// Response 200
{
  "id": "usr_123",
  "name": "John Smith",
  ...
}
```

---

## Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List all events (with filters) |
| POST | `/events` | Create new event |
| GET | `/events/:id` | Get event details |
| PATCH | `/events/:id` | Update event (host only) |
| DELETE | `/events/:id` | Delete event (host only) |
| GET | `/events/:id/attendees` | Get event attendees |

### GET /events
Query params:
- `date` - Filter by date (today, tomorrow, this-week)
- `location` - Filter by deck/location
- `hostId` - Filter by host
- `limit` - Results per page (default: 20)
- `cursor` - Pagination cursor

```json
// Response 200
{
  "events": [
    {
      "id": "evt_456",
      "title": "Sunset Drinks at Sky Bar",
      "description": "Join us for cocktails...",
      "fullDescription": "Join us for cocktails and good vibes...",
      "eventImage": "https://cdn.poolside.app/events/evt_456.jpg",
      "locationName": "Sky Bar",
      "locationDeck": "Deck 14, Aft Section",
      "dateTime": "2025-01-15T18:30:00Z",
      "endTime": "2025-01-15T21:00:00Z",
      "host": {
        "id": "usr_123",
        "name": "Sarah Johnson",
        "emoji": "👩",
        "avatar": "https://..."
      },
      "rsvpCount": {
        "going": 12,
        "interested": 5
      },
      "attendeesPreview": [
        { "id": "usr_124", "emoji": "👨" },
        { "id": "usr_125", "emoji": "👩" },
        { "id": "usr_126", "emoji": "🧔" }
      ],
      "myRsvp": null,
      "createdAt": "2025-01-14T10:00:00Z"
    }
  ],
  "nextCursor": "evt_789",
  "hasMore": true
}
```

### POST /events
```json
// Request
{
  "title": "Pool Party at Deck 7",
  "description": "Short description...",
  "fullDescription": "Full description with details...",
  "eventImage": "https://...",
  "locationName": "Main Pool",
  "locationDeck": "Deck 7, Forward",
  "dateTime": "2025-01-16T15:00:00Z",
  "endTime": "2025-01-16T18:00:00Z"
}

// Response 201
{
  "id": "evt_789",
  "title": "Pool Party at Deck 7",
  ...
}
```

### GET /events/:id
```json
// Response 200
{
  "id": "evt_456",
  "title": "Sunset Drinks at Sky Bar",
  "description": "...",
  "fullDescription": "...",
  "eventImage": "https://...",
  "locationName": "Sky Bar",
  "locationDeck": "Deck 14, Aft Section",
  "locationImage": "https://...",
  "dateTime": "2025-01-15T18:30:00Z",
  "endTime": "2025-01-15T21:00:00Z",
  "host": {
    "id": "usr_123",
    "name": "Sarah Johnson",
    "emoji": "👩",
    "avatar": "https://..."
  },
  "rsvpCount": {
    "going": 12,
    "interested": 5
  },
  "myRsvp": "going",
  "attendees": {
    "going": [...],
    "interested": [...]
  },
  "createdAt": "2025-01-14T10:00:00Z",
  "updatedAt": "2025-01-14T12:00:00Z"
}
```

---

## RSVP

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events/:id/rsvp` | RSVP to event |
| DELETE | `/events/:id/rsvp` | Remove RSVP |
| GET | `/me/rsvps` | Get current user's RSVPs |

### POST /events/:id/rsvp
```json
// Request
{
  "status": "going"  // or "interested"
}

// Response 200
{
  "eventId": "evt_456",
  "status": "going",
  "rsvpCount": {
    "going": 13,
    "interested": 5
  }
}
```

### DELETE /events/:id/rsvp
```json
// Response 200
{
  "eventId": "evt_456",
  "status": null,
  "rsvpCount": {
    "going": 12,
    "interested": 5
  }
}
```

### GET /me/rsvps
Query params:
- `status` - Filter by status (going, interested)

```json
// Response 200
{
  "rsvps": [
    {
      "event": {
        "id": "evt_456",
        "title": "Sunset Drinks at Sky Bar",
        "eventImage": "https://...",
        "locationName": "Sky Bar",
        "dateTime": "2025-01-15T18:30:00Z",
        "host": { ... }
      },
      "status": "going",
      "rsvpAt": "2025-01-14T15:00:00Z"
    }
  ]
}
```

---

## Friends

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me/friends` | List friends |
| POST | `/me/friends/request` | Send friend request |
| GET | `/me/friends/requests` | List pending requests |
| POST | `/me/friends/requests/:id/accept` | Accept request |
| POST | `/me/friends/requests/:id/reject` | Reject request |
| DELETE | `/me/friends/:id` | Remove friend |

### GET /me/friends
```json
// Response 200
{
  "friends": [
    {
      "id": "usr_124",
      "name": "Emma Wilson",
      "emoji": "👩‍🦰",
      "avatar": "https://...",
      "isOnline": true,
      "friendsSince": "2025-01-10T10:00:00Z"
    }
  ]
}
```

### POST /me/friends/request
```json
// Request
{
  "userId": "usr_125"
}

// Response 201
{
  "requestId": "frq_001",
  "toUser": {
    "id": "usr_125",
    "name": "Mike Chen"
  },
  "status": "pending",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

---

## Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me/conversations` | List conversations |
| GET | `/me/conversations/:id` | Get messages in conversation |
| POST | `/me/conversations/:id/messages` | Send message |
| POST | `/me/conversations` | Start new conversation |
| PATCH | `/me/conversations/:id/read` | Mark as read |

### GET /me/conversations
```json
// Response 200
{
  "conversations": [
    {
      "id": "conv_001",
      "participant": {
        "id": "usr_124",
        "name": "Emma Wilson",
        "emoji": "👩‍🦰",
        "avatar": "https://...",
        "isOnline": true
      },
      "lastMessage": {
        "text": "See you at the pool!",
        "sentAt": "2025-01-15T14:30:00Z",
        "isFromMe": false
      },
      "unreadCount": 2
    }
  ]
}
```

### GET /me/conversations/:id
Query params:
- `limit` - Messages per page (default: 50)
- `before` - Cursor for older messages

```json
// Response 200
{
  "messages": [
    {
      "id": "msg_001",
      "text": "Hey! Are you going to the pool party?",
      "senderId": "usr_124",
      "sentAt": "2025-01-15T14:00:00Z",
      "readAt": "2025-01-15T14:05:00Z"
    },
    {
      "id": "msg_002",
      "text": "Yes! See you there!",
      "senderId": "usr_123",
      "sentAt": "2025-01-15T14:10:00Z",
      "readAt": null
    }
  ],
  "hasMore": false
}
```

### POST /me/conversations/:id/messages
```json
// Request
{
  "text": "Can't wait!"
}

// Response 201
{
  "id": "msg_003",
  "text": "Can't wait!",
  "senderId": "usr_123",
  "sentAt": "2025-01-15T14:35:00Z",
  "readAt": null
}
```

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me/notifications` | List notifications |
| PATCH | `/me/notifications/:id/read` | Mark as read |
| PATCH | `/me/notifications/read-all` | Mark all as read |
| POST | `/me/push-token` | Register push token |

### GET /me/notifications
```json
// Response 200
{
  "notifications": [
    {
      "id": "ntf_001",
      "type": "event_rsvp",
      "title": "New RSVP",
      "body": "Emma joined your Pool Party event",
      "data": {
        "eventId": "evt_456",
        "userId": "usr_124"
      },
      "isRead": false,
      "createdAt": "2025-01-15T15:00:00Z"
    },
    {
      "id": "ntf_002",
      "type": "friend_request",
      "title": "Friend Request",
      "body": "Mike Chen wants to be friends",
      "data": {
        "requestId": "frq_002",
        "userId": "usr_125"
      },
      "isRead": true,
      "createdAt": "2025-01-15T14:00:00Z"
    }
  ],
  "unreadCount": 1
}
```

### POST /me/push-token
```json
// Request
{
  "token": "ExponentPushToken[xxxxxx]",
  "platform": "ios"
}

// Response 200
{
  "success": true
}
```

---

## Image Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/image` | Upload image, get URL |

### POST /upload/image
```
Content-Type: multipart/form-data

file: <image file>
type: "avatar" | "event"
```

```json
// Response 201
{
  "url": "https://cdn.poolside.app/uploads/img_abc123.jpg",
  "thumbnailUrl": "https://cdn.poolside.app/uploads/img_abc123_thumb.jpg"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is required",
    "field": "email"
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Not allowed to access resource |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_INPUT` | 400 | Validation error |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Authentication Header

All authenticated endpoints require:
```
Authorization: Bearer <accessToken>
```
