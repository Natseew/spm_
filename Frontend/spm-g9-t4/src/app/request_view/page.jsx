// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Typography,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Tabs,
//   Tab,
//   Button,
//   Box,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   TextField,
// } from "@mui/material";
// import { DatePicker } from "@mui/x-date-pickers";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import { useRouter } from 'next/navigation'; 

// export default function PendingRequests() {
//   const [adhocRequests, setAdhocRequests] = useState([]);
//   const [recurringRequests, setRecurringRequests] = useState([]);
//   const [activeTab, setActiveTab] = useState(0); // To switch between tabs
//   const [selectedDate, setSelectedDate] = useState(null); // Selected date for changing WFH request
//   const [selectedRecordId, setSelectedRecordId] = useState(null); // Track which request is being changed
//   const [openChangeDialog, setOpenChangeDialog] = useState(false); // Dialog visibility state
//   // const staffId = "140001"; // Replace with dynamic staff ID 
//   const router = useRouter(); // Initialize the router

//   // Retrieve the user data from sessionStorage
//   const [user, setUser] = useState(null);
//   const [staffId, setStaffId] = useState(null);

//    // **Use useEffect to access window.sessionStorage on the client side**
//    useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedUser = JSON.parse(window.sessionStorage.getItem("user"));
//       setUser(storedUser);
//       setStaffId(storedUser ? storedUser.staff_id : null);
//       console.log("User data:", storedUser);
//       console.log(storedUser.staff_id);
//     }
//   }, []);
  
//   //Handle the case where staffId is not available (user not logged in)
//   useEffect(() => {
//     if (staffId !== null) {
//       console.log("Updated staffId:", staffId);
//     }
//   }, [staffId]);


//   // Fetch ad-hoc requests from the backend
//   useEffect(() => {
//     const fetchAdhocRequests = async () => {
//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}wfh_records`);
//         const data = await response.json();

//         // Filter data by staffId on the frontend and sort by requestid in descending order
//         const filteredData = data
//           .filter((request) => request.staffid === parseInt(staffId) && !request.recurring)
//           .sort((a, b) => b.recordid - a.recordid);

//         setAdhocRequests(filteredData);
//       } catch (error) {
//         console.error("Error fetching ad-hoc requests:", error);
//       }
//     };

//     fetchAdhocRequests();
//   }, [staffId]);


//   // Testing  
//   // Fetch recurring requests from the endpoint and filter by staff_id
//   useEffect(() => {
//     const fetchRecurringRequests = async () => {
//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}recurring_request`);
//         const data = await response.json();

//         // Corrected filtering logic using 'staff_id' and sort by requestid in descending order
//         const filteredData = data
//           .filter((request) => request.staff_id === parseInt(staffId))
//           .sort((a, b) => b.requestid - a.requestid);

//         setRecurringRequests(filteredData);
//       } catch (error) {
//         console.error("Error fetching recurring requests:", error);
//       }
//     };

//     fetchRecurringRequests();
//   }, [staffId]);

//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue);
//   };

//   // Function to handle withdrawing WFH request
//   const handleWithdrawRequest = async (id, status, isRecurring) => {
//     if (isRecurring) {
//       alert("Withdrawal of recurring requests is not implemented yet.");
//       return;
//     }

//     let reason = "";

