"use client"

import { LineAxisOutlined } from '@mui/icons-material'
import React, {useState} from 'react'
import ReactDOM from 'react-dom'
import Scheduler from "react-mui-scheduler"

export default function Page() {

  <Suspense fallback={<p>Loading feed...</p>}>
    let data = await fetch('localhost:4000/employee/140894', { cache: 'force-cache' | 'no-store' })
  </Suspense>
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
  
  const events = [
    {
      id: "WFH-1",
      label: "WFH",
      groupLabel: "WFH",
      user: "Dr Shaun Murphy",
      color: "#099ce5",
      startHour: "04:00 AM",
      endHour: "05:00 AM",
      date: "2022-05-05",
      createdAt: new Date(),
      createdBy: "Kristina Mayer"
    },
    {
      id: "WFH-2",
      label: "WFH",
      groupLabel: "WFH",
      user: "Dr Shaun Murphy",
      color: "#099ce5",
      startHour: "09:00 AM",
      endHour: "10:00 AM",
      date: "2022-05-09",
      createdAt: new Date(),
      createdBy: "Kristina Mayer"
    },
    {
      id: "event-3",
      label: "Medical consultation",
      groupLabel: "Dr Menlendez Hary",
      user: "Dr Menlendez Hary",
      color: "#263686",
      startHour: "13 PM",
      endHour: "14 PM",
      date: "2022-05-10",
      createdAt: new Date(),
      createdBy: "Kristina Mayer"
    },
    {
      id: "event-4",
      label: "Consultation",
      groupLabel: "Dr Shaun Murphy",
      user: "Dr Shaun Murphy",
      color: "#f28f6a",
      startHour: "08:00 AM",
      endHour: "09:00 AM",
      date: "2022-05-11",
      createdAt: new Date(),
      createdBy: "Kristina Mayer"
    }
  ]
  
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
  
  return (
    <Scheduler
      locale="en"
      events={events}
      legacyStyle={false}
      options={state?.options}
      user = {"Dr Shaun Murphy"}
      // alertProps={state?.alertProps}
      toolbarProps={state?.toolbarProps}
      onEventsChange={handleEventsChange}
      onCellClick={handleCellClick}
      onTaskClick={handleEventClick}
      onAlertCloseButtonClicked={handleAlertCloseButtonClicked}
    />
  )

  ReactDOM.render(<App />, document.querySelector('#yourComponentRootId'))
}