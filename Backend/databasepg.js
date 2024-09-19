require('dotenv').config();  // This loads the .env file

const { Client } = require('pg');

// Log environment variables to check their values
console.log({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        require: true,
        rejectUnauthorized: false
    }
});

client.connect(err => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log('Connected to the database');
    }
});

client.query('SELECT * FROM employee', (err, res) => {
    if (!err) {
        console.log(res.rows);
    } else {
        console.error('Query error:', err.message);
    }
    client.end();  // Properly close the connection
});
