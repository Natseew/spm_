"use client"

import { LineAxisOutlined } from '@mui/icons-material'
import React, {useState, useEffect, useRef} from 'react'
import ReactDOM from 'react-dom'
import Scheduler from "react-mui-scheduler"
import axios from 'axios';
import { uuid } from 'uuidv4';
import dayjs from 'dayjs';  // For date formatting

export default function Page() {
  const [events, setEvents] = useState([
    //   {
  //     id: "WFH-1",
  //     label: "WFH",
  //     groupLabel: "WFH",
  //     user: "Dr Shaun Murphy",
  //     color: "#099ce5",
  //     startHour: "04:00 AM",
  //     endHour: "05:00 AM",
  //     date: "2022-05-05",
  //     createdAt: new Date(),
  //     createdBy: "Kristina Mayer"
  //   }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const eventsRef = useRef(events)

  useEffect(()=>{
    try {
      const fetchStaffSchedule = async () => {
        const response = await axios.get(`http://localhost:4000/wfh_records/140918`);
        console.log("Response data:", response.data);
        let eventsArray = []
        for(let item of response.data){
          let eventItem = {
            id: uuid(),
            label: "WFH",
            groupLabel: "WFH",
            user: "Current",
            color: "#099ce5",
            startHour: "08:00 AM",
            endHour: "06:00 PM",
            date: dayjs(item.sched_date).format('YYYY-MM-DD'),
            createdAt: new Date(),
            createdBy: "Admin"
          }
          eventsArray.push(eventItem);
        }
        setEvents(eventsArray);
        setIsLoading(false);
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
  
  const handleCellClick = (event, row, day) => {
    // Do something...
  }
  
  const handleEventClick = (event, item) => {
    // Do something...
  }
  
  const handleEventsChange = (item) => {
    // Do something...
  }
  
  const handleAlertCloseButtonClicked = (item) => {
    // Do something...
  }
  // if (isLoading){
  //   return(
  //     <div>Loading</div>
  //   )
  // }
  
  return (
    <Scheduler
      locale="en"
      events={events}
      legacyStyle={false}
      options={state?.options}
      user="Current"
      toolbarProps={state?.toolbarProps}
      onEventsChange={handleEventsChange}
      onCellClick={handleCellClick}
      onTaskClick={handleEventClick}
      onAlertCloseButtonClicked={handleAlertCloseButtonClicked}
    />
  )
}