"use client";

import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogActions
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { addMonths, subMonths } from "date-fns";

export default function RecurringArrangementForm() {
  const [staffId, setStaffId] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [disabledDates, setDisabledDates] = useState([]);

  // Current date and date restrictions
  const today = new Date(); // Current date
  const minDate = subMonths(today, 2); // 2 months back
  const maxDate = addMonths(today, 3); // 3 months in front

  // Fetch scheduled dates
  const scheduledDates = async () => {
    try {
      const staffId = 130002; // Hardcoded staff ID here
      const response = await fetch(`http://localhost:4000/wfh_backlog/employee/${staffId}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const dates = Array.isArray(data) ? data.map(item => new Date(item.Sched_date)) : [];
      const datex = data.map(item => new Date(item.Sched_date));
      setDisabledDates(dates);
      console.log(data);
      console.log(datex);
    } catch (error) {
      console.error('Error fetching scheduled dates:', error);
      setDisabledDates([]); // Reset to an empty array on error
    }
  };
  
  // Log disabledDates whenever it changes
  useEffect(() => {
    console.log({ disabledDates });
  }, [disabledDates]);

  // Fetch scheduled dates on component mount
  useEffect(() => {
    scheduledDates();
  }, []);

  // Function to determine if a date should be disabled
  const shouldDisableDate = (date) => {
    return disabledDates.some(disabledDate => 
        disabledDate.toDateString() === date.toDateString()
      );
  };

  // Handles form submission
  const handleSubmit = async () => {
    const payload = {
      staff_id: staffId,
      start_date: startDate,
      end_date: endDate,
      day_of_week: dayOfWeek,
      reason: reason
    };

    setOpen(true);

    try {
      const response = await fetch('http://localhost:4000/wfh_recurring_request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setStatusMessage(data.message);
      } else {
        setStatusMessage('Request failed: ' + response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
      setStatusMessage("Please fill up the form with the correct details and try again");
    }
  };

  // Handles form cancellation
  const handleCancel = () => {
    setStaffId('');
    setStartDate(null);
    setEndDate(null);
    setDayOfWeek('');
    setReason('');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          WFH Recurring Request Application
        </Typography>
        
        <form noValidate autoComplete="off">
          <TextField
            label="Staff ID"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <DatePicker
            label="Start Date"
            value={startDate}
            minDate={minDate}
            maxDate={maxDate}
            shouldDisableDate={shouldDisableDate} // Use the function here
            onChange={(newValue) => setStartDate(newValue)}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" required />
            )}
          />

          <DatePicker
            label="End Date"
            value={endDate}
            minDate={minDate}
            maxDate={maxDate}
            shouldDisableDate={shouldDisableDate} // Use the function here
            onChange={(newValue) => setEndDate(newValue)}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" required />
            )}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Day of the Week</InputLabel>
            <Select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              label="Day of the Week"
            >
              <MenuItem value={1}>Monday</MenuItem>
              <MenuItem value={2}>Tuesday</MenuItem>
              <MenuItem value={3}>Wednesday</MenuItem>
              <MenuItem value={4}>Thursday</MenuItem>
              <MenuItem value={5}>Friday</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            rows={4}
            margin="normal"
            required
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, marginTop: 2 }}>
            <Button variant="outlined" color="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
        </form>
      </Paper>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{statusMessage}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
