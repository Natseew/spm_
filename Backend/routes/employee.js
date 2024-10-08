const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// GET all employees
router.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM employee');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// GET employees by reporting manager
router.get('/by-manager/:managerId', async (req, res) => {
    try {
        const managerId = req.params.managerId;
        const result = await client.query(
            'SELECT * FROM employee WHERE reporting_manager = $1',
            [managerId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving employees by reporting manager:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

module.exports = router;
