"use client"

import React, {useState, useEffect, useRef} from 'react'
import dynamic from 'next/dynamic'
// import Scheduler from "react-mui-scheduler"
import axios from 'axios';
import { uuid } from 'uuidv4';
import dayjs from 'dayjs';  // For date formatting
import Navbar from "@/components/Navbar"; // Import the Navbar component

export default function Page() {
  const [events, setEvents] = useState([]);
  const eventsRef = useRef(events)

  const Scheduler = dynamic(
    () => import('react-mui-scheduler'),
    { ssr: false }
  )

  const getStatusLabel = (scheduleStatus) => {
    switch (scheduleStatus) {
      case 'AM': return 'AM Leave';
      case 'PM': return 'PM Leave';
      case 'FD': return 'Full Day Leave';
      case 'Office':
      default: return 'In Office';
    }
  };

  useEffect(()=>{
    try {
      const fetchStaffSchedule = async () => {
        const user = JSON.parse(window.sessionStorage.getItem("user"))
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}wfh_records/${user.staff_id}`);
        console.log("Response data:", response.data);
        let eventsArray = []
        for(let item of response.data){
          let eventItem = {
            id: uuid(),
            label: getStatusLabel(item.timeslot),
            groupLabel: "WFH",
            user: "Current",
            color: "#099ce5",
            startHour: "08:00 AM",
            endHour: "06:00 PM",
            date: dayjs(item.wfh_date).format('YYYY-MM-DD'),
            createdAt: new Date(),
            createdBy: "Admin"
          }
          eventsArray.push(eventItem);
        }
        setEvents(eventsArray);
      };
      fetchStaffSchedule();
    } catch (error) {
      console.error("Error fetching staff schedule:", error);
    }
  }, [eventsRef])

  const [state] = useState({  
    options: {
      transitionMode: "zoom", // or fade
      startWeekOn: "mon",     // or sun
      defaultMode: "month",    // or week | day | timeline
      minWidth: 540,
      maxWidth: 540,
      minHeight: 540,
      maxHeight: 540
    },
    alertProps: {
      open: true,
      color: "info",          // info | success | warning | error
      severity: "info",       // info | success | warning | error
      message: "" ,
      showActionButton: true,
      showNotification: true,
      delay: 1500
    },
    toolbarProps: {
      showSearchBar: true,
      showSwitchModeButtons: true,
      showDatePicker: true
    }
  })

  return (
    <>
      <Navbar></Navbar>
      <Scheduler
        locale="en"
        events={events}
        legacyStyle={false}
        options={state?.options}
        user="Current"
        toolbarProps={state?.toolbarProps}
      />
    </>
  )
}