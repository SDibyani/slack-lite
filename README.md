# Slack-lite — Real-Time Team Chat

A lightweight Slack clone built with Angular 21 (standalone components) on the frontend and an Express + Socket.IO + MongoDB server backend.

## Features

| Category | Feature |
|---|---|
| **Authentication** | Register / login with JWT, password hashing with bcryptjs, Bearer-token HTTP interceptor, route-based auth guard |
| **Real-time chat** | Socket.IO connection with JWT authentication, JWT rooms per user, conversation rooms |
| **One-to-one chat** | Direct conversations between any two users, message history |
| **Group chat** | Create groups with multiple members, group membership management |
| **Message persistence** | Messages stored in MongoDB with Mongoose, sorted by `createdAt` |
| **Unread messages** | Per-conversation unread counts, live unread updates via Socket.IO `unread_update` event |
| **Online/offline presence** | Real-time online/offline status with multi-tab support, `lastSeen` timestamps |
| **Typing indicators** | Real-time "user is typing" / "stop typing" events |
| **Message read receipts** | `readBy` array, `mark_read` Socket.IO event, `message_read` broadcast |
| **Responsive UI** | Mobile-first responsive layout tested at 320px, 375px, 390px, 430px, 768px, and desktop |

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 21 (standalone components, signals, HttpClient) |
| **State mgmt** | Component-level services + localStorage |
| **Real-time** | Socket.IO client (`socket.io-client`), JWT-authenticated |
| **Backend** | Node.js + Express 5 |
| **WebSocket** | Socket.IO 4 (`socket.io`) |
| **Database** | MongoDB (Mongoose 9 ODM) |
| **Auth** | JSON Web Tokens (`jsonwebtoken`), bcryptjs |
| **Deployment** | Docker + Docker Compose, Nginx (client), CI/CD via GitHub Actions |

## Project Structure

