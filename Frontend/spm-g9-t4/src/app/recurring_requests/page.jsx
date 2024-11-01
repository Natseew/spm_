"use client";

import React, { useState, useEffect } from "react";
import Navbar from '../../components/Navbar';
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
} from "@mui/material";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function PendingRequests() {
  const [recurringRequests, setRecurringRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null); // Track which request details to view
  const [wfhRecords, setWfhRecords] = useState([]); // Store all WFH records
  const [filteredRecords, setFilteredRecords] = useState([]); // Store filtered WFH records
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false); // Dialog visibility state
  const [activeTab, setActiveTab] = useState(1); // Set default to Recurring Requests tab
  const router = useRouter(); // Initialize the router

  // Retrieve the user data from sessionStorage

  const [staffId, setStaffId] = useState(null);

  // Use useEffect to access window.sessionStorage on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(window.sessionStorage.getItem("user"));
      if (storedUser) {
        
        setStaffId(storedUser.staff_id);
      } else {
        router.push("/"); // Navigate to login if not logged in
      }
    }
  }, []);
  

  // Fetch recurring requests from the backend
  useEffect(() => {
    const fetchRecurringRequests = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}recurring_request`);
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

  // Fetch all WFH records from the backend
  useEffect(() => {
    const fetchWfhRecords = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}wfh_records/`);
        const data = await response.json();
        setWfhRecords(data); // Store all records
      } catch (error) {
        console.error("Error fetching WFH records:", error);
      }
    };

    fetchWfhRecords();
  }, []);

  // Function to handle opening the details dialog for a request
  const handleOpenDetailsDialog = (request) => {
    setSelectedRequest(request);

    // Filter the WFH records based on the requestId
    const filtered = wfhRecords.filter((record) => record.requestid === request.requestid);
    setFilteredRecords(filtered); // Store the filtered records

    setOpenDetailsDialog(true);
  };

  // Function to handle closing the details dialog
  const handleCloseDetailsDialog = () => {
    setSelectedRequest(null);
    setFilteredRecords([]); // Clear the filtered records
    setOpenDetailsDialog(false);
  };

  // Function to handle withdrawn date
  const handleWithdrawDate = async (recordId, date) => {
    const reason = prompt("Please enter the reason for withdrawal:");

    if (!reason) {
      alert("Withdrawal reason is required.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}wfh_records/withdraw_recurring_request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: recordId, // The specific record ID for the WFH request
          date: date, // The specific date for withdrawal
          reason: reason, // The reason entered by the user
          staff_id: staffId, // The staff ID of the user withdrawing the request
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message); // Display success message
      } else {
        const result = await response.json();
        alert(`Error withdrawing WFH request: ${result.message}`);
      }
    } catch (error) {
      console.error("Error withdrawing WFH request:", error);
      alert("An error occurred while withdrawing the request.");
    }
  };

  const handleChangeDate = (recordId, date) => {
    // Handle the change logic for a specific WFH date
    console.log("Change Date:", recordId, date);
  };

  const isDateWithinTwoWeeks = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    const twoWeeksBack = new Date(today);
    twoWeeksBack.setDate(today.getDate() - 14);
    const twoWeeksForward = new Date(today);
    twoWeeksForward.setDate(today.getDate() + 14);

    return targetDate >= twoWeeksBack && targetDate <= twoWeeksForward;
  };

  const isStatusValidForAction = (status) => {
    return status === "Pending" || status === "Approved";
  };

  // Function to handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      router.push("/adhoc_requests"); // Navigate to Ad-Hoc Requests page
    }
  };

  return (
    <>
     <Navbar /> {/* Added Navbar here */}
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

          <RecurringRequestsTable requests={recurringRequests} onViewDetails={handleOpenDetailsDialog} />
        </Paper>
      </Box>

      {/* View Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog}>
        <DialogTitle>View WFH Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>WFH Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(record.wfh_date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>
                        {isDateWithinTwoWeeks(record.wfh_date) && isStatusValidForAction(record.status) && (
                          <>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleWithdrawDate(record.requestid, record.wfh_date)}
                            >
                              Withdraw
                            </Button>
                            <Button
                              variant="outlined"
                              color="primary"
                              sx={{ marginLeft: 1 }}
                              onClick={() => handleChangeDate(record.requestid, record.wfh_date)}
                            >
                              Change
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No details available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Component to display Recurring Requests Table
function RecurringRequestsTable({ requests, onViewDetails }) {
  return (
    <TableContainer component={Paper} sx={{ marginTop: 2 }}>
      <Table sx={{ width: "100%", border: "1px solid #ccc" }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
            <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>
              Request ID
            </TableCell>
            <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>
              Start Date
            </TableCell>
            <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>
              End Date
            </TableCell>
            <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>
              Day of Week
            </TableCell>
            <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>
              Timeslot
            </TableCell>
            <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>
              Status
            </TableCell>
            <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>
              Reason
            </TableCell>
            <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <TableRow key={request.requestid}>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.requestid}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                  {request.start_date ? new Date(request.start_date).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                  {request.end_date ? new Date(request.end_date).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][request.day_of_week - 1]}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                  {request.timeslot === "FD" ? "Full Day" : request.timeslot}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.status}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.request_reason || "N/A"}</TableCell>
                <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                  <Button variant="outlined" color="primary" onClick={() => onViewDetails(request)}>
                    View Details
                  </Button>
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
