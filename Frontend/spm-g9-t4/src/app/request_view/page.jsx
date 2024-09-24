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
} from "@mui/material";

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);

  // Hardcoded staffId and status
  const staffId = "140001"; // Hardcoded staff ID
  const status = "Pending"; // Hardcoded status

  // Fetch requests from the backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`http://localhost:4000/wfh_requests/${staffId}/${status}`);
        const data = await response.json();
        console.log("Data received from backend:", data); // Log the data to check its structure
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, []);

  return (
    <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        WFH Requests for Employee ID: {staffId} 
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>WFH Date</TableCell>
              <TableCell>Timeslot</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request, index) => (
                <TableRow key={request.change_id || index}>
                  <TableCell>{new Date(request.sched_date).toLocaleDateString() || "N/A"}</TableCell>
                  <TableCell>{request.timeslot || "N/A"}</TableCell>
                  <TableCell>{request.reason || "N/A"}</TableCell>
                  <TableCell>{request.status || "N/A"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography>No requests found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
