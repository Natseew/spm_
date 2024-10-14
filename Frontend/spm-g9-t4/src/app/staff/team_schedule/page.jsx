"use client"

import React, {useState, useEffect, useRef} from 'react'
import axios from 'axios';
import dayjs from 'dayjs';

export default function Page() {

  useEffect(()=>{
    fetchStaffSchedule()
  });

  const fetchStaffSchedule = async () => {
    const user = JSON.parse(window.sessionStorage.getItem("user"))
    console.log(user)
    try {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const endpoint = `http://localhost:4000/wfh_records/team-schedule/${user}/${formattedDate}`;
      const response = await axios.get(endpoint);
      setStaffData(response.data.staff_schedules || []);
    } catch (error) {
      console.error("Error fetching staff schedule:", error);
    }
  };

  return (
  <>

  </>
  )
}