```
slack-lite/
├── client/                     # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Services, models, guards, interceptors
│   │   │   │   ├── models/
│   │   │   │   ├── services/
│   │   │   │   ├── guards/
│   │   │   │   └── interceptors/
│   │   │   └── features/
│   │   │       ├── auth/       # Login component
│   │   │       └── chat/       # Chat page (sidebar + main)
│   │   ├── environments/
│   │   └── styles.css          # Global styles
│   ├── Dockerfile              # Nginx static server
│   ├── nginx.conf              # Nginx config for SPA routing
│   └── angular.json
├── server/                     # Express + Socket.IO backend
│   ├── src/
│   │   ├── config/             # Database connection
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth middleware
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API route definitions
│   │   ├── socket/             # Socket.IO event handlers
│   │   ├── utils/              # JWT, password helpers
│   │   └── server.js           # Entry point
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── docker-compose.yml          # Full-stack Docker Compose
├── .env.example                # Symlinked to server/.env.example
└── .github/workflows/ci.yml    # GitHub Actions CI/CD
```

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **MongoDB** >= 7 (local OR [MongoDB Atlas](https://cloud.mongodb.com))
- **Docker** + **Docker Compose** (optional, for containerized deployment)
- **Git**

## Local Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd slack-lite
```

### 2. Create environment files

**Server:** `server/.env`

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set:
- `PORT` — server port (default `4000`)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — long random string for signing tokens
- `CLIENT_URL` — frontend origin (default `http://localhost:4200`)

**Client:** `client/src/environments/environment.ts` is already configured for local development (`http://localhost:4000`).

For production, create `client/src/environments/environment.prod.ts` and update `angular.json` `fileReplacements` if needed.

### 3. Install dependencies

```bash
# Server
cd server
npm install

# Client (in a separate terminal)
cd client
npm install
```

### 4. Start MongoDB

#### Option A: MongoDB Atlas (recommended for production)
Create a free cluster at https://cloud.mongodb.com, create a database user, and allow your IP. Get the connection string and paste it into `MONGODB_URI`.

#### Option B: Local MongoDB
```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Ubuntu
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

### 5. Run the application

```bash
# Terminal 1 — Backend (dev mode with nodemon)
cd server
npm run dev

# Terminal 2 — Frontend (dev mode)
cd client
npm start
```

- Frontend: http://localhost:4200
- Backend API: http://localhost:4000/api
- Socket.IO: ws://localhost:4000

### 6. Quick start with Docker Compose

```bash
docker-compose up --build
```

This starts the MongoDB database, Express API server, and Angular app.

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Express server port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/slack-lite?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret for signing JWT tokens | *(long random string)* |
| `CLIENT_URL` | Frontend origin for CORS + Socket.IO | `http://localhost:4200` |

### Client (`client/src/environments/environment.ts`)

| Variable | Description | Example |
|---|---|---|
| `production` | Enable production mode | `false` (dev) / `true` (prod) |
| `apiUrl` | Backend REST API URL | `http://localhost:4000/api` |
| `socketUrl` | Backend Socket.IO URL | `http://localhost:4000` |

## Database Schema

The application uses MongoDB with three Mongoose models. No migrations are required — schema is defined in code.

### User (`server/src/models/User.js`)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `name` | String | required, 2–50 chars | Display name |
| `email` | String | required, unique, lowercase | Login identifier |
| `password` | String | required, min 6 chars, `select: false` | bcrypt-hashed |
| `avatar` | String | default `""` | Avatar URL |
| `status` | String | enum: `"online"` \| `"offline"`, default `"offline"` | Presence status |
| `lastSeen` | Date | default `Date.now` | Last seen timestamp |
| `*timestamps` | — | — | `createdAt`, `updatedAt` auto-managed |

Indexes:
- `email` — unique index (auto from `unique: true`)

### Conversation (`server/src/models/Conversation.js`)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `type` | String | enum: `"direct"` \| `"group"`, required | Conversation type |
| `name` | String | default `""` | Group name (empty for direct) |
| `avatar` | String | default `""` | Group avatar URL |
| `participants` | ObjectId[] | ref: User, required | User IDs in conversation |
| `admins` | ObjectId[] | ref: User | Group admins |
| `createdBy` | ObjectId | ref: User, required | Creator ID |
| `lastMessage` | ObjectId | ref: Message, default `null` | Reference to last message |
| `lastMessageAt` | Date | default `null` | Last message timestamp |
| `*timestamps` | — | — | `createdAt`, `updatedAt` auto-managed |

Indexes:
- `{ participants: 1 }` — for fast conversation lookups by participant

### Message (`server/src/models/Message.js`)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `conversation` | ObjectId | ref: Conversation, required, indexed | Parent conversation |
| `sender` | ObjectId | ref: User, required | Sender ID |
| `content` | String | default `""`, maxlength 5000 | Message text |
| `type` | String | enum: `"text"` \| `"image"` \| `"file"`, default `"text"` | Message type |
| `attachment` | Object | — | `{ url, name, size }` |
| `readBy` | ObjectId[] | ref: User | User IDs who read the message |
| `*timestamps` | — | — | `createdAt`, `updatedAt` auto-managed |

Indexes:
- Compound: `{ conversation: 1, createdAt: -1 }` — for fast message retrieval sorted by time

## API Documentation

Base URL: `http://<host>:4000/api`

All routes under `/api/conversations`, `/api/messages`, `/api/users/me`, `/api/users/search`, `/api/users/:id` require a `Bearer` JWT token in the `Authorization` header.

### Auth

#### `POST /api/auth/register`

Register a new user.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6712...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "",
    "status": "offline",
    "lastSeen": "2024-...",
    "createdAt": "2024-..."
  }
}
```

**Error responses:**
- `400` — Missing fields or password too short
- `409` — Email already registered

---

#### `POST /api/auth/login`

Authenticate and receive a JWT token.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response — 200 OK:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "...", "email": "...", "avatar": "...", "status": "...", "lastSeen": "...", "createdAt": "..." }
}
```

---

#### `GET /api/auth/me`

