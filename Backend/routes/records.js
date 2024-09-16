const express = require('express');
const router = express.Router();
const client = require('../databasepg');  // Import the PostgreSQL client

// GET all employees
router.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM employee');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a single employee by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query('SELECT * FROM employee WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new employee
router.post('/', async (req, res) => {
  const { staff_id, first_name, last_name, department, position, country, email, reporting_manager, role } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO employee (staff_id, first_name, last_name, department, position, country, email, reporting_manager, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [staff_id, first_name, last_name, department, position, country, email, reporting_manager, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE an employee by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query('DELETE FROM employee WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE an employee by ID
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, department, position, country, email, reporting_manager, role } = req.body;
  try {
    const result = await client.query(
      'UPDATE employee SET first_name = $1, last_name = $2, department = $3, position = $4, country = $5, email = $6, reporting_manager = $7, role = $8 WHERE id = $9 RETURNING *',
      [first_name, last_name, department, position, country, email, reporting_manager, role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
