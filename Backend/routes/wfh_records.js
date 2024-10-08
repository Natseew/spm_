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


// ---------------------------------- view schedule --------------------------------------------- // 


// GET approved staff schedule for a team based on Reporting Manager & date
router.get('/team-schedule/:manager_id/:date', async (req, res) => {
    const { manager_id, date } = req.params;

    try {
        const scheduleResult = await client.query(
            `
            SELECT 
                e.staff_id, 
                e.staff_fname, 
                e.staff_lname, 
                e.dept, 
                e.reporting_manager,  -- Include the Reporting Manager ID
                COALESCE(wr.wfh_date, $2) AS wfh_date,
                COALESCE(wr.timeslot, 'Office') AS timeslot,
                COALESCE(wr.status, 'Office') AS status,
                CASE 
                    WHEN wr.timeslot = 'FD' THEN 'Full-Day'
                    WHEN wr.timeslot = 'AM' THEN 'AM'
                    WHEN wr.timeslot = 'PM' THEN 'PM'
                    ELSE 'Office'
                END AS schedule_status,
                wr.recurring,
                wr.request_reason,
                wr.requestDate,
                wr.reject_reason
            FROM 
                Employee e
            LEFT JOIN 
                wfh_records wr ON e.staff_id = wr.staffID AND wr.wfh_date = $2
            WHERE 
                e.reporting_manager = $1
            `,
            [manager_id, date]
        );

        // Count all team members under the reporting manager (already included in the above query)
        const totalTeamMembers = scheduleResult.rowCount;

        // Combine results
        const response = {
            total_team_members: totalTeamMembers,
            staff_schedules: scheduleResult.rows
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching approved team schedule:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});



// GET staff schedule by department(s)
router.get('/schedule/:departments/:date', async (req, res) => {
    const { departments, date } = req.params;
    const departmentList = departments.split(',');

    try {
        const scheduleResult = await client.query(
            `
            SELECT 
                e.staff_id, 
                e.staff_fname, 
                e.staff_lname, 
                e.dept, 
                e.reporting_manager,  -- Include the Reporting Manager ID
                COALESCE(wr.wfh_date, $2) AS wfh_date,
                COALESCE(wr.timeslot, 'Office') AS timeslot,
                COALESCE(wr.status, 'Office') AS status,
                CASE 
                    WHEN wr.timeslot = 'FD' THEN 'Full-Day'
                    WHEN wr.timeslot = 'AM' THEN 'AM'
                    WHEN wr.timeslot = 'PM' THEN 'PM'
                    ELSE 'Office'
                END AS schedule_status,
                wr.recurring,
                wr.request_reason,
                wr.requestDate,
                wr.reject_reason
            FROM 
                Employee e
            LEFT JOIN 
                wfh_records wr ON e.staff_id = wr.staffID AND wr.wfh_date = $2
            WHERE 
                e.dept = ANY($1::text[])
            `,
            [departmentList, date]
        );

        // Query to count total staff in the departments (already fetched with full employee list)
        const totalStaff = scheduleResult.rowCount;

        // Combine results
        const response = {
            total_staff: totalStaff,
            staff_schedules: scheduleResult.rows
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching staff schedule:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


module.exports = router;