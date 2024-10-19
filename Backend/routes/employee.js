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

// GET all distinct reporting managers with their names
router.get('/managers', async (req, res) => {
  try {
      const query = `
          SELECT DISTINCT e.Reporting_Manager AS Staff_ID, m.Staff_FName, m.Staff_LName
          FROM employee e
          JOIN employee m ON e.Reporting_Manager = m.Staff_ID
          WHERE e.Reporting_Manager IS NOT NULL
      `;
      const result = await client.query(query);
      res.status(200).json(result.rows);
  } catch (error) {
      console.error('Error fetching managers:', error);
      res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

// GET specific employee based on details
router.post('/login', async (req, res) => {
  try { 
    console.log(req.body)
    const result = await client.query(`
      SELECT * FROM employee
      WHERE email = $1
	    AND staff_fname = $2
    `,[req.body.email, req.body.password]);
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