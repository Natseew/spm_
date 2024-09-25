// Mark this component as a Client Component
"use client";

import CalendarComponent from "@/components/CalendarComponent";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ManagerAdhocComponent from "@/components/ManagerAdhocComponent";


export default function managerview() {
    const [selectedDate, setSelectedDate] = useState(""); // State to track the selected date
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [dayOfWeek, setDayOfWeek] = useState("");
    const [data, setData] = useState([]);  // State to track fetched data
    const [adhocData, setAdhocData] = useState([]); // State to track fetched adhoc schedule data

    // Retrieve recurring schedule data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:4000/recurring_schedule');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const fetchedData = await response.json();
                setData(fetchedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []); // Dependency array is empty to fetch once on mount

    
    // Retrieve ad hoc schedule data
    useEffect(() => {
        const fetchAdhocData = async () => {
            try {
                const response = await fetch('http://localhost:4000/adhoc_requests'); // Adjust endpoint as needed
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const fetchedData = await response.json();
                setAdhocData(fetchedData); // Store ad hoc data in state
            } catch (error) {
                console.error('Error fetching ad hoc schedule data:', error);
            }
        };

        fetchAdhocData();
    }, []); // Fetch ad hoc schedule data once on mount


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

            <p>Employee timetable Display</p>
            

            <div class="overflow-x-auto">

                {/* <table class="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
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
                </table> */}
                
                <ManagerAdhocComponent/>
                {/* Recurring */}
                <table class="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                    <thead class="bg-gray-500 text-white">
                        <tr class="text-center">
                            <th class="py-2 px-4 border-b border-gray-300">Request ID</th>
                            <th class="py-2 px-4 border-b border-gray-300">Name</th>
                            <th class="py-2 px-4 border-b border-gray-300">Scheduled Dates</th>
                            <th class="py-2 px-4 border-b border-gray-300">Timeslot</th>
                            <th class="py-2 px-4 border-b border-gray-300">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                        <tr key={index} className="text-center">
                            <td className="hover:bg-green-100 transition-colors py-2 px-4 border-b bg-white-400 border-gray-300">{item.req_id}</td>
                            {/* <td className="hover:bg-green-100 transition-colors py-2 px-4 border-b bg-white-400 border-gray-300">{item.staff_id}</td> */}
                            <td className="hover:bg-green-100 transition-colors py-2 px-4 border-b bg-white-400 border-gray-300">{`${item.staff_fname} ${item.staff_lname}`}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-300">{new Date(item.sched_date).toLocaleDateString()}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-200">{item.timeslot}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-300">{item.status}</td>                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    </div>
</>
);
}

