const express=require('express');
const cors = require('cors');

const { initDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());


module.exports = app;