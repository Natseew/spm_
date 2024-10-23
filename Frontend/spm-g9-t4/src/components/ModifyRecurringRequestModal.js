import React, { useState, useEffect } from 'react';

const ModifyRecurringRequestModal = ({ isOpen, onClose, onModify, data }) => {
    const [selectedDates, setSelectedDates] = useState([]);

    // Use effect to set the selected dates based on incoming data.wfh_dates
    useEffect(() => {
        if (isOpen && data?.wfh_dates) {
            // Format the wfh_dates to "YYYY-MM-DD"
            const formattedDates = data.wfh_dates.map(date => 
                new Date(date).toISOString().slice(0, 10) // Convert to YYYY-MM-DD format
            );
            setSelectedDates(formattedDates); // Initialize selected dates based on the formatted data
        }
    }, [isOpen, data]);

    if (!isOpen) return null; // Don't render if modal is not open

    // Handle date selection for rejecting dates
    const handleDateSelection = (date) => {
        setSelectedDates((prevSelected) => 
            prevSelected.includes(date)
                ? prevSelected.filter(d => d !== date) // Unselect date if already selected
                : [...prevSelected, date] // Select the date
        );
    };

    const handleModifyConfirm = () => {
        // Format both selected dates and the original wfh_dates to "YYYY-MM-DD"
        const formattedSelectedDates = selectedDates.map(date => new Date(date).toISOString().slice(0, 10)); // Format selected dates
        const updatedDates = data.wfh_dates.filter(date => 
            !formattedSelectedDates.includes(new Date(date).toISOString().slice(0, 10)) // Compare formatted dates to compare equality
        );
    
        console.log(updatedDates); // Log the updated dates for verification
        // Call the onModify handler with request ID and updated wfh_dates to be sent to the backend
        onModify(data.requestid, { wfh_dates: updatedDates });
    
        // Close the modal after modification
        onClose();
    };
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4">Modify Request: Remove Dates</h2>

                {/* Displaying wfh_dates with checkboxes */}
                <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-left">Unselect Dates to Remove Them:</h3>
                    {data.wfh_dates.map((date) => (
                        <div key={date} className="flex items-center">
                            <input 
                                type="checkbox" 
                                id={date} 
                                value={date} 
                                checked={selectedDates.includes(new Date(date).toISOString().slice(0, 10))} // Check if the formatted date is selected
                                onChange={() => handleDateSelection(new Date(date).toISOString().slice(0, 10))} // Handle checkbox change
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
                        className="bg-red-500 text-white px-3 py-2 rounded"
                    >
                        Remove Dates
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifyRecurringRequestModal;
