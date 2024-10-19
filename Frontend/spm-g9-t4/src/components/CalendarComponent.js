// components/CalendarComponent.js
'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

// export default function getScheduledDays= () => {
    
// }

const CalendarComponent = ({ events }) => {
    const formattedEvents = events.map(item => ({
        title: item.request_reason,
        start: new Date(item.wfh_date).toISOString().split('T')[0], // Adjust the format if needed
        end: new Date(item.wfh_date).toISOString().split('T')[0], // If your event durations are single-day
    }));


    return (
    <div className="flex bg-white min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={formattedEvents} // Use formatted events
        />
    </div>
    );
};

export default CalendarComponent;
