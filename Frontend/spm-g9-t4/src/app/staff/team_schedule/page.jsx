"use client"

import React, {useState, useEffect, useRef} from 'react'
import { Box, Paper} from '@mui/material';
import { BounceLoader } from 'react-spinners';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import axios from 'axios';
import dayjs from 'dayjs';
import { DataGrid } from '@mui/x-data-grid';

export default function Page() {
const [staffData, setStaffData] = useState([]);
const [dateRange, setDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetchStaffSchedule()
  },[dateRange]);

  const fetchStaffSchedule = async () => {
    setLoading(true)
    const user = JSON.parse(window.sessionStorage.getItem("user"))
    try {
      const formattedStartDate = dayjs(dateRange[0].startDate).format('YYYY-MM-DD');
      const formattedEndDate = dayjs(dateRange[0].endDate).format('YYYY-MM-DD');
      console.log(formattedStartDate, formattedEndDate)
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}wfh_records/team-schedule-v2/${user.reporting_manager}/${formattedStartDate}/${formattedEndDate}`;
      const response = await axios.get(endpoint);
      console.log(response.data)
      setStaffData(response.data.staff_schedules || []);
      setLoading(false)
    } catch (error) {
      console.error("Error fetching staff schedule:", error);
    }
  };

  const paginationModel = { page: 0, pageSize: 10 };

  const getStatusLabel = (scheduleStatus) => {
    switch (scheduleStatus) {
      case 'AM': return 'AM Leave';
      case 'PM': return 'PM Leave';
      case 'Full-Day': return 'Full Day Leave';
      case 'Office':
      default: return 'In Office';
    }
  };

  const columns = [
    // { field: 'staff_id', headerName: 'Staff ID', width: 70 },
    {
      field: 'wfh_date',
      headerName: 'WFH Date',
      width: 160,
      valueGetter: (value, row) => `${dayjs(row.wfh_date).format('DD MMM YYYY')}`,
    },
    {
      field: 'fullName',
      headerName: 'Full name',
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 160,
      valueGetter: (value, row) => `${row.staff_fname || ''} ${row.staff_lname|| ''}`,
    },
    {
      field:'dept',
      headerName: "Department",
      width: 160
    },
    {
      field:'schedule_status',
      headerName: "Status",
      width: 160,
      valueGetter: (value, row) => `${getStatusLabel(row.schedule_status)}`
    }

  ];

  const rows = [
    { id: 1, lastName: 'Snow', firstName: 'Jon', date:"12", age: 35 },
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
    { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
    { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
  ];
  function StaffListTable({ staffData }){
    if(loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <BounceLoader color="#00BFFF" loading={loading} size={150} />
        </div>
      );
    }else{
      return(
      <DataGrid
        getRowId={(row) => row.staff_id+row.wfh_date}
        rows={staffData}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[10, 20, 30]}
        sx={{ border: 0 }}
      />)
    }
  };

  

  return (
  <>
    <Paper elevation={3} sx={{ padding: '20px', marginBottom: '20px'}}>
      <Box sx={{ marginBottom: '20px', width: '200px' }}>
        <DateRange
          ranges={dateRange}
          onChange={(ranges) => setDateRange([ranges.selection])}
        />
      </Box>
      <StaffListTable staffData={staffData} />
    </Paper>
  </>
  )
}