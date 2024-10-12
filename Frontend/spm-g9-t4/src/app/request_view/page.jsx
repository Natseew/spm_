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
} from "@mui/material";

export default function PendingRequests() {
  const [adhocRequests, setAdhocRequests] = useState([]);
  const [recurringRequests, setRecurringRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // To switch between tabs

  // Hardcoded staffId
  const staffId = "140001"; // Hardcoded staff ID

  // Fetch requests from the backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`http://localhost:4000/wfh_requests/${staffId}`); // Fetch requests by staffId only
        const data = await response.json();

        // Separate ad-hoc and recurring requests based on request_type
        const adhoc = data.filter(request => request.request_type === "adhoc"); // filter by request_type for ad-hoc requests
        const recurring = data.filter(request => request.request_type === "recurring"); // filter by request_type for recurring requests

        setAdhocRequests(adhoc);
        setRecurringRequests(recurring);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleWithdraw = async (req_id) => {
    try {
      const response = await fetch(`http://localhost:4000/withdraw_wfh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ req_id }), // Sending request ID to withdraw
      });
      if (response.ok) {
        console.log('Request withdrawn successfully');
        // Optionally, refresh the requests here after a successful withdrawal
      }
    } catch (error) {
      console.error('Error withdrawing request:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        WFH Requests for Employee ID: {staffId}
      </Typography>

      {/* Tab Header */}
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Ad-Hoc Requests" />
        <Tab label="Recurring Requests" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 ? (
        <AdhocRequestsTable requests={adhocRequests} onWithdraw={handleWithdraw} />
      ) : (
        <RecurringRequestsTable requests={recurringRequests} onWithdraw={handleWithdraw} />
      )}
    </Paper>
  );
}

// Component to display Ad-Hoc Requests Table
function AdhocRequestsTable({ requests, onWithdraw }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>WFH Date</TableCell>
            <TableCell>Timeslot</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell> {/* New Action column */}
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(request.sched_date).toLocaleDateString() || "N/A"}</TableCell>
                <TableCell>{request.timeslot || "N/A"}</TableCell>
                <TableCell>{request.reason || "N/A"}</TableCell>
                <TableCell>{request.status || "N/A"}</TableCell>
                <TableCell>
                  {request.status !== "Rejected" && (
                    <button
                      onClick={() => onWithdraw(request.req_id)} // Pass req_id to withdraw
                      style={{
                        border: '2px solid red',
                        backgroundColor: 'white',
                        color: 'red',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                    >
                      Withdraw
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography>No ad-hoc requests found.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Component to display Recurring Requests Table
function RecurringRequestsTable({ requests, onWithdraw }) {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Day of Week</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Status</TableCell> {/* New Status column */}
            <TableCell>Action</TableCell> {/* New Action column */}
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(request.start_date).toLocaleDateString() || "N/A"}</TableCell>
                <TableCell>{new Date(request.end_date).toLocaleDateString() || "N/A"}</TableCell>
                <TableCell>{daysOfWeek[request.day_of_week] || "N/A"}</TableCell>
                <TableCell>{request.reason || "N/A"}</TableCell>
                <TableCell>{request.status || "N/A"}</TableCell> {/* Populate status */}
                <TableCell>
                  {request.status !== "Rejected" && (
                    <button
                      onClick={() => onWithdraw(request.req_id)} // Pass req_id to withdraw
                      style={{
                        border: '2px solid red',
                        backgroundColor: 'white',
                        color: 'red',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                    >
                      Withdraw
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography>No recurring requests found.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
