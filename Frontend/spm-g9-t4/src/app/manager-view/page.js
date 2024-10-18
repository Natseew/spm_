// Mark this component as a Client Component
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ToggleView from "@/components/ToggleViewComponent";

export default function ManagerView() { // Rename to start with an uppercase letter
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
        <div className="flex flex-col bg-white min-h-screen justify-center px-6 py-12 lg:px-8">  {/* Changed min-h-full to min-h-screen */}
            <div className="flex flex-col flex-1 bg-white px-6 py-12 lg:px-8 overflow-hidden">  {/* flex-1 ensures it takes remaining space */}
                <div className="overflow-x-auto flex-grow">  {/* flex-grow to fill the available space */}
                    <ToggleView/>
                    {/* <ManagerAdhocComponent/> */}
                    {/* <ManagerRecurringComponent/> */}
                </div>
            </div>
        </div>
    </>
    );
}
