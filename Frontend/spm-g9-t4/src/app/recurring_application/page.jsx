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
  Tabs,
  Tab,
} from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addMonths, subMonths } from "date-fns";
import { useRouter } from 'next/navigation';

export default function RecurringArrangementPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [timeslot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(1);

  const today = new Date();
  const minDate = subMonths(today, 2);
  const maxDate = addMonths(today, 3);
  const isSubmitDisabled = !startDate || !endDate || !dayOfWeek || !timeslot || !reason.trim() || isSubmitting;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(window.sessionStorage.getItem("user"));
      if (storedUser) {
        setStaffId(storedUser.staff_id);
      } else {
        router.push("/");
      }
    }
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    setStartDate(formattedStartDate);
    setEndDate(formattedEndDate);
    console.log("Start Date:", formattedStartDate);
    console.log("End Date:", formattedEndDate);

    const payload = {
      staff_id: staffId,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      day_of_week: dayOfWeek,
      request_reason: reason,
      timeslot: timeslot
    };
    console.log("Payload: ",payload);

    try {
      // const response = await fetch(`http://localhost:4000/recurring_request/submit`, {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}recurring_request/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "Recurring WFH request submitted successfully.");
        setStartDate(null);
        setEndDate(null);
        setDayOfWeek("");
        setTimeSlot("");
        setReason("");
      } else {
        setErrorMessage(data.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      setErrorMessage(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setStartDate(null);
    setEndDate(null);
    setDayOfWeek("");
    setTimeSlot("");
    setReason("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      router.push("/adhoc_application");
    } else {
      router.push("/recurring_application");
    }
  };

  return (
    <Container maxWidth="sm">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onChange={handleTabChange} centered>
        <Tab label="ADHOC-APPLICATION" />
        <Tab label="RECURRING APPLICATION" />
      </Tabs>

      {/* Welcome Message */}
      <Typography variant="h6" align="left" sx={{ mt: 4 }}>
        Welcome, {staffId}
      </Typography>

      <Paper elevation={3} sx={{ padding: 4, marginTop: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Recurring WFH Request Application
        </Typography>

        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        <form noValidate autoComplete="off">
          <Typography variant="h6" sx={{ marginBottom: "10px", textAlign: "center" }}>
            Choose your Start and End Dates
          </Typography>

          <FormControl fullWidth margin="normal" required>
            <label>Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              minDate={minDate}
              maxDate={maxDate}
              dateFormat="yyyy/MM/dd"
              placeholderText="Select Start Date"
              customInput={<TextField />}
            />
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <label>End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              minDate={minDate}
              maxDate={maxDate}
              dateFormat="yyyy/MM/dd"
              placeholderText="Select End Date"
              customInput={<TextField />}
            />
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Day of the Week</InputLabel>
            <Select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              label="Day of the Week"
            >
              <MenuItem value="1">Monday</MenuItem>
              <MenuItem value="2">Tuesday</MenuItem>
              <MenuItem value="3">Wednesday</MenuItem>
              <MenuItem value="4">Thursday</MenuItem>
              <MenuItem value="5">Friday</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Timeslot</InputLabel>
            <Select
              value={timeslot}
              onChange={(e) => setTimeSlot(e.target.value)}
              label="Timeslot"
            >
              <MenuItem value="AM">AM</MenuItem>
              <MenuItem value="PM">PM</MenuItem>
              <MenuItem value="FD">Full Day</MenuItem>
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
            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isSubmitDisabled}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
