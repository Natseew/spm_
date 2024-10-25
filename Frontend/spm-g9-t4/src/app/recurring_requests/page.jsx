"use client";

import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useRouter } from 'next/navigation';

export default function PendingRequests() {
  const [recurringRequests, setRecurringRequests] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]); // Track selected WFH dates for withdrawal
  const [selectedRequestId, setSelectedRequestId] = useState(null); // Track which request is being changed
  const [openWithdrawDialog, setOpenWithdrawDialog] = useState(false); // Dialog visibility state
  const [activeTab, setActiveTab] = useState(1); // Set default to Recurring Requests tab
  const router = useRouter(); // Initialize the router

  // Retrieve the user data from sessionStorage
  const [user, setUser] = useState(null);
  const [staffId, setStaffId] = useState(null);

  // Use useEffect to access window.sessionStorage on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(window.sessionStorage.getItem("user"));
      setUser(storedUser);
      setStaffId(storedUser ? storedUser.staff_id : null);
    }
  }, []);

  // Fetch recurring requests from the backend
  useEffect(() => {
    const fetchRecurringRequests = async () => {
      try {
        const response = await fetch(`http://localhost:4000/recurring_request`);
        const data = await response.json();

        // Filter data by staffId on the frontend and sort by requestid in descending order
        const filteredData = data
          .filter((request) => request.staff_id === parseInt(staffId))
          .sort((a, b) => b.requestid - a.requestid);

        setRecurringRequests(filteredData);
      } catch (error) {
        console.error("Error fetching recurring requests:", error);
      }
    };

    fetchRecurringRequests();
  }, [staffId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      router.push('/adhoc_requests'); // Navigate to Ad-Hoc Requests page
    }
  };

  // Function to handle opening the withdraw dialog and selecting dates
  const handleOpenWithdrawDialog = (requestId) => {
    setSelectedRequestId(requestId);
    setOpenWithdrawDialog(true);
  };

  // Function to handle closing the withdraw dialog
  const handleCloseWithdrawDialog = () => {
    setSelectedRequestId(null);
    setSelectedDates([]);
    setOpenWithdrawDialog(false);
  };

  // Function to handle selecting dates
  const handleDateSelection = (date) => {
    setSelectedDates((prev) => {
      if (prev.includes(date)) {
        return prev.filter((d) => d !== date); // Unselect the date
      } else {
        return [...prev, date]; // Select the date
      }
    });
  };

  // Function to handle withdrawing selected WFH dates
  const handleWithdrawRequest = async () => {
    if (selectedDates.length === 0) {
      alert("Please select at least one date to withdraw.");
      return;
    }

    const reason = prompt("Please enter the reason for withdrawal:");
    if (!reason) {
      alert("Withdrawal reason is required.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/recurring_request/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId: selectedRequestId, dates: selectedDates, reason, staff_id: staffId }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message); // Display the message returned by the backend
        handleCloseWithdrawDialog(); // Close the dialog after the operation is complete
      } else {
        const result = await response.json();
        alert(`Error withdrawing WFH request: ${result.message}`);
      }
    } catch (error) {
      console.error("Error withdrawing WFH request:", error);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: "100%" }}>
          <Typography variant="h6" gutterBottom textAlign="center">
            Staff ID: {staffId}
          </Typography>

          {/* Tabs for switching between Ad-Hoc and Recurring Requests */}
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Ad-Hoc Requests" />
            <Tab label="Recurring Requests" />
          </Tabs>

          <RecurringRequestsTable
            requests={recurringRequests}
            onWithdraw={handleOpenWithdrawDialog} // Pass the function to handle withdraw
          />
        </Paper>
      </Box>

      {/* Withdraw Request Dialog */}
      <Dialog open={openWithdrawDialog} onClose={handleCloseWithdrawDialog}>
        <DialogTitle>Withdraw WFH Dates</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Select the dates you want to withdraw:
          </Typography>
          {recurringRequests
            .find((req) => req.requestid === selectedRequestId)
            ?.wfh_dates.map((date) => (
              <FormControlLabel
                key={date}
                control={
                  <Checkbox
                    checked={selectedDates.includes(date)}
                    onChange={() => handleDateSelection(date)}
                  />
                }
                label={new Date(date).toLocaleDateString()}
              />
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdrawDialog}>Cancel</Button>
          <Button onClick={handleWithdrawRequest} variant="contained" color="primary">
            Submit Withdrawal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Component to display Recurring Requests Table
function RecurringRequestsTable({ requests, onWithdraw, onChange }) {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
    return (
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table sx={{ width: "100%", border: "1px solid #ccc" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
              <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Request ID</TableCell>
              <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Start Date</TableCell>
              <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>End Date</TableCell>
              <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Day of Week</TableCell>
              <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Timeslot</TableCell>
              <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Status</TableCell>
              <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Reason</TableCell>
              <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.requestid}>
                  <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.requestid}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.start_date ? new Date(request.start_date).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.end_date ? new Date(request.end_date).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{daysOfWeek[request.day_of_week - 1]}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.timeslot === "FD" ? "Full Day" : request.timeslot}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.status}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.request_reason || "N/A"}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                    {["Pending", "Approved"].includes(request.status) && (
                      <>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => onWithdraw(request.requestid)}
                          sx={{ marginRight: 1 }}
                        >
                          Withdraw
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => onChange(request.requestid)}
                        >
                          Change
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: "center" }}>
                  <Typography>No recurring requests found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  