import dotenv from 'dotenv';
dotenv.config();  // <- load .env first

import connectDB from './src/config/db.js';  // your mongoose connection code
import express from 'express';
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

connectDB(); // connect to MongoDB


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
