const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// update WFH_Request DB after staff submit WFH request form
router.post('/wfh_request', async (req, res) => {
  const { staff_id, req_date, wfh_date, sched_date_am, sched_date_pm, approved, rejected, reason } = req.body;

  if (!staff_id || !req_date || !wfh_date || !sched_date_am || !sched_date_pm) {
    return res.status(400).json({ message: 'Staff ID, request date, WFH date, AM schedule dates, and PM schedule dates are required.' });
  }

  try {
    // Insert or update the work-from-home request
    const result = await client.query(
      `
      INSERT INTO WFH_Request (Staff_ID, Req_date, WFH_date, Sched_date_am, Sched_date_pm, Approved, Rejected, Reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (Staff_ID, Req_date)
      DO UPDATE SET
        WFH_date = EXCLUDED.WFH_date,
        Sched_date_am = EXCLUDED.Sched_date_am,
        Sched_date_pm = EXCLUDED.Sched_date_pm,
        Approved = EXCLUDED.Approved,
        Rejected = EXCLUDED.Rejected,
        Reason = EXCLUDED.Reason
      RETURNING *;
      `,
      [staff_id, req_date, wfh_date, sched_date_am, sched_date_pm, approved || false, rejected || false, reason || null]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// update WFH_backlog DB after manager click "approve/rej button"
router.post('/wfh_approval', async (req, res) => {
  const { staff_id, req_date, approved, rejected } = req.body;

  if (!staff_id || !req_date || typeof approved === 'undefined' || typeof rejected === 'undefined') {
    return res.status(400).json({ message: 'Staff ID, request date, and approval/rejection status are required.' });
  }

  try {
    // Update the WFH_Request table
    const result = await client.query(
      `
      UPDATE WFH_Request 
      SET Approved = $1, Rejected = $2
      WHERE Staff_ID = $3 AND Req_date = $4
      RETURNING *;
      `,
      [approved, rejected, staff_id, req_date]
    );

    // Check if the update was successful
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'WFH request not found' });
    }

    // Insert into or update the WFH_Backlog table
    await client.query(
      `
      INSERT INTO WFH_Backlog (Staff_ID, Req_date, Status, Updated_At)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (Staff_ID, Req_date)
      DO UPDATE SET
        Status = EXCLUDED.Status,
        Updated_At = NOW();
      `,
      [staff_id, req_date, approved ? 'Approved' : 'Rejected']
    );

    // Return the updated WFH request as JSON
    res.status(200).json(result.rows[0]);
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: error.message });
  }
});



// GET staff schedule by particular department & date
router.get('/schedule/:department_name/:date', async (req, res) => {
  const { department_name, date } = req.params; // Get both parameters from req.params

  try {
    // Query to fetch schedule status
    const result = await client.query(
      `
      SELECT 
        e.staff_id, 
        e.staff_fname, 
        e.staff_lname, 
        e.dept, 
        wb.sched_date_am, 
        wb.sched_date_pm,
        CASE 
            WHEN $2 = ANY (wb.sched_date_am) AND $2 = ANY (wb.sched_date_pm) THEN 'AM & PM'
            WHEN $2 = ANY (wb.sched_date_am) THEN 'AM'
            WHEN $2 = ANY (wb.sched_date_pm) THEN 'PM'
            ELSE 'Not Scheduled'
        END AS schedule_status
      FROM 
        Employee e
      JOIN 
        WFH_Backlog wb ON e.staff_id = wb.staff_id
      WHERE 
        e.dept = $1
      AND 
        ($2 = ANY (wb.sched_date_am) OR $2 = ANY (wb.sched_date_pm));
      `,
      [department_name, date]
    );

    // Send the result as JSON
    res.status(200).json(result.rows);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ message: error.message });
  }
});

// GET all employees
router.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM employee');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Get all approved wfh of employee
router.get('/employee/:id', async(req, res) => {
  try{
    const result = await client.query(`
      SELECT * FROM wfh_sessions w
      WHERE w.staff_id = ${req.params.id}
      AND w.approved = true
    `);
    console.log(result.rows)
    res.status(200).json(result.rows)
  }catch(error){

  }

});

module.exports = router;
