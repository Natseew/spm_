"use client";

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import { Grid, Typography, Box, FormControlLabel, Checkbox, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, Alert, CircularProgress, MenuItem, Select } from '@mui/material';
import Link from 'next/link';
import axios from 'axios';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'; 

dayjs.extend(isSameOrBefore);

// Define StaffCountBox component
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

// Get status label based on schedule status
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

const StaffListTable = ({ staffDataForDate }) => {
  return (
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
                <TableCell>
                  {staff.reporting_manager ? (
                    <Link href="/TeamScheduleHR" passHref>
                      {staff.reporting_manager}
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
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
};

const HRPage = () => {
  const departments = ["Finance", "CEO", "HR", "Sales", "Consultancy", "Engineering", "IT", "Solutioning"];
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState({ AM: true, PM: true });
  const [dateRange, setDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
  const [staffSchedules, setStaffSchedules] = useState({});
  const [employeeCount, setEmployeeCount] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(""); 

  // Handle department checkbox change
  const handleDepartmentChange = (event) => {
    const { value, checked } = event.target;
    setSelectedDepartments((prev) =>
      checked ? [...prev, value] : prev.filter((dept) => dept !== value)
    );
  };

  // Handle session change (AM/PM)
  const handleSessionChange = (event) => {
    const { name, checked } = event.target;
    setSelectedSessions((prev) => ({ ...prev, [name]: checked }));
  };

  // Validation to check if at least one session is selected
  const validateSessionSelection = () => {
    return selectedSessions.AM || selectedSessions.PM;
  };

  const fetchStaffSchedule = async () => {
    if (!validateSessionSelection()) {
      setError('Please select at least one session (AM or PM).');
      return; // Do not proceed with submission
    }
  
    try {
      setError(''); // Clear error message
      setLoading(true);
      const formattedStartDate = dayjs(dateRange[0].startDate).format('YYYY-MM-DD');
      const formattedEndDate = dayjs(dateRange[0].endDate).format('YYYY-MM-DD');
      const departmentsParam = selectedDepartments.join(',');
  
      // Fetch the staff schedules from the backend
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}wfh_records/schedule/${departmentsParam}/${formattedStartDate}/${formattedEndDate}`);
      
      console.log('API Response:', response.data); // Log the API response
  
      const schedules = response.data.staff_schedules || {};
      const employeeCount = response.data.total_employees || [];
    
      setEmployeeCount(employeeCount);
      setStaffSchedules(schedules);
  
      const availableDates = Object.keys(schedules);
      if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]);
      }
  
    } catch (error) {
      console.error("Error fetching staff schedule:", error);
      setError('Error fetching staff schedule');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStaffCounts = (selectedDate) => {
    const filteredData = staffSchedules[selectedDate] || [];
    const homeStaff = filteredData.filter(staff => staff.schedule_status !== 'Office').length;
    const officeStaff = filteredData.filter(staff => staff.schedule_status === 'Office').length;

    const totalEmployeeCount = employeeCount
      .filter(entry => selectedDepartments.includes(entry.dept))
      .reduce((sum, entry) => sum + parseInt(entry.total_employees, 10), 0);

    return {
      officeStaff,
      homeStaff,
      totalEmployeeCount,
    };
  };

  const { officeStaff, homeStaff, totalEmployeeCount } = calculateStaffCounts(selectedDate);

  return (
    <div>
      <Box sx={{ padding: '20px' }}>
        {error && (
          <Alert severity="error" sx={{ marginBottom: '20px' }}>
            {error.split('.').map((msg, index) => (
              <div key={index}>{msg.trim()}.</div>
            ))}
          </Alert>
        )}

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

        <DateRange
          ranges={dateRange}
          onChange={(ranges) => setDateRange([ranges.selection])}
        />

        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchStaffSchedule}
          sx={{ marginBottom: '20px' }}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>

        <Box sx={{ marginBottom: '20px', width: '200px' }}>
          <Typography variant="h6" sx={{ marginBottom: '10px' }}>Filter by Date</Typography>
          <Select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            fullWidth
            className="date-filter-select"
            data-testid="date-filter-select"
          >
            {Object.keys(staffSchedules).map(date => (
              <MenuItem key={date} value={date}>
                {date}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {!loading && (
          <>
            <StaffCountBox officeCount={officeStaff} homeCount={homeStaff} totalEmployees={totalEmployeeCount} />
            <StaffListTable staffDataForDate={staffSchedules[selectedDate]} />
          </>
        )}
      </Box>
    </div> 
  );
};

export default HRPage;