Get the currently authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response — 200 OK:**
```json
{
  "success": true,
  "user": { "id": "...", "name": "...", "email": "...", "avatar": "...", "status": "...", "lastSeen": "...", "createdAt": "..." }
}
```

### Users

#### `GET /api/users`

Get all users (excluding the current user).

**Response — 200 OK:**
```json
{
  "success": true,
  "users": [
    { "id": "...", "name": "...", "email": "...", "avatar": "...", "status": "online", "lastSeen": "...", "createdAt": "..." }
  ]
}
```

#### `GET /api/users/me`

Get the current user's profile.

**Response — 200 OK:**
```json
{
  "success": true,
  "user": { "id": "...", "name": "...", "email": "...", "avatar": "...", "status": "...", "lastSeen": "...", "createdAt": "..." }
}
```

#### `GET /api/users/search?q=<query>`

Search users by name or email.

**Response — 200 OK:**
```json
{
  "success": true,
  "users": [...]
}
```

#### `GET /api/users/:id`

Get a user by ID.

**Response — 200 OK:**
```json
{
  "success": true,
  "user": { "id": "...", "name": "...", "email": "...", "avatar": "...", "status": "...", "lastSeen": "...", "createdAt": "..." }
}
```

### Conversations

#### `POST /api/conversations/direct`

Create or retrieve a direct (1:1) conversation.

**Request body:**
```json
{
  "userId": "6712..."
}
```

**Response — 200 OK (existing) / 201 Created (new):**
```json
{
  "success": true,
  "message": "Conversation already exists" | "Direct conversation created",
  "conversation": { ... }
}
```

#### `POST /api/conversations/group`

Create a new group conversation.

