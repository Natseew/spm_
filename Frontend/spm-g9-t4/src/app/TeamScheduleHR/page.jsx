"use client";

import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, FormControlLabel, Paper, Button, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, MenuItem, Select, Alert } from '@mui/material';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import dayjs from 'dayjs';
import axios from 'axios';

// StaffCountBox component to display counts for AM and PM sessions
const StaffCountBox = ({ officeCount, homeCount, totalEmployees }) => (
  <Paper elevation={3} sx={{ padding: '20px', borderRadius: '10px', backgroundColor: '#f5f5f5' }}>
    <Typography variant="h5" align="center">Staff Count for Selected Date</Typography>
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <Typography variant="h6" align="center">Total Employees</Typography>
        <Typography variant="h4" align="center">{totalEmployees}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="h6" align="center">In Office</Typography>
        <Typography variant="h4" align="center">{officeCount}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="h6" align="center">At Home</Typography>
        <Typography variant="h4" align="center">{homeCount}</Typography>
      </Grid>
    </Grid>
  </Paper>
);

// Helper function to get human-readable labels for schedule status
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

// StaffListTable component to display staff list for a selected date
const StaffListTable = ({ staffDataForDate }) => (
  <Box>
    <Typography variant="h6" sx={{ marginBottom: '10px' }}>Staff List</Typography>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Full Name</TableCell>
          <TableCell>Department</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Reporting Manager</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {staffDataForDate && staffDataForDate.length > 0 ? (
          staffDataForDate.map((staff) => (
            <TableRow key={staff.staff_id}>
              <TableCell>{`${staff.staff_fname} ${staff.staff_lname}`}</TableCell>
              <TableCell>{staff.dept}</TableCell>
              <TableCell>{getStatusLabel(staff.schedule_status)}</TableCell>
              <TableCell>{staff.reporting_manager || 'N/A'}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} align="center">No staff data available for this date.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Box>
);

const ManagerIDPage = () => {
  const [selectedManagerID, setSelectedManagerID] = useState("");
  const [managers, setManagers] = useState([]);
  const [dateRange, setDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
  const [staffSchedules, setStaffSchedules] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}employee/managers`);
        setManagers(response.data);
      } catch (error) {
        console.error("Error fetching managers:", error);
      }
    };
    fetchManagers();
  }, []);

  const fetchStaffSchedule = async () => {
    if (!selectedManagerID) return;

    try {
      setLoading(true);
      const formattedStartDate = dayjs(dateRange[0].startDate).format('YYYY-MM-DD');
      const formattedEndDate = dayjs(dateRange[0].endDate).format('YYYY-MM-DD');

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}wfh_records/team-schedule/${selectedManagerID}/${formattedStartDate}/${formattedEndDate}`;
      const response = await axios.get(endpoint);
      
      console.log("API response:", response.data); // Check the structure of the API response
      const schedules = response.data.team_schedule || {};
      setStaffSchedules(schedules);

      const availableDates = Object.keys(schedules);
      if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]); // Automatically select the first date
      } else {
        setSelectedDate(""); // Reset if no data
      }

    } catch (error) {
      console.error("Error fetching staff schedule:", error);
      setError('Failed to fetch staff schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStaffCounts = (selectedDate) => {
    const staffDataForDate = staffSchedules[selectedDate] || [];
    const homeStaff = staffDataForDate.filter(staff => staff.schedule_status !== 'Office').length;
    const officeStaff = staffDataForDate.filter(staff => staff.schedule_status === 'Office').length;

    return { officeStaff, homeStaff, totalEmployees: staffDataForDate.length };
  };

  const { officeStaff, homeStaff, totalEmployees } = calculateStaffCounts(selectedDate);

  return (
    <Box sx={{ padding: '20px' }}>
      {error && <Alert severity="error">{error}</Alert>}

      <FormControlLabel
        control={
          <Select
            value={selectedManagerID}
            onChange={(e) => setSelectedManagerID(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>Select Manager</MenuItem>
            {managers.map((manager) => (
              <MenuItem key={manager.staff_id} value={manager.staff_id}>
                {`${manager.staff_fname} ${manager.staff_lname} (${manager.staff_id})`}
              </MenuItem>
            ))}
          </Select>
        }
        label="Manager"
        sx={{ marginBottom: '20px' }}
      />

      <DateRange
        ranges={dateRange}
        onChange={(ranges) => setDateRange([ranges.selection])}
      />

      <Button variant="contained" color="primary" onClick={fetchStaffSchedule} sx={{ marginBottom: '20px' }}>
        {loading ? <CircularProgress size={24} /> : 'Submit'}
      </Button>

      <Box sx={{ marginBottom: '20px', width: '200px' }}>
        <Typography variant="h6" sx={{ marginBottom: '10px' }}>Filter by Date</Typography>
        <Select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          fullWidth
        >
          {Object.keys(staffSchedules).map(date => (
            <MenuItem key={date} value={date}>
              {date}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {!loading && selectedDate && (
        <>
          <StaffCountBox officeCount={officeStaff} homeCount={homeStaff} totalEmployees={totalEmployees} />
          <StaffListTable staffDataForDate={staffSchedules[selectedDate]} />
        </>
      )}
    </Box>
  );
};

export default ManagerIDPage;
