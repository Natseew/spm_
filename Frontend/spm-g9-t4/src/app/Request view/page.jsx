"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';

const WFHRequestTable = ({ wfhRequests }) => (
  <Table sx={{ marginTop: '20px' }}>
    <TableHead>
      <TableRow>
        <TableCell>Date</TableCell>
        <TableCell>AM Requested</TableCell>
        <TableCell>PM Requested</TableCell>
        <TableCell>Approval Status</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {wfhRequests.length > 0 ? (
        wfhRequests.map((request) => (
          <TableRow key={request.sched_date}>
            <TableCell>{dayjs(request.sched_date).format('YYYY-MM-DD')}</TableCell>
            <TableCell>{request.am ? 'Yes' : 'No'}</TableCell>
            <TableCell>{request.pm ? 'Yes' : 'No'}</TableCell>
            <TableCell>{request.approved ? 'Approved' : request.rejected ? 'Rejected' : 'Pending'}</TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={4} align="center">No WFH requests found.</TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);

const WFHRequestsPage = () => {
  const [wfhRequests, setWfhRequests] = useState([]);
  const employeeId = 140001;

  useEffect(() => {
    const fetchWFHRequests = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/wfh_requests/${employeeId}`);
        setWfhRequests(response.data);
        console.log(response.data)
      } catch (error) {
        console.error("Error fetching WFH requests:", error);
      }
    };

    fetchWFHRequests();
  }, [employeeId]);

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Your WFH Requests</Typography>
      <Paper elevation={3} sx={{ padding: '20px' }}>
        <WFHRequestTable wfhRequests={wfhRequests} />
      </Paper>
    </Box>
  );
};

export default WFHRequestsPage;


