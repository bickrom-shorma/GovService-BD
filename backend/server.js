const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const savedServiceRoutes = require('./routes/savedServiceRoutes');
const checklistRoutes = require('./routes/checklistRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Authentication Routes
app.use('/api/auth', authRoutes);
// User Profile Routes
app.use('/api/users', userRoutes);
// Personal Document Routes
app.use('/api/documents', documentRoutes);
//saved service routes
app.use('/api/saved-services', savedServiceRoutes);
//checklistRoutes
app.use('/api/checklists', checklistRoutes);
//feedbackroutes
app.use('/api/feedback', feedbackRoutes);
// Home Route
app.get('/', (req, res) => {
  res.send('GovService-BD Backend Server is Running!');
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const connection = await db.getConnection();

    console.log('MySQL Database Connected Successfully!');

    connection.release();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

startServer();
