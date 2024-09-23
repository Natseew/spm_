"use client";

import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { addMonths, subMonths } from "date-fns"; // Importing date functions

export default function ArrangementForm() {
  const [staffId, setStaffId] = useState(""); // Staff ID input
  const [wfhDate, setWfhDate] = useState(null); // For WFH date picker
  const [scheduleType, setScheduleType] = useState(""); // For selecting AM, PM, or Full Day
  const [reason, setReason] = useState(""); // For reason textarea

  // Current date and date restrictions
  const today = new Date(); // Current date
  const minDate = subMonths(today, 2); // 2 months back
  const maxDate = addMonths(today, 3); // 3 months in front

  // Handles form submission
  const handleSubmit = async () => {
    const reqDate = new Date().toISOString().split("T")[0]; // Current request date

    // Ensure the WFH date is formatted correctly
    const formattedWfhDate = wfhDate ? new Date(wfhDate).toISOString().split("T")[0] : null;

    // Prepare payload to match the backend schema
    const payload = {
      staff_id: staffId,
      req_date: reqDate, // Request date
      sched_date: formattedWfhDate, // Scheduled WFH date
      timeSlot: scheduleType === "Full Day" ? 'FD' : scheduleType, // Match TimeSlot (AM, PM, or FD)
      status: 'Pending', // Default status for new requests
      reason, // WFH request reason
    };

    console.log(payload); // For debugging purposes

    try {
      const response = await fetch('http://localhost:4000/wfh_adhoc_request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Send the payload
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Request successful:", data);
      } else {
        console.error("Request failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Handles form cancellation
  const handleCancel = () => {
    console.log("Form cancelled");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          WFH Request Application
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
            label="WFH Date"
            value={wfhDate}
            onChange={(newValue) => setWfhDate(newValue)}
            minDate={minDate} // Set minimum date
            maxDate={maxDate} // Set maximum date
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" required />
            )}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Schedule Type</InputLabel>
            <Select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              label="Schedule Type"
            >
              <MenuItem value="AM">AM</MenuItem>
              <MenuItem value="PM">PM</MenuItem>
              <MenuItem value="Full Day">Full Day</MenuItem>
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
    </LocalizationProvider>
  );
}
