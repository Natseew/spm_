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
  Tabs,
  Tab,
} from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addMonths, subMonths, isSameDay } from "date-fns";
import { useRouter } from 'next/navigation';

export default function ArrangementForm() {
  const router = useRouter();
  const [staffId, setStaffId] = useState(null);
  const [wfhDate, setWfhDate] = useState(new Date());
  const [scheduleType, setScheduleType] = useState("");
  const [reason, setReason] = useState("");
  const [approvedPendingDates, setApprovedPendingDates] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const today = new Date();
  const minDate = subMonths(today, 2);
  const maxDate = addMonths(today, 3);
  const isSubmitDisabled = !wfhDate || !scheduleType || !reason.trim() || isSubmitting;

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

  useEffect(() => {
    if (staffId) {
      fetchApprovedPendingDates();
    }
  }, [staffId]);

  const fetchApprovedPendingDates = async () => {
    try {
      const response = await fetch(`http://localhost:4000/wfh_records/approved&pending_wfh_requests/${staffId}`);
      if (response.ok) {
        const data = await response.json();
        const dates = data.map((record) => new Date(record.wfh_date));
        setApprovedPendingDates(dates);
      } else {
        console.error("Failed to fetch approved and pending dates");
      }
    } catch (error) {
      console.error("Error fetching approved and pending dates:", error);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const reqDate = new Date().toISOString().split("T")[0];
    const payload = {
      staff_id: staffId,
      req_date: reqDate,
      sched_date: wfhDate ? wfhDate.toISOString().split("T")[0] : null,
      timeSlot: scheduleType === "Full Day" ? "FD" : scheduleType,
      reason,
    };

    try {
      const response = await fetch(`http://localhost:4000/wfh_records/wfh_adhoc_request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "WFH request submitted successfully.");
        setWfhDate(new Date());
        setScheduleType("");
        setReason("");
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

  const handleCancel = () => {
    setWfhDate(new Date());
    setScheduleType("");
    setReason("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const isDateDisabled = (date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isApprovedOrPending = approvedPendingDates.some((d) => isSameDay(d, date));
    return isWeekend || isApprovedOrPending;
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1) {
      router.push("/recurring_application");
    } else {
      router.push("/adhoc_application");
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
          AdHoc WFH Request Application
        </Typography>

        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        <form noValidate autoComplete="off">
          <Typography variant="h6" sx={{ marginBottom: "10px", textAlign: "center" }}>
            Choose your WFH Date
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
            <DatePicker
              selected={wfhDate}
              onChange={(date) => setWfhDate(date)}
              minDate={minDate}
              maxDate={maxDate}
              filterDate={(date) => !isDateDisabled(date)}
              dateFormat="yyyy/MM/dd"
              placeholderText="Select WFH Date"
              inline
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
