const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const dotenv = require('dotenv');
const mongoose = require('mongoose');
// Import Routes
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');

dotenv.config();

// Connect to DB
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true },
    () => console.log('connected to db!')
);

// Middlewares
app.use(express.json());

// Route Middlewares
app.use('/api/user', authRoute);
app.use('/api/posts', postRoute);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));