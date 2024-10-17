// ArrangementForm.jsx

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
  Container,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers"; // Removed PickersDay import
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
    fetchApprovedPendingDates();
  }, [staffId]);

  // Function to fetch approved and pending dates
  const fetchApprovedPendingDates = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/wfh_records/approved&pending_wfh_requests/${staffId}`
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
        setSuccessMessage(data.message || "WFH request submitted successfully.");
        // Reset form fields
        setWfhDate(null);
        setScheduleType("");
        setReason("");
        // Refresh the approved and pending dates
        fetchApprovedPendingDates();
      } else {
        setErrorMessage(data.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      setErrorMessage(`An unexpected error occurred: ${error.message}`);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="sm">
        {/* Welcome Message */}
        <Typography variant="h6" align="left" sx={{ mt: 4 }}>
          Welcome, {staffId}
        </Typography>

        <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
          {/* Header */}
          <Typography variant="h4" align="center" gutterBottom>
            AdHoc WFH Request Application
          </Typography>

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
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="normal"
                  required
                  inputProps={{ ...params.inputProps, readOnly: true }} // Make input read-only to prevent manual typing
                  onKeyDown={(e) => e.preventDefault()} // Prevent keyboard input
                  onPaste={(e) => e.preventDefault()} // Disable paste
                  onCopy={(e) => e.preventDefault()} // Disable copy
                />
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
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                marginTop: 2,
              }}
            >
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCancel}
              >
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
      </Container>
    </LocalizationProvider>
  );
}
