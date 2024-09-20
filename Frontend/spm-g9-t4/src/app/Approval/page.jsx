"use client";

import React, { useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
  Paper,
  Tab,
  Tabs
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function ArrangementForm() {
  const [staffId, setStaffId] = useState(""); // State for staff ID
  const [wfhDate, setWfhDate] = useState(null); // For WFH date picker
  const [timePeriod, setTimePeriod] = useState(""); // For AM/PM/Full Day dropdown
  const [reason, setReason] = useState(""); // For reason textarea
  const [tabValue, setTabValue] = useState(0); // For tab navigation

  const handleDateChange = (newValue) => {
    setWfhDate(newValue);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmit = async () => {
    const today = new Date().toISOString().split('T')[0]; // Request date as today

    // Construct request payload to match WFH_Request table format
    const payload = {
      staff_id: staffId, // Use the entered Staff ID
      req_date: today,
      wfh_date: today, // Hardcoded WFH date as today
      time_period: timePeriod, // AM/PM/Full Day
      reason
    };

    console.log(payload); // Debugging purposes

    try {
      const response = await fetch('http://localhost:4000/wfh_request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

  const handleCancel = () => {
    console.log("Form cancelled");
    // Optionally, reset the form fields here
    setStaffId("");
    setWfhDate(null);
    setTimePeriod("");
    setReason("");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Arrangement Application
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="arrangement tabs">
            <Tab label="Ad-Hoc Application" />
            <Tab label="Regular Application" />
          </Tabs>
        </Box>

        <form noValidate autoComplete="off">
          <TextField
            label="Staff ID"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            fullWidth
            margin="normal"
          />

          <DatePicker
            label="WFH Date"
            value={wfhDate}
            onChange={handleDateChange}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                margin="normal"
              />
            )}
          />

          <TextField
            select
            label="Time Period"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="AM">AM</MenuItem>
            <MenuItem value="PM">PM</MenuItem>
            <MenuItem value="Full Day">Full Day</MenuItem>
          </TextField>

          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            rows={4}
            margin="normal"
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, marginTop: 2 }}>
            <Button variant="outlined" color="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Confirm
            </Button>
          </Box>
        </form>
      </Paper>
    </LocalizationProvider>
  );
}
