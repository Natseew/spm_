const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// GET all work-from-home records
router.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM wfh_records');
        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving all wfh_records:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Get all approved work-from-home records for a specific employee
router.get('/:staffid', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT * FROM wfh_records w
            WHERE w.staffid = $1 AND w.status = 'Approved'
        `, [req.params.staffid]);
        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving approved WFH records:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// New route to get WFH records by an array of employee IDs
router.post('/by-employee-ids', async (req, res) => {
    try {
        const { employeeIds } = req.body;

        // Validate input
        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ message: 'Invalid input. Must provide an array of employee IDs.' });
        }

        // Create placeholders for the SQL query
        const placeholders = employeeIds.map((_, index) => `$${index + 1}`).join(', ');
        const query = `SELECT * FROM wfh_records WHERE staffid IN (${placeholders})`;

        // Execute the query
        const result = await client.query(query, employeeIds);
        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving WFH records by employee IDs:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Accepted Update
// Update the status of a WFH record to "accepted" for a specific employee
router.patch('/accept/:staffid', async (req, res) => {

    try {
        const { staffid } = req.params;

        // Update the status to "accepted"
        const result = await client.query(
            'UPDATE wfh_records SET status = $1 WHERE staffid = $2 RETURNING *',
            ['Approved', staffid]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No records found for the given staff ID.' });
        }

        console.log('Updated record:', result.rows[0]);
        res.status(200).json({ message: 'Status updated to accepted.', record: result.rows[0] });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Rejected Update
// Update the status of a WFH record to "rejected" for a specific employee
router.patch('/reject/:staffid', async (req, res) => {
    try {
        const { staffid } = req.params;

        // Update the status to "rejected"
        const result = await client.query(
            'UPDATE wfh_records SET status = $1 WHERE staffid = $2 RETURNING *',
            ['Rejected', staffid]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No records found for the given staff ID.' });
        }

        console.log('Updated record:', result.rows[0]);
        res.status(200).json({ message: 'Status updated to rejected.', record: result.rows[0] });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


module.exports = router;
