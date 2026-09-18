# 🌸 GlowNest Backend

Full-stack skincare app backend built with **Node.js + Express + MongoDB + Socket.io**

---

## 📁 Folder Structure

```
glownest-backend/
├── server.js               ← Entry point
├── package.json
├── .env.example            ← Copy to .env and fill values
│
├── config/
│   └── db.js               ← MongoDB connection
│
├── models/
│   ├── User.js             ← User schema (bcrypt password)
│   ├── Message.js          ← Chat message schema
│   └── AIChatHistory.js    ← AI consultation history
│
├── controllers/
│   ├── authController.js   ← Register, Login, Profile
│   ├── userController.js   ← Search, Friends
│   ├── chatController.js   ← Messages, Conversations
│   └── aiController.js     ← AI Dermatologist logic
│
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── chatRoutes.js
│   └── aiRoutes.js
│
├── middleware/
│   └── auth.js             ← JWT protect + admin middleware
│
└── socket/
    └── socket.js           ← Socket.io real-time chat
```

---

## 🚀 Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Create .env file
```bash
cp .env.example .env
```
Fill in your values:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `CLIENT_URL` — your frontend URL (e.g. http://localhost:3000)

### 3. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 📡 API Endpoints

### 🔐 Auth  `/api/auth`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/register` | Create account | ❌ |
| POST | `/login` | Login, get JWT | ❌ |
| GET | `/me` | Get my profile | ✅ |
| POST | `/logout` | Logout | ✅ |
| PUT | `/update-profile` | Update profile | ✅ |
| PUT | `/change-password` | Change password | ✅ |

### 👤 Users  `/api/users`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/search?q=sneha` | Search users | ✅ |
| GET | `/friends` | My friends list | ✅ |
| GET | `/:id` | Get user profile | ✅ |
| POST | `/:id/add-friend` | Add friend | ✅ |
| DELETE | `/:id/remove-friend` | Remove friend | ✅ |

### 💬 Chat  `/api/chat`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/send` | Send message | ✅ |
| GET | `/conversations` | All conversations | ✅ |
| GET | `/:userId` | Conversation with user | ✅ |
| DELETE | `/:messageId` | Delete message | ✅ |

### 🤖 AI  `/api/ai`
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/chat` | Chat with AI doctor | ✅ |
| GET | `/history` | AI chat history | ✅ |
| GET | `/routine` | Get saved routine | ✅ |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `user:online` | `userId` | User comes online |
| `message:send` | `{ senderId, receiverId, content }` | Send real-time message |
| `typing:start` | `{ senderId, receiverId }` | Start typing indicator |
| `typing:stop` | `{ senderId, receiverId }` | Stop typing indicator |
| `message:seen` | `{ messageId, senderId }` | Mark message as read |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `users:online` | `[userId, ...]` | Updated online users list |
| `message:receive` | `messageObject` | New incoming message |
| `message:sent` | `messageObject` | Confirmation of sent message |
| `typing:show` | `{ userId }` | Someone is typing |
| `typing:hide` | `{ userId }` | Someone stopped typing |
| `message:read` | `{ messageId }` | Message was seen |

---

## 🛡️ Security Features
- ✅ JWT Authentication (7 day expiry)
- ✅ bcrypt password hashing (salt rounds: 10)
- ✅ Role-based access (user / admin)
- ✅ CORS configured
- ✅ Environment variables for all secrets
- ✅ Password never returned in API responses (`select: false`)

---

## 🗄️ MongoDB Collections
- `users` — user accounts, profiles, skin data
- `messages` — chat messages between users
- `aichathistories` — AI consultation sessions and routines

---

## 🚀 Deployment

### Backend → Render / Railway
1. Push code to GitHub
2. Connect repo to Render
3. Set environment variables in dashboard
4. Deploy!

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com
2. Get connection string
3. Set as `MONGO_URI` in .env

---

## 📋 CSE Project Info
- **CO Mapping**: CO2, CO3 (Backend & Database)
- **Marks**: 15 (Backend Development & Database Connectivity)
- **Deadline**: 31/03/2026
- **Tech Stack**: Node.js, Express, MongoDB, Socket.io, JWT, bcrypt
