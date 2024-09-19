const express = require('express');
const Staff = require('../models/employee');  // Import the Staff model
const router = express.Router();

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Staff.find();  // Retrieve all employees from the database
    res.status(200).json(employees);  // Return employees as JSON
  } catch (error) {
    res.status(500).json({ message: error.message });  // Handle errors
  }
});

// GET a single employee by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Staff.findById(id);  // Find employee by ID
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);  // Return the employee data as JSON
  } catch (error) {
    res.status(500).json({ message: error.message });  // Handle errors
  }
});

// POST a new employee
router.post('/', async (req, res) => {
  const employeeData = req.body;
  try {
    const newEmployee = new Staff(employeeData);  // Create a new employee document
    await newEmployee.save();  // Save to the database
    res.status(201).json(newEmployee);  // Return the created employee as JSON
  } catch (error) {
    res.status(500).json({ message: error.message });  // Handle errors
  }
});

// DELETE an employee by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Staff.findByIdAndDelete(id);  // Delete employee by ID
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });  // Handle errors
  }
});

// UPDATE an employee by ID
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  try {
    const employee = await Staff.findByIdAndUpdate(id, updatedData, { new: true });  // Update the employee with new data
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);  // Return the updated employee as JSON
  } catch (error) {
    res.status(500).json({ message: error.message });  // Handle errors
  }
});

module.exports = router;
