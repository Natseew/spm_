"use client";

import React, { useState, useEffect } from "react";
import {
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
  TextField,
} from "@mui/material";
import DatePicker from "react-datepicker"; // Use react-datepicker for single date selection
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker styles
import { addMonths, subMonths, isSameDay } from "date-fns";
import { useRouter } from 'next/navigation';

export default function ArrangementForm() {
  const router = useRouter(); // Initialize the router
  const [staffId, setStaffId] = useState(null); // Dynamic Staff ID from session
  const [wfhDate, setWfhDate] = useState(new Date()); // For single WFH date selection
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
  const isSubmitDisabled = !wfhDate || !scheduleType || !reason.trim() || isSubmitting;

  // Use useEffect to access window.sessionStorage on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(window.sessionStorage.getItem("user"));
      if (storedUser) {
        setStaffId(storedUser.staff_id);
      } else {
        router.push("/"); // Navigate to the home page if not logged in
      }
    }
  }, []);

  // Fetch approved & pending WFH dates on component mount
  useEffect(() => {
    if (staffId) {
      fetchApprovedPendingDates();
    }
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
        const dates = data.map((record) => new Date(record.wfh_date));
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

    // Prepare payload to match the backend schema
    const payload = {
      staff_id: staffId, // Use the staff ID from session
      req_date: reqDate, // Request date
      sched_date: wfhDate ? wfhDate.toISOString().split("T")[0] : null, // WFH date
      timeSlot: scheduleType === "Full Day" ? "FD" : scheduleType, // Match TimeSlot
      reason, // WFH request reason
    };

    try {
      const response = await fetch(
        `http://localhost:4000/wfh_records/wfh_adhoc_request`,
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
        setWfhDate(new Date());
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
    setWfhDate(new Date());
    setScheduleType("");
    setReason("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Disable weekends and already approved/pending WFH dates
  const isDateDisabled = (date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Disable weekends
    const isApprovedOrPending = approvedPendingDates.some((d) => isSameDay(d, date));
    return isWeekend || isApprovedOrPending;
  };

  return (
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
          {/* Centered Date Picker */}
          <Typography variant="h6" sx={{ marginBottom: "10px", textAlign: "center" }}>
            Choose your WFH Date
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
            <DatePicker
              selected={wfhDate}
              onChange={(date) => setWfhDate(date)}
              minDate={minDate}
              maxDate={maxDate}
              filterDate={(date) => !isDateDisabled(date)} // Disable weekends and specific dates
              dateFormat="yyyy/MM/dd"
              placeholderText="Select WFH Date"
              inline // Display the calendar inline
            />
          </Box>

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
  );
}
