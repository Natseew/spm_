require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const employeeRoutes = require('./routes/records'); // Ensure this path is correct

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

// connect to db
mongoose.connect(process.env.MONG_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        // listen for requests
        app.listen(process.env.PORT, () => {
            console.log('Connected to db & listening on port', process.env.PORT);
        });
    })
    .catch((error) => {
        console.log(error);
    });

