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
// Update the status of a WFH record to "Approved" for a specific record ID
router.patch('/accept/:recordID', async (req, res) => {
    const { recordID } = req.params; // Use recordID from the route parameters
   router.patch('/reject/:id', async (req, res) => {
    const { id } = req.params; // Extract the ID from request parameters
    const { reason } = req.body; // Extract the reason from the request body

    try {
        const result = await client.query(
            'UPDATE wfh_records SET status = $1, reject_reason = $2 WHERE recordID = $3 RETURNING *',
            ['Rejected', reason, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No records found for the given record ID.' });
        }

        res.status(200).json({ message: 'Rejection reason updated successfully.', record: result.rows[0] });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

    try {
        // Update the status to "Approved"
        const result = await client.query(
            'UPDATE wfh_records SET status = $1 WHERE recordID = $2 RETURNING *',
            ['Approved', recordID] // Pass the new status and recordID
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No records found for the given record ID.' });
        }

        console.log('Updated record:', result.rows[0]);
        res.status(200).json({ message: 'Status updated to approved.', record: result.rows[0] });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


// Reject Update
// Update the status of a WFH record to "Rejected" and set the reject reason for a specific employee
router.patch('/reject/:id', async (req, res) => {
    const { id } = req.params; // Extract the ID from request parameters
    const { reason } = req.body; // Extract the reason from the request body

    try {
        const result = await client.query(
            'UPDATE wfh_records SET status = $1, reject_reason = $2 WHERE recordid = $3 RETURNING *',
            ['Rejected', reason, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No records found for the given record ID.' });
        }

        res.status(200).json({ message: 'Rejection reason updated successfully.', record: result.rows[0] });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


module.exports = router;
