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


// Define the auto-reject function
const autoRejectRequests = async () => {
    const reason = 'autoRejection';

    try {
        const fetch = (await import('node-fetch')).default;
        // Call the recurring_request auto-reject endpoint
        const recurringRequestResponse = await fetch(`http://localhost:4000/recurring_request/auto-reject/${reason}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const recurringResult = await recurringRequestResponse.json();
        console.log('Recurring request auto-reject called successfully:', recurringResult);
    } catch (error) {
        console.error('Error calling recurring request auto-reject:', error);
    }

    try {
        // Call the wfh_records auto-reject endpoint
        const wfhRecordsResponse = await fetch(`http://localhost:4000/wfh_records/auto-reject/${reason}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const wfhResult = await wfhRecordsResponse.json();
        console.log('WFH records auto-reject called successfully:', wfhResult);
    } catch (error) {
        console.error('Error calling wfh records auto-reject:', error);
    }
};

// Run the auto-reject function every 24 hours
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
setInterval(autoRejectRequests, ONE_DAY_IN_MS);

// Start the server and listen on the port defined in .env
const port = process.env.PORT || 4000; 
app.listen(port, async () => {
    console.log(`Server is listening on port ${port}`);
});





