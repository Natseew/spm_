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
  Alert,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker, PickersDay } from "@mui/x-date-pickers";
import { addMonths, subMonths, isSameDay } from "date-fns";

export default function ArrangementForm() {
  const [staffId] = useState(140001); // Hardcoded Staff ID
  const [wfhDate, setWfhDate] = useState(null); // For WFH date picker
  const [scheduleType, setScheduleType] = useState(""); // For selecting AM, PM, or Full Day
  const [reason, setReason] = useState(""); // For reason textarea
  const [approvedPendingDates, setApprovedPendingDates] = useState([]); // List of approved & pending WFH dates
  const [errorMessage, setErrorMessage] = useState(""); // For displaying error messages
  const [successMessage, setSuccessMessage] = useState(""); // For displaying success messages
  const [isSubmitting, setIsSubmitting] = useState(false); // To prevent multiple submissions

  // Current date and date restrictions
  const today = new Date();
  const minDate = subMonths(today, 2); // 2 months back
  const maxDate = addMonths(today, 3); // 3 months ahead

  // Disable submit button if required fields are not filled
  const isSubmitDisabled =
    !wfhDate || !scheduleType || !reason.trim() || isSubmitting;

  // Fetch approved & pending WFH dates on component mount
  useEffect(() => {
    const fetchApprovedPendingDates = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/wfh_records/approved&pending_wfh_requests/${staffId}` // Use the new route
        );
        if (response.ok) {
          const data = await response.json();
          // Extract only the wfh_date field from the response
          const dates = data.map((record) => ({
            date: record.wfh_date,
            status: record.status, // Save the status as well
          }));
          setApprovedPendingDates(dates); // Set the approved and pending WFH dates in state
        } else {
          console.error("Failed to fetch approved and pending dates");
        }
      } catch (error) {
        console.error("Error fetching approved and pending dates:", error);
      }
    };

    fetchApprovedPendingDates();
  }, [staffId]);

  // Handles form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const reqDate = new Date().toISOString().split("T")[0]; // Current request date

    // Ensure the WFH date is formatted correctly
    const formattedWfhDate = wfhDate
      ? new Date(wfhDate).toISOString().split("T")[0]
      : null;

    // Prepare payload to match the backend schema
    const payload = {
      staff_id: staffId, // Use the hardcoded Staff ID
      req_date: reqDate, // Request date
      sched_date: formattedWfhDate, // Scheduled WFH date
      timeSlot: scheduleType === "Full Day" ? "FD" : scheduleType, // Match TimeSlot
      reason, // WFH request reason
    };

    try {
      const response = await fetch(
        "http://localhost:4000/wfh_records/wfh_adhoc_request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload), // Send the payload
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("WFH request submitted successfully.");
        // Reset form fields
        setWfhDate(null);
        setScheduleType("");
        setReason("");
      } else {
        setErrorMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handles form cancellation
  const handleCancel = () => {
    setWfhDate(null);
    setScheduleType("");
    setReason("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Disable weekends and already approved/pending WFH dates
  const shouldDisableDate = (date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isApprovedOrPending = approvedPendingDates.some((wfh) =>
      isSameDay(new Date(wfh.date), date)
    );
    return isWeekend || isApprovedOrPending;
  };

  // Render custom day with color coding
  const renderDay = (day, selectedDate, pickersDayProps) => {
    const isApproved = approvedPendingDates.some(
      (wfh) => isSameDay(new Date(wfh.date), day) && wfh.status === "Approved"
    );
    const isPending = approvedPendingDates.some(
      (wfh) => isSameDay(new Date(wfh.date), day) && wfh.status === "Pending"
    );

    const style = {};
    if (isApproved) {
      style.backgroundColor = "green";
      style.color = "white";
    } else if (isPending) {
      style.backgroundColor = "orange";
      style.color = "white";
    }

    return <PickersDay {...pickersDayProps} day={day} style={style} />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 600 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" gutterBottom>
            WFH Request Application
          </Typography>
          <Typography variant="body1" gutterBottom>
            Staff ID: {staffId}
          </Typography>
        </Box>

        {/* Display success or error messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <form noValidate autoComplete="off">
          <DatePicker
            label="WFH Date"
            value={wfhDate}
            onChange={(newValue) => setWfhDate(newValue)}
            minDate={minDate} // 2 months back
            maxDate={maxDate} // 3 months forward
            shouldDisableDate={shouldDisableDate} // Disable weekends and approved/pending WFH dates
            renderDay={renderDay} // Render the day with color coding
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

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, marginTop: 2 }}
          >
            <Button variant="outlined" color="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        </form>
      </Paper>
    </LocalizationProvider>
  );
}
