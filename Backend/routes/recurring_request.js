const express = require('express');
const router = express.Router();
const client = require('../databasepg');

router.get('/', async (req, res) => {
    try{
        const result = await client.query(`
            SELECT * FROM recurring_request
        `);
        console.log(result.rows)
        res.status(200).json(result.rows)
    }catch(error){
        console.error('Error retreiving all recurring_request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// New route to get recurring requests by an array of employee IDs
router.post('/by-employee-ids', async (req, res) => {
    try {
        const { employeeIds } = req.body;

        // Validate input
        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ message: 'Invalid input. Must provide an array of employee IDs.' });
        }

        // Create placeholders for the SQL query
        const placeholders = employeeIds.map((_, index) => `$${index + 1}`).join(', ');
        const query = `SELECT * FROM recurring_request WHERE staff_id IN (${placeholders})`;

        // Execute the query
        const result = await client.query(query, employeeIds);
        console.log(result.rows); // Optional: Log the retrieved rows for debugging
        res.status(200).json(result.rows); // Return fetched records
    } catch (error) {
        console.error('Error retrieving recurring requests by employee IDs:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

module.exports = router;