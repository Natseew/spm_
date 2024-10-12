// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const cors = require('cors');

const client = require('./databasepg'); // PostgreSQL client

// Import Routes
const employeeRoutes = require('./routes/employee'); 
const activitylogRoutes = require('./routes/activitylog'); 
const recurring_requestRoutes = require('./routes/recurring_request'); 
const wfh_recordsRoutes = require('./routes/wfh_records'); 

// Create express app
const app = express();

// Enable CORS for all requests
app.use(cors()); 

// Middleware to parse JSON request bodies
app.use(express.json());

// Logging middleware to log the request path and method
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.use('/employee',employeeRoutes);
app.use('/activitylog',activitylogRoutes);
app.use('/wfh_records',wfh_recordsRoutes);
app.use('/recurring_request',recurring_requestRoutes);

// Start the server and listen on the port defined in .env
const port = process.env.PORT || 4000; // Default to port 4000 if no .env config
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});




