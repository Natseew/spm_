// Mark this component as a Client Component
"use client";

import React, { useState, useEffect } from 'react';
import ToggleView from "@/components/ToggleViewComponent";
import Navbar from "@/components/Navbar"; // Import the Navbar component

export default function ManagerView() {
    const [selectedDate] = useState("");
    const [DayofWeek, setDayOfWeek] = useState("")

    function getDayName(date) {
        if (isNaN(date.getTime())) {
            return 'Invalid Date'; 
        }
        const options = { weekday: 'long' };
        return date.toLocaleDateString(undefined, options);
    }

    useEffect(() => {
        if (selectedDate) {
            const [day, month, year] = selectedDate.split('/').map(Number);
            const dateObject = new Date(year, month - 1, day);
            const dayName = getDayName(dateObject);
            setDayOfWeek(dayName);
            console.log(DayofWeek)
        }
    }, [selectedDate]);

    return (
        <div className="flex flex-col bg-white min-h-screen justify-center px-6 py-12 lg:px-8">
            <Navbar /> {/* Render Navbar at the top */}
            <div className="flex flex-col flex-1 bg-white px-6 py-12 lg:px-8 overflow-hidden">
                <div className="overflow-x-auto flex-grow">
                    <ToggleView />
                </div>
            </div>
        </div>
    );
}
