"use client";

import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Paper } from '@mui/material';
import axios from 'axios';  // To fetch data from the backend
import dayjs from 'dayjs';  // For date formatting

// Functional component for rendering a staff count box (AM or PM)
const StaffCountBox = ({ period, officeCount, homeCount }) => {
  return (
    <Paper elevation={3} sx={{ padding: '20px', borderRadius: '10px', backgroundColor: '#f5f5f5' }}>
      <Typography variant="h5" align="center">
        {period}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="h6" align="center">
            In Office
          </Typography>
          <Typography variant="h4" align="center">
            {officeCount}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6" align="center">
            At Home
          </Typography>
          <Typography variant="h4" align="center">
            {homeCount}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Functional component for rendering the staff list table
const StaffListTable = ({ staffData }) => {
  return (
    <Table sx={{ marginTop: '20px' }}>
      <TableHead>
        <TableRow>
          <TableCell>Full Name</TableCell>
          <TableCell>Department</TableCell>
          <TableCell>Schedule Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {staffData.map((staff, index) => (
          <TableRow key={index}>
            <TableCell>{`${staff.staff_fname} ${staff.staff_lname}`}</TableCell>
            <TableCell>{staff.dept}</TableCell>
            <TableCell>{staff.schedule_status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default function HRPage() {
  // List of departments
  const departments = [
    "Finance",
    "CEO",
    "HR",
    "Sales",
    "Consultancy",
    "Engineering",
    "IT",
    "Solutioning"
  ];

  const [department, setDepartment] = useState(departments[0]);  // Default to the first department
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD')); // Default date is today in YYYY-MM-DD format
  const [staffData, setStaffData] = useState([]);

  // Fetch data from the backend whenever the department or date changes
  useEffect(() => {
    const fetchStaffSchedule = async () => {
      try {
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        const response = await axios.get(`http://localhost:4000/schedule/${department}/${formattedDate}`);
        setStaffData(response.data);
        console.log("Response data:", response.data);
      } catch (error) {
        console.error("Error fetching staff schedule:", error);
      }
    };
    
    if (department && date) {
      fetchStaffSchedule();
    }
  }, [department, date]);

  // Calculate AM and PM staff counts for office and home
  const amHomeStaff = staffData.filter(staff => staff.schedule_status === 'AM & PM' || staff.schedule_status === 'AM').length;
  const amOfficeStaff = staffData.filter(staff => staff.schedule_status === 'PM').length;

  const pmHomeStaff = staffData.filter(staff => staff.schedule_status === 'AM & PM' || staff.schedule_status === 'PM').length;
  const pmOfficeStaff = staffData.filter(staff => staff.schedule_status === 'AM').length;

  const handleDepartmentChange = (event) => {
    setDepartment(event.target.value);
  };

  const handleDateChange = (event) => {
    setDate(event.target.value);
  };

  return (
    <Box sx={{ padding: '20px' }}>
      {/* Top Section for Staff Counts */}
      <Grid container spacing={2}>
        {/* AM Section */}
        <Grid item xs={6}>
          <StaffCountBox period="AM" officeCount={amOfficeStaff} homeCount={amHomeStaff} />
        </Grid>
        {/* PM Section */}
        <Grid item xs={6}>
          <StaffCountBox period="PM" officeCount={pmOfficeStaff} homeCount={pmHomeStaff} />
        </Grid>
      </Grid>

      {/* Staff List Table */}
      <StaffListTable staffData={staffData} />

      {/* Dropdown for Department Selection */}
      <Box sx={{ marginTop: '20px', width: '200px' }}>
        <Select
          value={department}  // This must be bound to the state
          onChange={handleDepartmentChange}  // Event handler for changing department
          fullWidth
          displayEmpty  // To display a placeholder if needed
        >
          <MenuItem disabled value="">
            <em>Select Department</em>  {/* Placeholder when no department is selected */}
          </MenuItem>
          {departments.map((dept, index) => (
            <MenuItem key={index} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Date Picker for Schedule Date */}
      <Box sx={{ marginTop: '20px', width: '200px' }}>
        <TextField
          label="Select Date"
          type="date"
          value={date}
          onChange={handleDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          fullWidth
        />
      </Box>
    </Box>
  );
}
