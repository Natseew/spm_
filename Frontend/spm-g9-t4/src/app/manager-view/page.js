// Mark this component as a Client Component
"use client";

// import CalendarComponent from '../components/CalendarComponent';

import CalendarComponent from "@/components/CalendarComponent";
import React, { useState, useEffect } from 'react';
// import { Grid, Typography, Box, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Paper } from '@mui/material';
// import dayjs from 'dayjs';  // For date formatting


export default function managerview() {
    const [selectedDate, setSelectedDate] = useState(""); // State to track the selected date
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [dayOfWeek, setDayOfWeek] = useState("");

    const generateDateOptions = () => {
    const options = [];
    const today = new Date();


    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Format the date as dd/mm/yyyy
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const year = date.getFullYear();

        options.push(
            <option key={date.toISOString()} value={`${day}/${month}/${year}`}>
                {`${day}/${month}/${year}`}
            </option>
        );
    }

    return options;
    };
    
    
// Utility function to get the day name
function getDayName(date) {
    if (isNaN(date.getTime())) {
        return 'Invalid Date'; // Handle invalid date scenario
    }

    const options = { weekday: 'long' };
    return date.toLocaleDateString(undefined, options); // format the date as needed
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
                <select className="Date" id="date" name="date" onChange={handleDateChange}>
                    <option value="" disabled selected>Select a date</option>
                    {generateDateOptions()}
                </select>
            </div>
            
            {/* <Box sx={{ marginTop: '20px', width: '200px' }}>
                <TextField
                label="Select Date"
                type="date"
                value={date}
                onChange={handleDateChange}
                InputLabelProps={{
                    shrink: true,
                }}
                fullWidth
                />
            </Box>   */}

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
    </div>

    <div Class="Display flex min-h-full flex-1 flex-col bg-white px-6 py-12 lg:px-8">
        <div>
            {/* Uncomment for Calendar Component
            <div>
                    <CalendarComponent/>
            </div> */}

            <p>Employee timetable Display</p>
            
            <div class="overflow-x-auto">

                <table class="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                    <thead class="bg-gray-500 text-white">
                        <tr class="text-center">
                            <th class="py-2 px-4 border-b border-gray-300">Name</th>
                            <th class="py-2 px-4 border-b border-gray-300">Monday</th>
                            <th class="py-2 px-4 border-b border-gray-300">Tuesday</th>
                            <th class="py-2 px-4 border-b border-gray-300">Wednesday</th>
                            <th class="py-2 px-4 border-b border-gray-300">Thursday</th>
                            <th class="py-2 px-4 border-b border-gray-300">Friday</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="text-center">
                            <td class="hover:bg-green-100 transition-colors py-2 px-4 border-b bg-white-400 border-gray-300">Austin Zhao</td>
                            <td class="hover:bg-blue-100 transition-colorspy-2 px-4 border-b border-gray-300"></td>
                            <td class="hover:bg-blue-100 transition-colors py-2 px-4 border-b bg-gray-200 border-gray-300">Scheduled</td>
                            <td class="hover:bg-blue-100 transition-colors py-2 px-4 border-b bg-gray-200 border-gray-300">Scheduled</td>
                            <td class="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-300"></td>
                            <td class="hover:bg-blue-100 transition-colorspy-2 px-4 border-b border-gray-300"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    </div>
</>
);
}

