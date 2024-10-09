// Mark this component as a Client Component
"use client";

import CalendarComponent from "@/components/CalendarComponent";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// import ManagerAdhocComponent from "@/components/ManagerAdhocComponent";
// import ManagerRecurringComponent from "@/components/ManagerRecurringComponent";
import ToggleView from "@/components/ToggleViewComponent";
import ManagerViewComponent from "@/components/ManagerViewComponent";

export default function managerview() {
    const [selectedDate, setSelectedDate] = useState(""); // State to track the selected date
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [dayOfWeek, setDayOfWeek] = useState("");
    

    function getDayName(date) {
    if (isNaN(date.getTime())) {
      return 'Invalid Date'; // Handle invalid date scenario
    }

    const options = { weekday: 'long' };
    return date.toLocaleDateString(undefined, options); // Example result: 'Monday'
    }

    // Function to handle date selection change
    const handleDateChange = (event) => {
        setSelectedDate(event.target.value); // Update state with selected date
    };

    // Function to handle department selection change
    const handleDepartmentChange = (event) => {
        setSelectedDepartment(event.target.value);
    };

    // Effect to update the day of week when the selected date changes
    useEffect(() => {
        if (selectedDate) {
            const [day, month, year] = selectedDate.split('/').map(Number);
            const dateObject = new Date(year, month - 1, day);
            const dayName = getDayName(dateObject);
            
            setDayOfWeek(dayName);
        }
    }, [selectedDate]);

return (
    <>
    <div class="flex bg-white min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">

    <div Class="Display flex min-h-full flex-1 flex-col bg-white px-6 py-12 lg:px-8">
        <div>
            {/* Uncomment for Calendar Component
            <div>
                    <CalendarComponent/>
            </div> */}
            

            <div class="overflow-x-auto">
                <ToggleView/>
                {/* <ManagerAdhocComponent/> */}
                {/* <ManagerRecurringComponent/> */}
                {/* <ManagerViewComponent/> */}
            </div>
        </div>
    </div>
    </div>

</>
);
}
