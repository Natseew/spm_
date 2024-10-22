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
  Tabs,
  Tab,
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useRouter } from 'next/navigation';

export default function PendingRequests() {
  const [adhocRequests, setAdhocRequests] = useState([]); // Only fetching Ad-Hoc Requests
  const [activeTab, setActiveTab] = useState(0); // Default to Ad-Hoc tab
  const [selectedDate, setSelectedDate] = useState(null); // Selected date for changing WFH request
  const [selectedRecordId, setSelectedRecordId] = useState(null); // Track which request is being changed
  const [openChangeDialog, setOpenChangeDialog] = useState(false); // Dialog visibility state
  const router = useRouter(); // Initialize the router

  // Retrieve the user data from sessionStorage
  const [user, setUser] = useState(null);
  const [staffId, setStaffId] = useState(null);

  // **Use useEffect to access window.sessionStorage on the client side**
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(window.sessionStorage.getItem("user"));
      setUser(storedUser);
      setStaffId(storedUser ? storedUser.staff_id : null);
    }
  }, []);

  // Handle the case where staffId is not available (user not logged in)
  useEffect(() => {
    if (staffId !== null) {
      fetchAdhocRequests();
    }
  }, [staffId]);

  // Fetch Ad-Hoc requests from the backend
  const fetchAdhocRequests = async () => {
    try {
      const response = await fetch(`http://localhost:4000/wfh_records`);
      const data = await response.json();

      // Filter data by staffId on the frontend and sort by requestid in descending order
      const filteredData = data
        .filter((request) => request.staffid === parseInt(staffId) && !request.recurring)
        .sort((a, b) => b.recordid - a.recordid);

      setAdhocRequests(filteredData);
    } catch (error) {
      console.error("Error fetching ad-hoc requests:", error);
    }
  };

  // Handle tab change for navigating between Ad-Hoc and Recurring Requests pages
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1) {
      router.push("/recurring_requests"); // Navigate to Recurring Requests page
    }
  };

  // Function to open the change dialog
  const handleOpenChangeDialog = (id) => {
    setSelectedRecordId(id);
    setOpenChangeDialog(true);
  };

  // Function to handle closing the change dialog
  const handleCloseChangeDialog = () => {
    setSelectedRecordId(null);
    setSelectedDate(null);
    setOpenChangeDialog(false);
  };

  // Function to handle changing WFH request
  const handleChangeRequest = async () => {
    if (!selectedDate) {
      alert("Please select a new WFH date.");
      return;
    }

    const reason = prompt("Please enter the reason for change:");
    if (!reason) {
      alert("Change reason is required.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/wfh_records/change_adhoc_wfh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordID: selectedRecordId, new_date: selectedDate, reason, staff_id: staffId }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message); // Display the message returned by the backend
        handleCloseChangeDialog(); // Close the dialog after the operation is complete
      } else {
        const result = await response.json();
        alert(`Error changing WFH request: ${result.message}`);
      }
    } catch (error) {
      console.error("Error changing WFH request:", error);
    }
  };

  // Function to handle withdrawing WFH request
  const handleWithdrawRequest = async (id, status) => {
    let reason = "";
    // Prompt for reason if status is Pending or Approved
    if (status === "Pending" || status === "Approved") {
      reason = prompt("Please enter the reason for withdrawal:");
      if (!reason) {
        alert("Withdrawal reason is required.");
        return;
      }
    }

    try {
      const response = await fetch(`http://localhost:4000/wfh_records/withdraw_wfh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordID: id, reason, staff_id: staffId }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message); // Display the message returned by the backend
        // Refresh the ad-hoc requests list after withdrawal
        setAdhocRequests((prev) => prev.filter((req) => req.recordid !== id));
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

          {/* Tabs for navigating between Ad-Hoc and Recurring Requests */}
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Ad-Hoc Requests" />
            <Tab label="Recurring Requests" />
          </Tabs>

          <AdhocRequestsTable
            requests={adhocRequests}
            onWithdraw={handleWithdrawRequest} // Pass withdraw function to table
            onChange={handleOpenChangeDialog} // Pass the function to handle change
          />
        </Paper>
      </Box>

      {/* Change Request Dialog */}
      <Dialog open={openChangeDialog} onClose={handleCloseChangeDialog}>
        <DialogTitle>Change WFH Date</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="New WFH Date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              minDate={new Date(new Date().setMonth(new Date().getMonth() - 2))} // 2 months back
              maxDate={new Date(new Date().setMonth(new Date().getMonth() + 3))} // 3 months forward
              shouldDisableDate={(date) => date.getDay() === 0 || date.getDay() === 6} // Disable weekends
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChangeDialog}>Cancel</Button>
          <Button onClick={handleChangeRequest} variant="contained" color="primary">
            Submit Change
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Component to display Ad-Hoc Requests Table with Withdraw button
function AdhocRequestsTable({ requests, onWithdraw, onChange }) {
  // Get today's date and calculate 2 weeks forward and backward
  const today = new Date();
  const twoWeeksBack = new Date();
  const twoWeeksForward = new Date();
  twoWeeksBack.setDate(today.getDate() - 14); // 2 weeks backward
  twoWeeksForward.setDate(today.getDate() + 14); // 2 weeks forward

  return (
    <TableContainer component={Paper} sx={{ marginTop: 2 }}>
      <Table sx={{ width: "100%", border: "1px solid #ccc" }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
            <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ccc" }}>Request ID</TableCell>
            <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ccc" }}>WFH Date</TableCell>
            <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ccc" }}>AM</TableCell>
            <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ccc" }}>PM</TableCell>
            <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ccc" }}>Status</TableCell>
            <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ccc" }}>Reason</TableCell>
            <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ccc" }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <TableRow key={request.recordid}>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.recordid}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{new Date(request.wfh_date).toLocaleDateString()}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.timeslot === "AM" || request.timeslot === "FD" ? "✓" : ""}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.timeslot === "PM" || request.timeslot === "FD" ? "✓" : ""}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.status}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.request_reason || "N/A"}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                  {["Pending", "Approved"].includes(request.status) && (
                    <>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => onWithdraw(request.recordid, request.status)}
                        sx={{ marginRight: 1 }}
                      >
                        Withdraw
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => onChange(request.recordid, request.status)}
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
              <TableCell colSpan={7} sx={{ textAlign: "center", border: "1px solid #ccc" }}>
                No ad-hoc requests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
