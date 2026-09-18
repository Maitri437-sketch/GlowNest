// ─────────────────────────────────────
//  GlowNest Backend – server.js
//  Main entry point
// ─────────────────────────────────────

const express = require('express');
const http    = require('http');
const cors    = require('cors');
const morgan  = require('morgan');
const dotenv  = require('dotenv');

const connectDB     = require('./config/db');
const initSocket    = require('./socket/socket');

// Routes
const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const chatRoutes    = require('./routes/chatRoutes');
const aiRoutes      = require('./routes/aiRoutes');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app    = express();
const server = http.createServer(app);

// ── Middleware ──
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Routes ──
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat',  chatRoutes);
app.use('/api/ai',    aiRoutes);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌸 GlowNest API is running!',
    version: '1.0.0'
  });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ── Init Socket.io ──
initSocket(server);

// ── Start Server ──
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🌸 GlowNest Server running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`🌍 Mode: ${process.env.NODE_ENV}\n`);
});
