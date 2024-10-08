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
        <form>
            <h1>Filter by:</h1>
            <div>
                {/* Date Selector */}
                {/* <select className="Date" id="date" name="date" onChange={handleDateChange}>
                    <option value="" disabled selected>Select a date</option>
                    {generateDateOptions()}
                </select> */}
                <input
                    type="date"
                    id="date"
                    name="date"
                    placeholder="Select a Date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    style={{paddingLeft: '30px' }}
                />     
            </div>

            <div>
                {/* Department Selector */}
                <select id="department" name="department" onChange={handleDepartmentChange}>
                    <option value="" disabled selected>Select a department</option>
                    <option value="HR">HR</option>
                    <option value="Solutioning">Solutioning</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                    <option value="Consultancy">Consultancy</option>
                    <option value="Engineering">Engineering</option>
                    <option value="IT">IT</option>
                </select>
            </div>
        </form>

    <div>
        <p>Pinging data to frontend:</p>
        <p>Selected Day: {dayOfWeek}</p>
        <p>Selected Date: {selectedDate}</p>
        <p>Selected Department: {selectedDepartment}</p>
        {/* Display data based on selections */}
        <p>Data from server:</p>
    </div>

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
