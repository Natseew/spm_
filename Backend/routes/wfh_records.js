const express = require('express');
const router = express.Router();
const client = require('../databasepg');

router.get('/', async (req, res) => {
    try{
        const result = await client.query(`
            SELECT * FROM wfh_records
        `);
        console.log(result.rows)
        res.status(200).json(result.rows)
    }catch(error){
        console.error('Error retreiving all wfh_records:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

        //Get all approved wfh of employee
router.get('/:staffid', async(req, res) => {
    try{
    const result = await client.query(`
        SELECT * FROM wfh_records w
        WHERE w.staffid = ${req.params.staffid}
        AND w.status = 'Approved'
    `);
    console.log(result.rows)
    res.status(200).json(result.rows)
    }catch(error){

    }
});


// Get all approved and pending WFH requests of an employee
router.get('/approved&pending_wfh_requests/:staffid', async (req, res) => {
  try {
    const result = await client.query(
      `
      SELECT * FROM wfh_records 
      WHERE staffID = $1
      AND status IN ('Approved', 'Pending')
      `,
      [req.params.staffid]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No approved or pending WFH requests found for this employee.' });
    }

    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching approved and pending WFH requests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// Withdraw an ad-hoc WFH request
router.post('/withdraw_wfh', async (req, res) => {
  const { recordID, reason } = req.body;

  try {
    // Start a transaction to ensure atomicity
    await client.query('BEGIN');

    // 1. Fetch the current request to check its status
    const result = await client.query(
      `SELECT status FROM wfh_records WHERE recordID = $1`,
      [recordID]
    );

    const currentStatus = result.rows[0]?.status;

    // Validate the current status for withdrawal (if it's neither Pending nor Approved)
    if (currentStatus !== "Pending" && currentStatus !== "Approved") {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid request status for withdrawal.' });
    }

    // Determine new status based on the current status
    const newStatus = currentStatus === "Approved" ? "Pending Withdrawal" : "Withdrawn";

    // 2. Update the wfh_records table to set the new status
    const updateResult = await client.query(
      `UPDATE wfh_records 
       SET status = $1 
       WHERE recordID = $2 
       RETURNING *`,
      [newStatus, recordID]
    );

    // Check if the record exists and was updated
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'WFH request not found or already withdrawn.' });
    }

    // 3. Insert a new row into the activity log to log the withdrawal along with the reason
    await client.query(
      `INSERT INTO activitylog (recordID, activity) 
       VALUES ($1, $2)`,
      [recordID, `Withdrawn - ${reason || 'No reason provided'}`]
    );

    // Commit the transaction
    await client.query('COMMIT');

    // Send a different response message based on the original status
    if (currentStatus === "Approved") {
      res.status(200).json({ message: 'Withdrawal has been submitted to Reporting Manager for approval.' });
    } else {
      res.status(200).json({ message: 'WFH request withdrawn successfully.' });
    }

  } catch (error) {
    // Rollback in case of any errors
    await client.query('ROLLBACK');
    console.error('Error withdrawing WFH request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// Change an ad-hoc WFH request
// Change an ad-hoc WFH request
router.post('/change_adhoc_wfh', async (req, res) => {
  const { recordID, new_date, reason } = req.body;

  try {
    // Start a transaction to ensure atomicity
    await client.query('BEGIN');

    // 1. Fetch the current WFH record to get the current status and wfh_date
    const result = await client.query(
      `SELECT status, wfh_date FROM wfh_records WHERE recordID = $1`,
      [recordID]
    );

    const currentStatus = result.rows[0]?.status;
    const currentWfhDate = result.rows[0]?.wfh_date;

    // Validate the current status for change (if it's neither Pending nor Approved)
    if (currentStatus !== "Pending" && currentStatus !== "Approved") {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid request status for change.' });
    }

    // Convert new_date to a proper Date object if it's not already
    const formattedNewDate = new Date(new_date);

    // Determine new status and decide whether to update wfh_date or not
    let newStatus = currentStatus;
    let updateWfhDate = false;

    if (currentStatus === "Pending") {
      // For pending requests, keep the status as "Pending" and update the wfh_date
      newStatus = "Pending";
      updateWfhDate = true;
    } else if (currentStatus === "Approved") {
      // For approved requests, set status to "Pending Change" but don't update wfh_date
      newStatus = "Pending Change";
    }

    // 2. Update the wfh_records table
    if (updateWfhDate) {
      // For pending requests, update the wfh_date in the table
      const updateResult = await client.query(
        `UPDATE wfh_records 
         SET status = $1, wfh_date = $2 
         WHERE recordID = $3 
         RETURNING *`,
        [newStatus, formattedNewDate, recordID]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'WFH request not found or already changed.' });
      }
    } else {
      // For approved requests, only update the status without changing wfh_date
      const updateResult = await client.query(
        `UPDATE wfh_records 
         SET status = $1 
         WHERE recordID = $2 
         RETURNING *`,
        [newStatus, recordID]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'WFH request not found or already changed.' });
      }
    }

    // Convert dates to YYYY-MM-DD format for saving in the activity log
    const formattedCurrentWfhDate = new Date(currentWfhDate).toISOString().split('T')[0]; // Old WFH Date
    const formattedNewDateString = formattedNewDate.toISOString().split('T')[0]; // New WFH Date

    // 3. Insert a new row into the activity log to log the change along with the reason and old/new wfh_date
    const activityMessage = currentStatus === "Approved"
      ? `Pending Change - ${reason || 'No reason provided'} (Old WFH Date: ${formattedCurrentWfhDate}, New WFH Date: ${formattedNewDateString})`
      : `Changed - ${reason || 'No reason provided'} (Old WFH Date: ${formattedCurrentWfhDate}, New WFH Date: ${formattedNewDateString})`;

    await client.query(
      `INSERT INTO activitylog (recordID, activity) 
       VALUES ($1, $2)`,
      [recordID, activityMessage]
    );

    // Commit the transaction
    await client.query('COMMIT');

    // Send a different response message based on the original status
    if (currentStatus === "Approved") {
      res.status(200).json({ message: 'Change request has been submitted to Reporting Manager for approval.' });
    } else {
      res.status(200).json({ message: 'WFH date changed successfully.' });
    }

  } catch (error) {
    // Rollback in case of any errors
    await client.query('ROLLBACK');
    console.error('Error changing WFH request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



module.exports = router;