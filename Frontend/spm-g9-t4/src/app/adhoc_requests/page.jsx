// export default function MyApp() {
// }

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
} from "@mui/material";
import { addMonths, subMonths } from 'date-fns';
import DatePicker from "react-datepicker";
import { useRouter } from 'next/navigation';
import 'react-datepicker/dist/react-datepicker.css';

export default function PendingRequests() {
  const [adhocRequests, setAdhocRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date()); // For WFH date selection
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [openChangeDialog, setOpenChangeDialog] = useState(false);
  const router = useRouter();

  // Retrieve user data and initialize
  const [user, setUser] = useState(null);
  const [staffId, setStaffId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(window.sessionStorage.getItem("user"));
      if (storedUser) {
        setUser(storedUser);
        setStaffId(storedUser.staff_id);
      } else {
        router.push("/");
      }
    }
  }, []);

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
      const filteredData = data
        .filter((request) => request.staffid === parseInt(staffId) && !request.recurring)
        .sort((a, b) => b.recordid - a.recordid);
      setAdhocRequests(filteredData);
    } catch (error) {
      console.error("Error fetching ad-hoc requests:", error);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1) {
      router.push("/recurring_requests");
    }
  };

  // Open dialog for changing date
  const handleOpenChangeDialog = (id) => {
    setSelectedRecordId(id);
    setOpenChangeDialog(true);
  };

  // Close dialog
  const handleCloseChangeDialog = () => {
    setSelectedRecordId(null);
    setSelectedDate(new Date());
    setOpenChangeDialog(false);
  };

  // Submit change request
const handleChangeRequest = async () => {
  if (!selectedDate) {
    alert("Please select a valid date.");
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
      body: JSON.stringify({
        recordID: selectedRecordId,
        new_wfh_date: selectedDate, // Corrected to match backend expectation
        reason,
        staff_id: staffId,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message);
      handleCloseChangeDialog();
    } else {
      const result = await response.json();
      alert(`Error changing WFH request: ${result.message}`);
    }
  } catch (error) {
    console.error("Error changing WFH request:", error);
  }
};


  // Handle withdrawing WFH request
  const handleWithdrawRequest = async (id, status) => {
    let reason = "";
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
        alert(result.message);
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

          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Ad-Hoc Requests" />
            <Tab label="Recurring Requests" />
          </Tabs>

          <AdhocRequestsTable
            requests={adhocRequests}
            onWithdraw={handleWithdrawRequest}
            onChange={handleOpenChangeDialog}
          />
        </Paper>
      </Box>

      {/* Change Request Dialog */}
      <Dialog open={openChangeDialog} onClose={handleCloseChangeDialog}>
        <DialogTitle>Change WFH Date</DialogTitle>
        <DialogContent>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            minDate={subMonths(new Date(), 2)}
            maxDate={addMonths(new Date(), 3)}
            filterDate={(date) => date.getDay() !== 0 && date.getDay() !== 6} // Disable weekends
            inline // Display the calendar inline without the input field
          />
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

function AdhocRequestsTable({ requests, onWithdraw, onChange }) {
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

