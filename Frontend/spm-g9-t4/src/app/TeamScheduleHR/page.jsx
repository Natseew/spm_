"use client";

import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, FormControl, InputLabel, Select, MenuItem, TextField, Paper, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import Link from 'next/link';
import axios from 'axios';
import dayjs from 'dayjs';

const StaffCountBox = ({ period, officeCount, homeCount }) => (
  <Paper elevation={3} sx={{ padding: '20px', borderRadius: '10px', backgroundColor: '#f5f5f5' }}>
    <Typography variant="h5" align="center">{period}</Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography variant="h6" align="center">In Office</Typography>
        <Typography variant="h4" align="center">{officeCount}</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="h6" align="center">At Home</Typography>
        <Typography variant="h4" align="center">{homeCount}</Typography>
      </Grid>
    </Grid>
  </Paper>
);

const getStatusLabel = (scheduleStatus) => {
  switch (scheduleStatus) {
    case 'AM': return 'AM Leave';
    case 'PM': return 'PM Leave';
    case 'Full-Day': return 'Full Day Leave';
    case 'Office':
    default: return 'In Office';
  }
};

const StaffListTable = ({ staffData }) => (
  <Table sx={{ marginTop: '20px' }}>
    <TableHead>
      <TableRow>
        <TableCell>Full Name</TableCell>
        <TableCell>Department</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Reporting Manager ID</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {staffData.length > 0 ? (
        staffData.map((staff) => (
          <TableRow key={staff.staff_id}>
            <TableCell>{`${staff.staff_fname} ${staff.staff_lname}`}</TableCell>
            <TableCell>{staff.dept}</TableCell>
            <TableCell>{getStatusLabel(staff.schedule_status)}</TableCell>
            <TableCell>
              {staff.reporting_manager ? (
                <Link href="/TeamSchedule" passHref>
                  {staff.reporting_manager}
                </Link>
              ) : 'N/A'}
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={4} align="center">No staff data available.</TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);

const ManagerIDPage = () => {
  const [selectedManagerID, setSelectedManagerID] = useState("");
  const [managers, setManagers] = useState([]);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [staffData, setStaffData] = useState([]);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await axios.get('http://localhost:4000/employee/managers');
        setManagers(response.data);
      } catch (error) {
        console.error("Error fetching managers:", error);
      }
    };
    fetchManagers();
  }, []);

  const fetchStaffSchedule = async () => {
    if (!selectedManagerID || !date) return;

    try {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const endpoint = `http://localhost:4000/wfh_records/team-schedule/${selectedManagerID}/${formattedDate}`;
      const response = await axios.get(endpoint);
      setStaffData(response.data.staff_schedules || []);
    } catch (error) {
      console.error("Error fetching staff schedule:", error);
    }
  };

  const calculateStaffCounts = () => {
    const amHomeStaff = staffData.filter(staff => staff.schedule_status === 'AM' || staff.schedule_status === 'Full-Day').length;
    const pmHomeStaff = staffData.filter(staff => staff.schedule_status === 'PM' || staff.schedule_status === 'Full-Day').length;
    const amOfficeStaff = staffData.filter(staff => staff.schedule_status === 'Office').length;
    const pmOfficeStaff = staffData.filter(staff => staff.schedule_status === 'Office').length;
    return { amHomeStaff, amOfficeStaff, pmHomeStaff, pmOfficeStaff };
  };

  const { amHomeStaff, amOfficeStaff, pmHomeStaff, pmOfficeStaff } = calculateStaffCounts();

  return (
    <Box sx={{ padding: '20px' }}>
        <FormControl fullWidth sx={{ marginBottom: '20px' }}>
        <InputLabel>Manager</InputLabel>
        <Select
            value={selectedManagerID}
            onChange={(e) => setSelectedManagerID(e.target.value)}
            label="Manager"
        >
            {managers.map((manager) => (
            <MenuItem key={manager.staff_id} value={manager.staff_id}>
                {`${manager.staff_fname} ${manager.staff_lname} (${manager.staff_id})`}
            </MenuItem>
            ))}
        </Select>
        </FormControl>
      <Box sx={{ marginBottom: '20px', width: '200px' }}>
        <TextField
          label="Select Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Box>

      <Button variant="contained" color="primary" onClick={fetchStaffSchedule} sx={{ marginBottom: '20px' }}>
        Submit
      </Button>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <StaffCountBox period="AM" officeCount={amOfficeStaff} homeCount={amHomeStaff} />
        </Grid>
        <Grid item xs={6}>
          <StaffCountBox period="PM" officeCount={pmOfficeStaff} homeCount={pmHomeStaff} />
        </Grid>
      </Grid>

      <StaffListTable staffData={staffData} />
    </Box>
  );
};

export default ManagerIDPage;
