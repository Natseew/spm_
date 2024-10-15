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



// Withdraw a date from a recurring WFH request
router.post('/withdraw_recurring_wfh', async (req, res) => {
    const { requestID, wfhDate, reason } = req.body;
  
    try {
      // Start a transaction to ensure atomicity
      await client.query('BEGIN');
  
      // 1. Fetch the recurring request to modify the wfh_dates array
      const result = await client.query(
        `SELECT wfh_dates, status FROM recurring_request WHERE requestID = $1`,
        [requestID]
      );
  
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Recurring request not found.' });
      }
  
      const { wfh_dates, status } = result.rows[0];
  
      // Convert the input date to the correct format and check if it exists in the array
      const dateToRemove = new Date(wfhDate).toISOString().slice(0, 10);
  
      if (!wfh_dates.includes(dateToRemove)) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'WFH date not found in the request.' });
      }
  
      // Remove the date from the wfh_dates array
      const updatedDates = wfh_dates.filter(date => date !== dateToRemove);
  
      // 2. If the request status is 'Pending', update the wfh_dates array in recurring_request
      if (status === 'Pending') {
        await client.query(
          `UPDATE recurring_request SET wfh_dates = $1 WHERE requestID = $2`,
          [updatedDates, requestID]
        );
  
        // 3. Insert a new activity log entry for the withdrawal
        await client.query(
          `INSERT INTO activitylog (requestID, activity) VALUES ($1, $2)`,
          [requestID, `Withdrawn - ${reason}`]
        );
      }
  
      // 4. If the request status is 'Approved', update wfh_records and mark it as 'Pending Withdrawal'
      if (status === 'Approved') {
        // Update the status to 'Pending Withdrawal' for the corresponding date in wfh_records
        await client.query(
          `UPDATE wfh_records SET status = 'Pending Withdrawal' WHERE wfh_date = $1 AND requestID = $2`,
          [wfhDate, requestID]
        );
  
        // 5. Also update the status of the recurring request itself
        await client.query(
          `UPDATE recurring_request SET status = 'Pending Withdrawal' WHERE requestID = $1`,
          [requestID]
        );
  
        // 6. Insert a new activity log entry for the withdrawal
        await client.query(
          `INSERT INTO activitylog (requestID, activity) VALUES ($1, $2)`,
          [requestID, `Pending Withdrawal - ${reason}`]
        );
      }
  
      // Commit the transaction
      await client.query('COMMIT');
      res.status(200).json({ message: 'Withdrawal successfully processed.' });
    } catch (error) {
      // Rollback the transaction in case of errors
      await client.query('ROLLBACK');
      console.error('Error withdrawing WFH date from recurring request:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  
  

module.exports = router;