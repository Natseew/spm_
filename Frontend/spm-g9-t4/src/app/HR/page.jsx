"use client";

import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Paper } from '@mui/material';
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

const StaffListTable = ({ staffData }) => (
  <Table sx={{ marginTop: '20px' }}>
    <TableHead>
      <TableRow>
        <TableCell>Full Name</TableCell>
        <TableCell>Department</TableCell>
        <TableCell>Schedule Status</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {staffData.length > 0 ? (
        staffData.map((staff) => (
          <TableRow key={staff.staff_id}>
            <TableCell>{`${staff.staff_fname} ${staff.staff_lname}`}</TableCell>
            <TableCell>{staff.dept}</TableCell>
            <TableCell>{staff.schedule_status}</TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={3} align="center">No staff data available.</TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);

const HRPage = () => {
  const departments = ["Finance", "CEO", "HR", "Sales", "Consultancy", "Engineering", "IT", "Solutioning"];
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [staffData, setStaffData] = useState([]);
  const [totalStaffCount, setTotalStaffCount] = useState(0);

  useEffect(() => {
    const fetchStaffSchedule = async () => {
      if (!department || !date) return;

      try {
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        const response = await axios.get(`http://localhost:4000/schedule/${department}/${formattedDate}`);
        
        setStaffData(response.data.staff_schedules || []);
        setTotalStaffCount(response.data.total_staff || 0);
      } catch (error) {
        console.error("Error fetching staff schedule:", error);
      }
    };

    fetchStaffSchedule();
  }, [department, date]);

  const calculateStaffCounts = () => {
    const amHomeStaff = staffData.filter(staff => ['AM', 'AM & PM'].includes(staff.schedule_status)).length;
    const pmHomeStaff = staffData.filter(staff => ['PM', 'AM & PM'].includes(staff.schedule_status)).length;
    const amOfficeStaff = totalStaffCount - amHomeStaff;
    const pmOfficeStaff = totalStaffCount - pmHomeStaff;

    return { amHomeStaff, amOfficeStaff, pmHomeStaff, pmOfficeStaff };
  };

  const { amHomeStaff, amOfficeStaff, pmHomeStaff, pmOfficeStaff } = calculateStaffCounts();

  return (
    <Box sx={{ padding: '20px' }}>
      <Box sx={{ marginBottom: '20px', width: '200px' }}>
        <Select value={department} onChange={(e) => setDepartment(e.target.value)} fullWidth displayEmpty>
          <MenuItem disabled value=""><em>Select Department</em></MenuItem>
          {departments.map((dept) => (
            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
          ))}
        </Select>
      </Box>

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

export default HRPage;
