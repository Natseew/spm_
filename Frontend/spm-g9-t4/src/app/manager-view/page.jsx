// Mark this component as a Client Component
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ToggleView from "@/components/ToggleViewComponent";
// import Navbar from "@/components/Navbar";

export default function ManagerView() {
    const [selectedDate, setSelectedDate] = useState("");
    // const [selectedDepartment, setSelectedDepartment] = useState("");
    // const [dayOfWeek, setDayOfWeek] = useState("");

    function getDayName(date) {
        if (isNaN(date.getTime())) {
            return 'Invalid Date'; 
        }
        const options = { weekday: 'long' };
        return date.toLocaleDateString(undefined, options);
    }

    // const handleDateChange = (event) => {
    //     setSelectedDate(event.target.value);
    // };

    // const handleDepartmentChange = (event) => {
    //     setSelectedDepartment(event.target.value);
    // };

    useEffect(() => {
        if (selectedDate) {
            const [day, month, year] = selectedDate.split('/').map(Number);
            const dateObject = new Date(year, month - 1, day);
            const dayName = getDayName(dateObject);
            setDayOfWeek(dayName);
        }
    }, [selectedDate]);

    return (
        <div className="flex flex-col bg-white min-h-screen justify-center px-6 py-12 lg:px-8">
            {/* <Navbar/> */}
            <div className="flex flex-col flex-1 bg-white px-6 py-12 lg:px-8 overflow-hidden">
                <div className="overflow-x-auto flex-grow">
                    <ToggleView/>
                </div>
            </div>
        </div>
    );
}
