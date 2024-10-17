"use client"

import React, {useState, useEffect, useRef} from 'react'
import { Grid, Typography, Box, FormControl, InputLabel, Select, MenuItem, TextField, Paper, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';

export default function Page() {

const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
const [staffData, setStaffData] = useState([]);

  useEffect(()=>{
    fetchStaffSchedule()
  });

  const fetchStaffSchedule = async () => {
    const user = JSON.parse(window.sessionStorage.getItem("user"))
    console.log(user)
    try {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const endpoint = `http://localhost:4000/wfh_records/team-schedule/${user.staff_id}/${formattedDate}`;
      const response = await axios.get(endpoint);
      setStaffData(response.data.staff_schedules || []);
    } catch (error) {
      console.error("Error fetching staff schedule:", error);
    }
  };

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
          <TableCell>Date</TableCell>
          <TableCell>Full Name</TableCell>
          <TableCell>Department</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {staffData.length > 0 ? (
          staffData.map((staff) => (
            <TableRow key={staff.staff_id}>
              <TableCell>{`${dayjs(staff.wfh_date).format('DD MMM YYYY')}`}</TableCell>
              <TableCell>{`${staff.staff_fname} ${staff.staff_lname}`}</TableCell>
              <TableCell>{staff.dept}</TableCell>
              <TableCell>{getStatusLabel(staff.schedule_status)}</TableCell>
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

  

  return (
  <>
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
    <StaffListTable staffData={staffData} />
  </>
  )
}