//     // Prompt for reason if status is Pending or Approved
//     if (status === "Pending" || status === "Approved") {
//       reason = prompt("Please enter the reason for withdrawal:");
//       if (!reason) {
//         alert("Withdrawal reason is required.");
//         return;
//       }
//     }

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}wfh_records/withdraw_wfh`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ recordID: id, reason, staff_id: staffId }), // Include the reason in the request body
//       });

//       if (response.ok) {
//         const result = await response.json();
//         alert(result.message); // Display the message returned by the backend
//         // Refresh the ad-hoc requests list after withdrawal
//         setAdhocRequests((prev) => prev.filter((req) => req.recordid !== id));
//       } else {
//         const result = await response.json();
//         alert(`Error withdrawing WFH request: ${result.message}`);
//       }
//     } catch (error) {
//       console.error("Error withdrawing WFH request:", error);
//     }
//   };

//   // Function to open the change dialog
//   const handleOpenChangeDialog = (id, status) => {
//     setSelectedRecordId(id);
//     setOpenChangeDialog(true);
//   };

//   // Function to handle closing the change dialog
//   const handleCloseChangeDialog = () => {
//     setSelectedRecordId(null);
//     setSelectedDate(null);
//     setOpenChangeDialog(false);
//   };

//   // Function to handle changing WFH request
//   const handleChangeRequest = async () => {
//     let reason = "";

//     if (!selectedDate) {
//       alert("Please select a new WFH date.");
//       return;
//     }

//     if (selectedRecordId) {
//       reason = prompt("Please enter the reason for change:");
//       if (!reason) {
//         alert("Change reason is required.");
//         return;
//       }

//       try {
//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}wfh_records/change_adhoc_wfh`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ recordID: selectedRecordId, new_date: selectedDate, reason,staff_id: staffId  }),
//         });

//         if (response.ok) {
//           const result = await response.json();
//           alert(result.message); // Display the message returned by the backend
//           handleCloseChangeDialog(); // Close the dialog after the operation is complete
//         } else {
//           const result = await response.json();
//           alert(`Error changing WFH request: ${result.message}`);
//         }
//       } catch (error) {
//         console.error("Error changing WFH request:", error);
//       }
//     }
//   };

//   return (
//     <>
//       <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
//         <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: "100%" }}>
//           <Typography variant="h6" gutterBottom textAlign="center">
//             Staff ID: {staffId}
//           </Typography>

//           <Tabs value={activeTab} onChange={handleTabChange} centered>
//             <Tab label="Ad-Hoc Requests" />
//             <Tab label="Recurring Requests" />
//           </Tabs>

//           {activeTab === 0 ? (
//             <AdhocRequestsTable
//               requests={adhocRequests}
//               onWithdraw={handleWithdrawRequest}
//               onChange={handleOpenChangeDialog} // Pass the function to handle change
//             />
//           ) : (
//             <RecurringRequestsTable
//               requests={recurringRequests}
//               onWithdraw={handleWithdrawRequest}
//               onChange={handleOpenChangeDialog} // Pass the function to handle change
//             />
//           )}
//         </Paper>
//       </Box>

//       {/* Change Request Dialog */}
//       <Dialog open={openChangeDialog} onClose={handleCloseChangeDialog}>
//         <DialogTitle>Change WFH Date</DialogTitle>
//         <DialogContent>
//           <LocalizationProvider dateAdapter={AdapterDateFns}>
//             <DatePicker
//               label="New WFH Date"
//               value={selectedDate}
//               onChange={(newValue) => setSelectedDate(newValue)}
//               minDate={new Date(new Date().setMonth(new Date().getMonth() - 2))} // 2 months back
//               maxDate={new Date(new Date().setMonth(new Date().getMonth() + 3))} // 3 months forward
//               shouldDisableDate={(date) => {
//                 // Disable weekends (Saturday and Sunday)
//                 const day = date.getDay();
//                 return day === 0 || day === 6;
//               }}
//               renderInput={(params) => <TextField {...params} fullWidth />}
//             />
//           </LocalizationProvider>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseChangeDialog}>Cancel</Button>
//           <Button onClick={handleChangeRequest} variant="contained" color="primary">
//             Submit Change
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   );
// }


// // Component to display Ad-Hoc Requests Table
// function AdhocRequestsTable({ requests, onWithdraw, onChange }) {
//   // Get today's date and calculate 2 weeks forward and backward
//   const today = new Date();
//   const twoWeeksBack = new Date();
//   const twoWeeksForward = new Date();
//   twoWeeksBack.setDate(today.getDate() - 14);  // 2 weeks backward
//   twoWeeksForward.setDate(today.getDate() + 14);  // 2 weeks forward
  

