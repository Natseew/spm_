import React, { useState, useEffect } from 'react';

const formatDate = (dateString) => {
    // Remove any leading "20" if it's mistakenly included in the year portion
    if (dateString.startsWith("2020") && dateString.length > 10) {
        dateString = dateString.slice(4);
    }

    // Split the corrected date string by slashes
    const dateParts = dateString.split('/');

    if (dateParts.length === 3) {
        const year = dateParts[0];  // Already in YYYY format
        const month = dateParts[1];
        const day = dateParts[2];

        return `${year}/${month}/${day}`;
    }

    console.error("Invalid date format:", dateString);
    return null;
};



const ModifyRecurringRequestModal = ({ isOpen, onClose, onModify, data }) => {
    const [selectedDates, setSelectedDates] = useState([]); // Initialize as empty array

    // Use effect to set the selected dates based on incoming data.wfh_dates
    useEffect(() => {
        if (isOpen && data?.wfh_dates) {
            // Initialize selected dates based on the provided data, if needed
            setSelectedDates([]); // Reset selected dates each time the modal opens
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

    const formatToISO8601 = (dateString) => {
        const [year, month, day] = dateString.split('/');
        return `${year}-${month}-${day}`; // Converts 'YYYY/MM/DD' directly to 'YYYY-MM-DD'
    };
    
    const handleModifyConfirm = () => {
        // Convert only the selected dates to YYYY-MM-DD format
        const datesToRemove = selectedDates.map(formatToISO8601); // Format dates to `YYYY-MM-DD`
        
        console.log('These are the Dates to Remove:', datesToRemove);
        
        // Modify request with dates to remove
        onModify(data.requestid, { wfh_dates: datesToRemove });
        
        // Close the modal
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
                                checked={selectedDates.includes(date)} // Check if the date is selected
                                onChange={() => handleDateSelection(date)} // Handle checkbox change
                                className="mr-2"
                            />
                            <label htmlFor={date}>{formatDate(date)}</label> {/* Display the date in DD/MM/YYYY format */}
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