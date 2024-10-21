import React, { useState, useEffect } from 'react';

const ModifyRecurringRequestModal = ({ isOpen, onClose, onModify, data }) => {
    // Initialize state with data properties
    // Use optional chaining to avoid errors when data is undefined or null
    const [startDate, setStartDate] = useState(data?.start_date ? data.start_date.split('T')[0] : ''); 
    const [endDate, setEndDate] = useState(data?.end_date ? data.end_date.split('T')[0] : ''); 
    const [timeslot, setTimeslot] = useState(data?.timeslot || 'AM'); 
    const [selectedDates, setSelectedDates] = useState([]);

    // Populate initial selected dates based on wfh_dates from data prop
    useEffect(() => {
        if (isOpen && data.wfh_dates) {
            setSelectedDates(data.wfh_dates); // Set selected dates based on passed data
        }
    }, [isOpen, data]);

    if (!isOpen) return null; // Don't render if the modal isn't open

    // Handle date selection for rejecting dates
    const handleDateSelection = (date) => {
        setSelectedDates((prevSelected) => 
            prevSelected.includes(date)
                ? prevSelected.filter(d => d !== date) // Unselect date if already selected
                : [...prevSelected, date] // Select the date
        );
    };

    const handleModifyConfirm = () => {
        // Call the onModify handler with modified data for saving changes
        onModify(data.requestid, { start_date: startDate, end_date: endDate, timeslot, selectedDates });
        onClose(); // Close the modal
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4">Modify Request</h2>

                <div className="mt-4">
                    <label htmlFor="startDate" className="block mb-2">Start Date:</label>
                    <input 
                        type="date" 
                        id="startDate" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <div className="mt-4">
                    <label htmlFor="endDate" className="block mb-2">End Date:</label>
                    <input 
                        type="date" 
                        id="endDate" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="w-full border border-gray-300 p-2 rounded"
                    />
                </div>

                <div className="mt-4">
                    <label htmlFor="timeslot" className="block mb-2">Timeslot:</label>
                    <select 
                        id="timeslot" 
                        value={timeslot}
                        onChange={(e) => setTimeslot(e.target.value)} 
                        className="w-full border border-gray-300 p-2 rounded"
                    >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                        <option value="FD">Full Day</option>
                    </select>
                </div>

                {/* Displaying wfh_dates with checkboxes */}
                <div className="mt-4">
                    <h3 className="font-semibold mb-2">Select Dates to Reject:</h3>
                    {data.wfh_dates.map((date) => (
                        <div key={date} className="flex items-center">
                            <input 
                                type="checkbox" 
                                id={date} 
                                value={date} 
                                checked={selectedDates.includes(date)} 
                                onChange={() => handleDateSelection(date)} 
                                className="mr-2"
                            />
                            <label htmlFor={date}>{new Date(date).toLocaleDateString()}</label>
                        </div>
                    ))}
                </div>

            <div className="flex justify-end mt-4">
                <button 
                    onClick={onClose}
                    className="bg-gray-500 text-white px-3 py-2 mr-2 rounded"
                >
                    Cancel
                </button>

<button 
                        onClick={handleModifyConfirm}
                        className="bg-blue-500 text-white px-3 py-2 rounded"
                    >
                        Modify
                        </button>
                </div>
            </div>
        </div>
    );
};


export default ModifyRecurringRequestModal;
