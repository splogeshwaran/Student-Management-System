/* ============================================================
   server.js — Express + MongoDB backend for Student Management System
   Run with: node server.js
   ============================================================ */

const express  = require('express');
const mongoose = require('mongoose');
const https    = require('https');
const path     = require('path');


// ── MongoDB connection ──────────────────────────────────────
const MONGODB_URI =
  "mongodb+srv://logeshsp19_db_user:SivaLogesh19@cluster0.ny6cnak.mongodb.net/?appName=Cluster0";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅  Connected to MongoDB Atlas successfully!"))
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Student schema & model ──────────────────────────────────
const studentSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    roll:     { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);

// ── Express app ─────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static files from the same directory
app.use(express.static(path.join(__dirname)));

// ── API Routes ───────────────────────────────────────────────

// Register a new student
app.post('/api/register', async (req, res) => {
  try {
    const { fullname, email, roll, password } = req.body;

    const existing = await Student.findOne({ $or: [{ email }, { roll }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or Roll number already registered.' });
    }

    const student = await Student.create({ fullname, email, roll, password });
    res.status(201).json({ success: true, message: 'Registration successful!', student: { id: student._id, fullname, email, roll } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Login a student
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // username can be email or roll number
    const student = await Student.findOne({
      $or: [{ email: username }, { roll: username }],
    });

    if (!student || student.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    res.json({ success: true, message: 'Login successful!', student: { id: student._id, fullname: student.fullname, email: student.email, roll: student.roll } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({}, '-password');
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states  = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ status: 'ok', mongodb: states[dbState] || 'unknown' });
});

// Proxy Coursera course catalog — GET /api/courses
app.get('/api/courses', (req, res) => {
  const qs      = new URLSearchParams(req.query).toString();
  const apiUrl  = `https://api.coursera.org/api/courses.v1${qs ? '?' + qs : ''}`;

  https.get(apiUrl, { headers: { Accept: 'application/json' } }, (upstream) => {
    res.status(upstream.statusCode);
    res.setHeader('Content-Type', upstream.headers['content-type'] || 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    upstream.pipe(res);
  }).on('error', (err) => {
    console.error('Coursera proxy error:', err.message);
    res.status(502).json({ success: false, message: 'Unable to reach Coursera API.' });
  });
});

// Fallback: serve index / login page (Express 5 wildcard syntax)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});


// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Student Management System running at http://localhost:${PORT}`);
});
