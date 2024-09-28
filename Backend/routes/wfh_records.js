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

module.exports = router;