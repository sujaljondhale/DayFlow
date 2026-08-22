const express=require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());


module.exports = app;