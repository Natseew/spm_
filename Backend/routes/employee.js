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
        console.log(req.body);
        const result = await client.query(`
            SELECT * FROM employee
            WHERE email = $1
            AND staff_fname = $2
        `, [req.body.email, req.body.password]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Define your map_team_hierarchy function
async function map_team_hierarchy(manager_id, client) {
  const team = [];

  // Recursively fetch subordinates of a given manager
  const fetchTeam = async (manager_id) => {
    const result = await client.query(
      `SELECT staff_id, staff_fname, staff_lname
       FROM employee
       WHERE reporting_manager = $1`,
      [manager_id]
    );
    const subordinates = result.rows;

    // Recursively fetch subordinates and assign them to each subordinate
    for (const subordinate of subordinates) {
      subordinate.subordinates = await fetchTeam(subordinate.staff_id);
    }

    return subordinates;
  };

  // Start by fetching subordinates of the given manager
  const topTeam = await fetchTeam(manager_id);

  // Push the top manager's subordinates into the team array
  team.push(...topTeam);

  return team;
}


// Export router and map_team_hierarchy correctly
module.exports = router;  // Default export for router
module.exports.map_team_hierarchy = map_team_hierarchy;  // Named export for map_team_hierarchy
