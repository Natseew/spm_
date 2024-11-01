"use client";

import React, { useState, useEffect } from 'react';
import { ContactUs } from "@/components/Contact";

export default function EmailTest() {

    // useEffect(() => {
    //     if (selectedDate) {
    //         const [day, month, year] = selectedDate.split('/').map(Number);
    //         const dateObject = new Date(year, month - 1, day);
    //         const dayName = getDayName(dateObject);
    //         setDayOfWeek(dayName);
    //     }
    // }, [selectedDate]);

    return (
        <div className="flex flex-col bg-white min-h-screen justify-center px-6 py-12 lg:px-8">
            <div className="flex flex-col flex-1 bg-white px-6 py-12 lg:px-8 overflow-hidden">
                <div className="overflow-x-auto flex-grow">
                    <ContactUs/>
                </div>
            </div>
        </div>
    );
}