//   return (
//     <TableContainer component={Paper} sx={{ marginTop: 2 }}>
//       <Table sx={{ width: "100%", border: "1px solid #ccc" }}>
//         <TableHead>
//           <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Request ID</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>WFH Date</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>AM</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>PM</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Status</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Reason</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Actions</TableCell>
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {requests.length > 0 ? (
//             requests.map((request) => {
//               const wfhDate = new Date(request.wfh_date); // Convert the WFH date to a Date object
//               const isWithinTwoWeeks =
//                 wfhDate >= twoWeeksBack && wfhDate <= twoWeeksForward; // Check if WFH date is within 2 weeks

//               return (
//                 <TableRow key={request.recordid}>
//                   <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.recordid}</TableCell>
//                   <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.wfh_date ? new Date(request.wfh_date).toLocaleDateString() : "N/A"}</TableCell>
//                   <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.timeslot === "AM" || request.timeslot === "FD" ? "✓" : ""}</TableCell>
//                   <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.timeslot === "PM" || request.timeslot === "FD" ? "✓" : ""}</TableCell>
//                   <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.status || "N/A"}</TableCell>
//                   <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.request_reason || "N/A"}</TableCell>
//                   <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
//                     {["Pending", "Approved"].includes(request.status) && isWithinTwoWeeks && (
//                       <>
//                         <Button
//                           variant="outlined"
//                           color="error"
//                           onClick={() => onWithdraw(request.recordid, request.status, false)}
//                           sx={{ marginRight: 1 }}
//                         >
//                           Withdraw
//                         </Button>
//                         <Button
//                           variant="outlined"
//                           color="primary"
//                           onClick={() => onChange(request.recordid, request.status)}
//                         >
//                           Change
//                         </Button>
//                       </>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               );
//             })
//           ) : (
//             <TableRow>
//               <TableCell colSpan={7} sx={{ textAlign: "center" }}>
//                 <Typography>No ad-hoc requests found.</Typography>
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );
// }


// // Component to display Recurring Requests Table (Similar structure, with few differences)
// function RecurringRequestsTable({ requests, onWithdraw, onChange }) {
//   const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

//   return (
//     <TableContainer component={Paper} sx={{ marginTop: 2 }}>
//       <Table sx={{ width: "100%", border: "1px solid #ccc" }}>
//         <TableHead>
//           <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Request ID</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Start Date</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>End Date</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Day of Week</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>AM</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>PM</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Status</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Reason</TableCell>
//             <TableCell sx={{ backgroundColor: "#e0e0e0", fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Actions</TableCell>
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {requests.length > 0 ? (
//             requests.map((request) => (
//               <TableRow key={request.requestid}>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.requestid}</TableCell>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.start_date ? new Date(request.start_date).toLocaleDateString() : "N/A"}</TableCell>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.end_date ? new Date(request.end_date).toLocaleDateString() : "N/A"}</TableCell>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{daysOfWeek[request.day_of_week - 1] || "N/A"}</TableCell>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.timeslot === "AM" || request.timeslot === "FD" ? "✓" : ""}</TableCell>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.timeslot === "PM" || request.timeslot === "FD" ? "✓" : ""}</TableCell>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.status || "N/A"}</TableCell>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{request.request_reason || "N/A"}</TableCell>
//                 <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
//                   {["Pending", "Approved"].includes(request.status) && (
//                     <>
//                       <Button
//                         variant="outlined"
//                         color="error"
//                         onClick={() => onWithdraw(request.requestid, request.status, true)}
//                         sx={{ marginRight: 1 }}
//                       >
//                         Withdraw
//                       </Button>
//                       <Button
//                         variant="outlined"
//                         color="primary"
//                         onClick={() => onChange(request.requestid, request.status)}
//                       >
//                         Change
//                       </Button>
//                     </>
//                   )}
//                 </TableCell>
//               </TableRow>
//             ))
//           ) : (
//             <TableRow>
//               <TableCell colSpan={9} sx={{ textAlign: "center" }}>
//                 <Typography>No recurring requests found.</Typography>
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );
// }
