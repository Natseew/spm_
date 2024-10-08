"use client";

import React, { useState } from 'react';
import { Grid, Typography, Box, FormControlLabel, Checkbox, Table, TableBody, TableCell, TableHead, TableRow, TextField, Paper, Button } from '@mui/material';
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
    case 'AM':
      return 'AM Leave';
    case 'PM':
      return 'PM Leave';
    case 'Full-Day':
      return 'Full Day Leave';
    case 'Office':
    default:
      return 'In Office';
  }
};

const StaffListTable = ({ staffData }) => (
  <Table sx={{ marginTop: '20px' }}>
    <TableHead>
      <TableRow>
        <TableCell>Full Name</TableCell>
        <TableCell>Department</TableCell>
        <TableCell>Status</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {staffData.length > 0 ? (
        staffData.map((staff) => (
          <TableRow key={staff.staff_id}>
            <TableCell>{`${staff.staff_fname} ${staff.staff_lname}`}</TableCell>
            <TableCell>{staff.dept}</TableCell>
            <TableCell>{getStatusLabel(staff.schedule_status)}</TableCell>
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
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState({ AM: true, PM: true });
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [staffData, setStaffData] = useState([]);
  const [totalStaffCount, setTotalStaffCount] = useState(0);

  const handleDepartmentChange = (event) => {
    const { value, checked } = event.target;
    setSelectedDepartments((prev) =>
      checked ? [...prev, value] : prev.filter((dept) => dept !== value)
    );
  };

  const handleSessionChange = (event) => {
    const { name, checked } = event.target;
    setSelectedSessions((prev) => ({ ...prev, [name]: checked }));
  };

  const fetchStaffSchedule = async () => {
    if (selectedDepartments.length === 0 || !date) return;

    try {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const departmentsParam = selectedDepartments.join(',');
      const response = await axios.get(`http://localhost:4000/wfh_records/schedule/${departmentsParam}/${formattedDate}`);

      console.log("Frontend Response:", response.data);

      setStaffData(response.data.staff_schedules || []);
      setTotalStaffCount(response.data.total_staff || 0);
    } catch (error) {
      console.error("Error fetching staff schedule:", error);
    }
  };

  const calculateStaffCounts = () => {
    const amHomeStaff = staffData.filter(staff => 
      selectedSessions.AM && (staff.schedule_status === 'AM' || staff.schedule_status === 'Full-Day')
    ).length;

    const pmHomeStaff = staffData.filter(staff => 
      selectedSessions.PM && (staff.schedule_status === 'PM' || staff.schedule_status === 'Full-Day')
    ).length;

    const amOfficeStaff = staffData.filter(staff => 
      selectedSessions.AM && staff.schedule_status === 'Office'
    ).length;

    const pmOfficeStaff = staffData.filter(staff => 
      selectedSessions.PM && staff.schedule_status === 'Office'
    ).length;

    return { amHomeStaff, amOfficeStaff, pmHomeStaff, pmOfficeStaff };
  };

  const { amHomeStaff, amOfficeStaff, pmHomeStaff, pmOfficeStaff } = calculateStaffCounts();

  return (
    <Box sx={{ padding: '20px' }}>
      <Paper elevation={3} sx={{ padding: '20px', marginBottom: '20px' }}>
        <Typography variant="h6" sx={{ marginBottom: '10px' }}>SESSION</Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedSessions.AM}
              onChange={handleSessionChange}
              name="AM"
              color="primary"
            />
          }
          label="AM"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedSessions.PM}
              onChange={handleSessionChange}
              name="PM"
              color="primary"
            />
          }
          label="PM"
        />
      </Paper>

      <Paper elevation={3} sx={{ padding: '20px', marginBottom: '20px' }}>
        <Typography variant="h6" sx={{ marginBottom: '10px' }}>DEPARTMENT</Typography>
        {departments.map((dept) => (
          <FormControlLabel
            key={dept}
            control={
              <Checkbox
                value={dept}
                checked={selectedDepartments.includes(dept)}
                onChange={handleDepartmentChange}
                sx={{ color: '#4caf50', '&.Mui-checked': { color: '#4caf50' } }}
              />
            }
            label={dept}
          />
        ))}
      </Paper>

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

      <Button 
        variant="contained" 
        color="primary" 
        onClick={fetchStaffSchedule}
        sx={{ marginBottom: '20px' }}
      >
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

export default HRPage;
