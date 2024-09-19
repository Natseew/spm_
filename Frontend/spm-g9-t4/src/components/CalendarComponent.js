// components/CalendarComponent.js
'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

// export default function getScheduledDays= () => {
    
// }

const CalendarComponent = () => {
    const events = [
    { title: 'Meeting', start: '2024-09-20', end: '2024-09-20' },
    { title: 'Conference', start: '2024-09-25' },
    // Add more events as needed
    ];

    return (
    <div className="flex bg-white min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <h>Calendar</h>
        <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        />
    </div>
    );
};

export default CalendarComponent;
