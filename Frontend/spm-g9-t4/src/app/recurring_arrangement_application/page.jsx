"use client";

import React, {useState, useEffect, useRef} from 'react';
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

const RecurringArrangementPage = () => {
//   const [staff_id, setStaffId] = useState(() => {
//     const user = window.sessionStorage.getItem("user");
//     return user ? JSON.parse(user).staff_id : null; // Parse and extract staff_id
//   });
  const [staff_id, setStaffId] = useState();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [request_reason, setReason] = useState('');
  const [timeslot, setTimeSlot] = useState('');
  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = window.sessionStorage.getItem("user");
      if (user) {
        setStaffId(JSON.parse(user).staff_id);
      }
    }
  }, []);

  // Current date and date restrictions
  const today = new Date(); // Current date
  const minDate = subMonths(today, 2); // 2 months back
  const maxDate = addMonths(today, 3); // 3 months in front
  console.log(staff_id);

  const handleCancel = () => {
    setStaffId('');
    setStartDate(null);
    setEndDate(null);
    setDayOfWeek('');
    setReason('');
    setTimeSlot('');
  };

  const handleSubmit = async () => {
    const payload = {
      staff_id: staff_id,
      start_date: startDate,
      end_date: endDate,
      day_of_week: dayOfWeek,
      request_reason: request_reason,
      timeslot: timeslot
    };
    setOpen(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}recurring_request/submit`, {
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
        // setStatusMessage('Recurring request application failed: Please try again.' + response.statusText);
        // console.log(response); 
        // Handle different HTTP status codes
        switch (response.status) {
          case 400:
              // Bad Request
              setStatusMessage('Bad Request: (test)' + data.message);
              break;
          case 409:
              // Conflict
              setStatusMessage('Conflict: (test)' + data.message);
              break;
          case 500:
              // Internal Server Error
              setStatusMessage('Server Error: (test)' + data.message);
              break;
          default:
              // Other errors
              setStatusMessage('Error: (test)' + data.message);
              break;
      }
      }
    } catch (error) {
      console.error("Error:", error);
      setStatusMessage("Request failed. Please fill up the form again");
      // Handle different HTTP status codes
    //   switch (response.status) {
    //     case 400:
    //         // Bad Request
    //         setStatusMessage('Bad Request: (test)' + data.message);
    //         break;
    //     case 409:
    //         // Conflict
    //         setStatusMessage('Conflict: (test)' + data.message);
    //         break;
    //     case 500:
    //         // Internal Server Error
    //         setStatusMessage('Server Error: (test)' + data.message);
    //         break;
    //     default:
    //         // Other errors
    //         setStatusMessage('Error: (test)' + data.message);
    //         break;
    // }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          WFH Recurring Request Application
        </Typography>

        <form noValidate autoComplete="off">
          {/* <TextField
            label="Staff ID"
            value={staff_id}
            onChange={(e) => setStaffId(e.target.value)}
            fullWidth
            margin="normal"
            required
          /> */}

          <DatePicker
            label="Start Date"
            value={startDate}
            minDate={minDate}
            maxDate={maxDate}
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

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Timeslot</InputLabel>
            <Select
              value={timeslot}
              onChange={(e) => setTimeSlot(e.target.value)}
              label="Timeslot"
            >
              <MenuItem value={"AM"}>AM</MenuItem>
              <MenuItem value={"PM"}>PM</MenuItem>
              <MenuItem value={"FD"}>FD</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Reason"
            value={request_reason}
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

export default RecurringArrangementPage;