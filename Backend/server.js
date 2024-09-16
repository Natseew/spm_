require('dotenv').config();
const express = require('express');
const client = require('./databasepg');  // Import PostgreSQL client
const employeeRoutes = require('./routes/records');

// express app
const app = express();

// middleware
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

// all routes start with /api/employees
app.use('/api/employees', employeeRoutes);

// listen for requests
app.listen(process.env.PORT, () => {
    console.log('Listening on port', process.env.PORT);
});
