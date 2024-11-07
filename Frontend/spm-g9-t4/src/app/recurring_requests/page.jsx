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
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider
} from "@mui/material";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import { addMonths, subMonths, isSameDay } from 'date-fns';

export default function PendingRequests() {
  const [recurringRequests, setRecurringRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null); // Track which request details to view
  const [wfhRecords, setWfhRecords] = useState([]); // Store all WFH records
  const [filteredRecords, setFilteredRecords] = useState([]); // Store filtered WFH records
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false); // Dialog visibility state
  const [activeTab, setActiveTab] = useState(1); // Set default to Recurring Requests tab
  const [openChangeDialog, setOpenChangeDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [approvedPendingDates, setApprovedPendingDates] = useState([]);
  // const [loading, setLoading] = useState(true)
  const [change_reason, setReason] = useState('');
  const [existingDate, setExistingDate] = useState(new Date());
  const [potentialExceedingDates, setPotentialExceedingDates] = useState(new Date());
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
  }, [staffId, openChangeDialog]);

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
  }, [staffId, openChangeDialog]);



  const isDateDisabled = (date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if(approvedPendingDates && potentialExceedingDates){
      const isApprovedOrPending = approvedPendingDates.some((d) => isSameDay(d, date));
      const wouldExceedLimit = potentialExceedingDates.some((d) => isSameDay(d, date));
      return isWeekend || isApprovedOrPending || wouldExceedLimit
    }
    return isWeekend
  };

  useEffect(() => {
    // Check if staffId is set before making the request
    if (staffId !== null) {
      const fetchApprovedPendingDates = async () => {
        try {
          // setLoading(true)
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}wfh_records/approved&pending_wfh_requests/${staffId}`
          );
          if (response.ok) {
             const data = await response.json();
             const dates = data.map((record) => new Date(record.wfh_date));
             setApprovedPendingDates(dates);
            //  setLoading(false)
          } else {
              console.error("Failed to fetch approved and pending dates");
           }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
  
      fetchApprovedPendingDates();
    }
  }, [staffId, openChangeDialog]); // Only run when staffId changes

  useEffect(() => {
    const fetchPotentialExceedingDates = async () => {
      try {
        // setLoading(true)
        console.log("Staff ID: ", staffId);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}wfh_records/wfh_50%_teamrule/${staffId}`);
        if (response.ok) {
          const data = await response.json();
          const dates = data.map((dateString) => new Date(dateString));
          setPotentialExceedingDates(dates);
          // setLoading(false)
        } else {
          console.error("Failed to fetch potential exceeding WFH dates");
        }
      } catch (error) {
        console.error("Error fetching potential exceeding WFH dates:", error);
      }
    };
  
    // Fetch the potential exceeding dates whenever staffId changes
    if (staffId) {
      fetchPotentialExceedingDates();
    }
  }, [staffId, openChangeDialog]);  // Dependency array: reruns the effect when staffId changes

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

  const handleOpenChangeDialog = (id, date) => {
    setOpenChangeDialog(true);
    setExistingDate(date);
    setSelectedRecordId(id);
  };

  const handleCloseChangeDialog = () => {
    setSelectedDate(new Date());
    setOpenChangeDialog(false);
    setReason("");
    setSelectedRecordId(null);
  };


  function formatDate(dateString) {
    // Create a new Date object from the input date string
    const date = new Date(dateString);
  
    // Format the date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`; // Returns the date in YYYY-MM-DD format
  }

  function convertToDateFormat(dateString) {
    // Create a new Date object from the input date string
    const date = new Date(dateString);
  
    // Format the date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`; // Returns the date in YYYY-MM-DD format
  }

  const submitChangeDate = async (requestID, actual_wfh_date, selectedDate, change_reason) => {
    const correct_date = formatDate(actual_wfh_date);
    const formatted_selected_date = convertToDateFormat(selectedDate);
    
    console.log("RequestID:", requestID);
    console.log("Unformatted Date:", selectedDate);
    console.log("Selected Date:", formatted_selected_date);
    console.log("Actual WFH Date:", correct_date);
    console.log("Reason:", change_reason);
  
    try {
      // First, update the wfh_records table
      const wfhRecordsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}wfh_records/change/${requestID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_date: formatted_selected_date,
          // selected_date: selectedDate,
          actual_wfh_date: correct_date,
          change_reason: change_reason,
          staff_id: staffId
        }),
      });
  
      if (!wfhRecordsResponse.ok) {
        const errorData = await wfhRecordsResponse.json();
        throw new Error(`Error updating wfh_records: ${errorData.message}`);
      }
  
      const wfhRecordsData = await wfhRecordsResponse.json();
      console.log(wfhRecordsData.message);
  
      // Then, update the recurring_request table
      const recurringRequestResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}recurring_request/change/${requestID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_date: formatted_selected_date,
          // selected_date: selectedDate,
          actual_wfh_date: correct_date,
          change_reason: change_reason,
          staff_id: staffId
        }),
      });
  
      if (!recurringRequestResponse.ok) {
        const errorData = await recurringRequestResponse.json();
        throw new Error(`Error updating recurring_request: ${errorData.message}`);
      }
  
      const recurringRequestData = await recurringRequestResponse.json();
      alert(recurringRequestData.message);
  
      // setSelectedDate(new Date(formatted_selected_date)); // Update selected date
      setSelectedDate(new Date(selectedDate)); // Update selected date
      handleCloseChangeDialog();  // Close the modal
      handleCloseDetailsDialog();
  
    } catch (error) {
      console.error('Error submitting change date:', error);
      // Handle the error (e.g., display a message to the user)
    }
  };
  

  // Function to handle withdrawn date
  const handleWithdrawDate = async (recordId, date) => {
    // Create a new Date object and adjust to local time, then format as `YYYY-MM-DD`
    const localDate = new Date(date);
    const formattedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    console.log("Formatted local date to withdraw:", formattedDate); 
  
    const reason = prompt("Please enter the reason for withdrawal:");
    if (!reason) {
      alert("Withdrawal reason is required.");
      return;
    }
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}recurring_request/withdraw_recurring_wfh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestID: recordId,
          wfhDate: formattedDate, // Use the correctly formatted local date
          reason: reason,
          staff_id: staffId
        }),
      });
  
      if (response.ok) {
        const result = await response.json();
        // Refresh page after a successful change
        alert(result.message); // Display success message
        window.location.reload() // Force full page reload after successful withdrawal
        

      } else {
        const result = await response.json();
        alert(`Error withdrawing WFH request: ${result.message}`);
      }
    } catch (error) {
      console.error("Error withdrawing WFH request:", error);
      alert("An error occurred while withdrawing the request.");
    }
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


  const shouldShowChangeButton = (status, date) => {
    return (status === "Approved" || status === "Pending") && isDateWithinTwoWeeks(date);
  };
  
  const shouldShowWithdrawButton = (status, date) => {
    return (status === "Pending") || (status === "Approved" && isDateWithinTwoWeeks(date));
  };
  

  // Function to handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      router.push("/adhoc_requests"); // Navigate to Ad-Hoc Requests page
    }
  };

  // function DatePickerLoaded(){
  //   if(loading){
  //     return <>Loading</>
  //   }else{
  //     return(
  //       <Dialog open={openChangeDialog} 
  //         onClose={handleCloseChangeDialog}
  //         >
  //         <DialogTitle>Change WFH Date</DialogTitle>
  //         <DialogContent>
  //           <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
  //             <DatePicker
                
  //               onChange={(date) => setSelectedDate(date)}
  //               minDate={subMonths(new Date(), 2)}
  //               maxDate={addMonths(new Date(), 3)}
  //               filterDate={(date) => !isDateDisabled(date)} // Disable weekends and specific dates
  //               inline
  //             />
  //             <Divider sx={{ margin: "16px 0" }} /> {/* Add margin for spacing */}
  //             <Typography variant="subtitle1">Reason for Changing</Typography>
  //             <TextField
  //               label="Reason"
  //               value={change_reason}
  //               onChange={(e) => setReason(e.target.value)}
  //               fullWidth
  //               multiline
  //               rows={4}
  //               margin="normal"
  //               required
  //             />
  //           </Box>
  //         </DialogContent>
  //         <DialogActions>
  //           <Button onClick={handleCloseChangeDialog}>Cancel</Button>
  //           <Button onClick={() => submitChangeDate(selectedRecordId, existingDate, selectedDate, change_reason)} variant="contained" color="primary">
  //             Submit Change
  //           </Button>
  //         </DialogActions>
  //       </Dialog>
  //     );
  //   }
  // }

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
                        {shouldShowWithdrawButton(record.status, record.wfh_date) && (
                          <>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleWithdrawDate(record.requestid, record.wfh_date)}
                            >
                              Withdraw
                            </Button>
                          
                            {/* Change Button */}
                            {shouldShowChangeButton(record.status, record.wfh_date) && (
                            <Button
                              variant="outlined"
                              color="primary"
                              sx={{ marginLeft: 1 }}
                              onClick={() => handleOpenChangeDialog(record.requestid, record.wfh_date)}
                            >
                              Change
                            </Button>
                            )}
                              {/* Change Request Dialog */}
                              {/* <DatePickerLoaded></DatePickerLoaded> */}
                              <Dialog open={openChangeDialog} 
                              onClose={handleCloseChangeDialog}
                              >
                              <DialogTitle>Change WFH Date</DialogTitle>
                              <DialogContent>
                                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                                  <DatePicker
                                    
                                    onChange={(date) => setSelectedDate(date)}
                                    minDate={subMonths(new Date(), 2)}
                                    maxDate={addMonths(new Date(), 3)}
                                    filterDate={(date) => !isDateDisabled(date)} // Disable weekends and specific dates
                                    inline
                                  />
                                  <Divider sx={{ margin: "16px 0" }} /> {/* Add margin for spacing */}
                                  <Typography variant="subtitle1">Reason for Changing</Typography>
                                  <TextField
                                    label="Reason"
                                    value={change_reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    margin="normal"
                                    required
                                  />
                                </Box>
                              </DialogContent>
                              <DialogActions>
                                <Button onClick={handleCloseChangeDialog}>Cancel</Button>
                                <Button onClick={() => submitChangeDate(selectedRecordId, existingDate, selectedDate, change_reason)} variant="contained" color="primary">
                                  Submit Change
                                </Button>
                              </DialogActions>
                            </Dialog>
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
function RecurringRequestsTable({ requests, onViewDetails}) {
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