**Request body:**
```json
{
  "name": "Engineering Team",
  "participantIds": ["6712...", "6713..."]
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "message": "Group conversation created",
  "conversation": {
    "_id": "...",
    "type": "group",
    "name": "Engineering Team",
    "participants": [...],
    "admins": [...],
    "lastMessage": null,
    "lastMessageAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### `GET /api/conversations`

Get all conversations for the current user, with populated participants, last message, and unread count.

**Response — 200 OK:**
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "...",
      "type": "direct" | "group",
      "name": "...",
      "participants": [...],
      "admins": [...],
      "lastMessage": {
        "_id": "...",
        "content": "...",
        "type": "text",
        "sender": "...",
        "createdAt": "..."
      },
      "lastMessageAt": "...",
      "unreadCount": 0,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `GET /api/conversations/:id`

Get a single conversation by ID.

**Response — 200 OK:**
```json
{
  "success": true,
  "conversation": { ... }
}
```

#### `POST /api/conversations/:id/members`

Add a member to a group (admin only).

**Request body:**
```json
{
  "userId": "6712..."
}
```

**Response — 200 OK:**
```json
{
  "success": true,
  "message": "Member added successfully",
  "conversation": { ... }
}
```

### Messages

#### `POST /api/messages`

Send a message in a conversation.

**Request body:**
```json
{
  "conversationId": "...",
  "content": "Hello world!",
  "type": "text"
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "message": {
    "_id": "...",
    "conversation": "...",
    "sender": { "id": "...", "name": "...", "email": "...", "avatar": "...", "status": "...", "lastSeen": "...", "createdAt": "..." },
    "content": "Hello world!",
    "type": "text",
    "attachment": { "url": "", "name": "", "size": 0 },
    "readBy": ["..."],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### `GET /api/messages/:conversationId`

Get all messages in a conversation (sorted by `createdAt` ascending).

**Response — 200 OK:**
```json
{
  "success": true,
  "messages": [
    { "_id": "...", "conversation": "...", "sender": {...}, "content": "...", "type": "text", "attachment": {...}, "readBy": [...], "createdAt": "...", "updatedAt": "..." }
  ]
}
```

#### `PUT /api/messages/:id/read`

Mark a message as read by the current user.

**Response — 200 OK:**
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

### Health Check

#### `GET /api/health`

**Response — 200 OK:**
```json
{
  "success": true,
  "message": "Slack-lite API is running"
}
```

## WebSocket Events

The Socket.IO server runs at the same origin as the REST API (`ws://<host>:4000`). Clients authenticate by passing the JWT token in the connection `auth` object.

### Authentication

**Connect:**
```js
const socket = io('http://localhost:4000', {
  auth: { token: 'JWT_TOKEN_HERE' }
});
```

The server's `io.use()` middleware verifies the JWT and fetches the user. If the token is invalid or missing, the connection is rejected with `"Authentication required"` / `"Invalid or expired token"`.

### Connection Flow

1. Client connects with JWT token
2. Server authenticates → joins `user:{userId}` room
3. Server marks user online in DB and emits `user_online` to all clients
4. All connected clients receive real-time status updates

### Client → Server Events

#### `join_conversation`

Join a conversation room to receive real-time messages.

| Field | Type | Description |
|---|---|---|
| `conversationId` | string | ID of the conversation |

```js
socket.emit('join_conversation', conversationId);
```

#### `leave_conversation`

Leave a conversation room.

```js
socket.emit('leave_conversation', conversationId);
```

#### `send_message`

Send a new message to a conversation.

| Field | Type | Required | Description |
|---|---|---|---|
| `conversationId` | string | yes | Conversation ID |
| `content` | string | yes (for text) | Message content |
| `type` | string | no | `"text"` (default), `"image"`, `"file"` |
| `attachment` | object | no | `{ url, name, size }` |

```js
socket.emit('send_message', {
  conversationId: '...",
  content: "Hello!",
  type: "text"
});
```

#### `typing`

Notify conversation members that the user is typing.

```js
socket.emit('typing', conversationId);
```

#### `stop_typing`

Notify conversation members that the user stopped typing.

```js
socket.emit('stop_typing', conversationId);
```

#### `mark_read`

Mark a message as read.

| Field | Type | Required | Description |
|---|---|---|---|
| `messageId` | string | yes | Message ID |
| `conversationId` | string | yes | Conversation ID |

```js
socket.emit('mark_read', { messageId: '...', conversationId: '...' });
```

### Server → Client Events

#### `user_online`

Broadcast to all connected clients when a user comes online.

```json
{
  "userId": "6712...",
  "status": "online"
}
```

#### `user_offline`

Broadcast to all connected clients when a user goes offline. Includes `lastSeen`.

```json
{
  "userId": "6712...",
  "status": "offline",
  "lastSeen": "2024-01-15T10:30:00.000Z"
}
```

**Multi-tab handling:** The server checks if the user has other active socket connections before marking them offline.

#### `new_message`

Broadcast to all users in a conversation when a new message is sent.

```json
{
  "_id": "6712...",
  "conversation": "6713...",
  "sender": {
    "_id": "6712...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "",
    "status": "online"
  },
  "content": "Hello!",
  "type": "text",
  "attachment": { "url": "", "name": "", "size": 0 },
  "readBy": ["6712..."],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### `unread_update`

Sent individually to each recipient in a conversation when they receive a new message they haven't read.

```json
{
  "conversationId": "6713...",
  "content": "Hello!",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "senderId": "6712...",
  "senderName": "John Doe"
}
```

#### `user_typing`

Sent to conversation members (excluding the sender) when a user starts typing.

```json
{
  "userId": "6712...",
  "name": "John Doe"
}
```

#### `user_stop_typing`

Sent to conversation members (excluding the sender) when a user stops typing.

```json
{
  "userId": "6712..."
}
```

#### `message_read`

Broadcast to a conversation when a message is marked as read.

```json
{
  "messageId": "6712...",
  "readBy": ["6713...", "6714..."],
  "conversationId": "6715..."
}
```

#### `socket_error`

Emitted on socket-level errors (auth failures, invalid data, etc.).

```json
{
  "message": "Conversation not found"
}
```

### Room Naming Convention

| Room | Scope | Purpose |
|---|---|---|
| `user:{userId}` | Single-user | Send direct messages to a specific user (e.g., `unread_update`, online status) |
| `conversation:{conversationId}` | Group | Receive real-time messages in a conversation (`new_message`, `message_read`) |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Angular 21)                   │
│                                                            │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │   Login     │   │  Chat Page   │   │   Services   │   │
│  │             │   │              │   │              │   │
│  │  - Auth     │   │  - Sidebar   │   │  - Auth      │   │
│  │  - HTTP     │   │  - Main Chat │   │  - Socket    │   │
│  │             │   │  - Messages  │   │  - User      │   │
│  └─────────────┘   └──────────────┘   └──────────────┘   │
│                          │                   │            │
│                          │ JWT (Bearer)      │ Socket.IO  │
│                          ▼                   ▼            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                 Backend (Express 5)                   │ │
│  │                                                          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐   │
│  │  │  Auth    │  │  Users   │  │Conversat.│  │ Msg  │   │
│  │  │ Routes   │  │ Routes   │  │ Routes   │  │Routes│   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────┘   │
│  │         │          │           │           │           │
│  │         ▼          ▼           ▼           ▼           │
│  │    ┌────────────────────────────────────────────┐      │
│  │    │         Socket.IO Server                     │      │
│  │    │  - JWT auth middleware                      │      │
│  │    │  - user:{} rooms (presence)                │      │
│  │    │  - conversation:{} rooms (messages)       │      │
│  │    │  - Event handlers: join, send, typing,    │      │
│  │    │    mark_read, disconnect                   │      │
│  │    └────────────────────────────────────────────┘      │
│  │                          │                            │
│  │                          ▼                            │
│  │  ┌────────────────────────────────────────┐           │
│  │  │  MongoDB (via Mongoose ODM)            │           │
│  │  │  - User: name, email, password, status │           │
│  │  │  - Conversation: type, participants    │           │
│  │  │  - Message: conversation, sender,      │           │
│  │  │    content, readBy                     │           │
│  │  └────────────────────────────────────────┘           │
│  └──────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Login**: Client POSTs credentials → Server validates → Returns JWT → Client stores in `localStorage`
2. **Auth HTTP requests**: Angular `HttpInterceptor` attaches `Authorization: Bearer <token>` to every request
3. **Socket connection**: Client connects with JWT → Server authenticates → Joins `user:{id}` room
4. **Send message (HTTP)**: Client POSTs → Server creates message → Updates conversation → Returns saved message
5. **Send message (Socket.IO)**: Client emits `send_message` → Server validates → Creates message → Emits `new_message` to conversation room → Other clients receive in real time

### Design Decisions

- **Socket.IO rooms per user** (`user:{id}`): Enables direct messaging to specific users for unread updates and presence, even if they're in multiple tabs
- **Socket.IO rooms per conversation** (`conversation:{id}`): Efficient message broadcasting only to relevant participants
- **Multi-tab presence**: Disconnect handler checks `io.sockets.adapter.rooms` for remaining connections before marking a user offline
- **Dual message delivery**: Messages can be sent via REST API OR via Socket.IO `send_message` event — both paths validate conversation membership and emit `new_message`
- **Inline styles in HTML**: Conversation items and message bubbles use inline styles in the template for simplicity. These are overridden in the mobile media query with `!important` where needed.

## Running Tests

```bash
cd client
npm run test
```

Note: The project includes Vitest in dev dependencies but does not yet have test files. Tests will be added as the application grows.

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up --build -d
```

Services:
| Service | Port | Description |
|---|---|---|
| `server` | 4000 | Express + Socket.IO API |
| `client` | 80 | Angular static site (Nginx) |
| `mongodb` | 27017 | MongoDB database |

### Individual Docker builds

**Server:**
```bash
cd server
docker build -t slack-lite-server .
docker run -p 4000:4000 --env-file .env slack-lite-server
```

**Client:**
```bash
cd client
docker build -t slack-lite-client .
docker run -p 80:80 slack-lite-client
```

## Cloud Deployment Architecture

### Recommended: Render / Railway / Fly.io

```
┌─────────────────────┐     ┌─────────────────────┐
│     CDN / Edge      │     │  SSL Termination    │
│   (Cloudflare)      │────▶│  (Let's Encrypt)   │
└─────────────────────┘     └──────────┬──────────┘
                                      │ HTTPS
                    ┌─────────────────┴──────────────────┐
                    │        Reverse Proxy                │
                    │        (Nginx / Caddy)              │
                    └─────────┬────────────────────┬─────┘
                              │                    │
              ┌────────────────▼──┐     ┌──────────▼──────┐
              │   Client (Angular)│     │  Server (Node)  │
              │   (Build output)  │     │  (Express API)  │
              │   served by Nginx │     │  + Socket.IO    │
              └───────────────────┘     │                 │
                                        └────────┬────────┘
                                                 │
                                       ┌─────────▼─────────┐
                                       │  MongoDB Atlas    │
                                       │  (Managed DB)     │
                                       └───────────────────┘
```

### Deployment steps

1. **Database**: Create a MongoDB Atlas cluster at https://cloud.mongodb.com, configure IP whitelist, create a database user, and copy the connection string.
2. **Server**: Deploy to Render/Railway with:
   - Build: `npm install` in `server/`
   - Start: `node src/server.js`
   - Env vars: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`
3. **Client**: Deploy to Vercel/Netlify/Render:
   - Build: `npm run build -- --configuration production` in `client/`
   - Output: `client/dist/client/`
   - Redirect all routes to `index.html` (SPA fallback)

### HTTPS/WSS in production

- The Angular app fetches `environment.socketUrl` for Socket.IO connections. In production, use `https://` URL so Socket.IO automatically uses `wss://` (secure WebSocket).
- Nginx handles SSL termination and proxies WebSocket upgrade requests to the Express server.

### CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main`:
1. Server syntax checks
2. Client TypeScript typecheck
3. Angular production build
4. Docker image builds (verified, not pushed)

## Assumptions & Trade-offs

### Assumptions
1. **JWT-only auth**: No refresh tokens or session invalidation. JWTs are valid for 7 days.
2. **In-memory Socket.IO**: No Redis adapter for horizontal scaling. A single server instance handles all WebSocket connections.
3. **No rate limiting**: The API does not implement rate limiting.
4. **Avatar uploads**: Not implemented; avatars use initial-based placeholders.
5. **File/image attachments**: The data model supports `type: "image" | "file"` with `attachment` fields, but the UI only supports text messaging.

### Trade-offs
| Decision | Rationale |
|---|---|
| **Socket.IO over pure WebSockets** | Simplified auth, auto-reconnect, fallback to polling, rooms/namespaces |
| **Mongoose over raw driver** | Schema validation, virtuals, populate, and middleware reduce boilerplate |
| **localStorage for JWT** | Simplest approach for a demo app; production would use HttpOnly cookies |
| **Separate REST + Socket.IO** | REST for CRUD (persisted data), Socket.IO for real-time events — clean separation of concerns |
| **Inline styles in Angular templates** | Rapid prototyping; should be refactored to CSS classes for maintainability |
| **No test suite yet** | Vitest installed as dev dependency; tests can be added incrementally |

### Known Limitations
1. **Horizontal scaling**: Single-instance Socket.IO. For multiple server instances, add `socket.io-redis-adapter` and sticky sessions.
2. **No message deletion/editing**: Messages are append-only.
3. **No push notifications**: Offline users don't receive push notifications.
4. **No message search**: No full-text search across messages.
5. **Presence based on Socket.IO connections**: If a user closes the browser without a proper disconnect event, presence may briefly remain "online" until the Socket.IO server detects the disconnection.
6. **Mobile responsiveness**: The sidebar uses a fixed compact width on very small screens. A full mobile-first redesign with a hamburger-toggle sidebar would improve UX.
7. **No CI/CD deployment**: The workflow verifies builds and Docker images but does not auto-deploy. Add deployment steps for your chosen platform.
