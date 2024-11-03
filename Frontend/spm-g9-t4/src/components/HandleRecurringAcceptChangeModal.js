import React, { useState, useEffect } from 'react';

const formatDate = (dateString) => {
    const dateParts = dateString.split('/');
    
    if (dateParts.length === 3) {
        let year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        
        // If the year is in YY format, convert it to YYYY
        if (year.length === 2) {
            year = `20${year}`; // Assumes dates are in the 2000s
        } else if (year.length !== 4) {
            console.error("Invalid year format:", year);
            return null;
        }
        
        return `${year}-${month}-${day}`; // Return directly in YYYY-MM-DD format
    }

    console.error("Invalid date format:", dateString);
    return null;
};

const AcceptChangeModal = ({ isOpen, onClose, onAcceptChange, data }) => {
    const [selectedDates, setSelectedDates] = useState([]); // Initialize as empty array

    // Use effect to set the selected dates based on incoming data.wfh_dates
    useEffect(() => {
        if (isOpen && data?.wfh_dates) {
            setSelectedDates([]); // Reset selected dates each time the modal opens
        }
    }, [isOpen, data]);

    if (!isOpen) return null; // Don't render if modal is not open

    const handleDateSelection = (date) => {
        setSelectedDates((prevSelected) => 
            prevSelected.includes(date)
                ? prevSelected.filter(d => d !== date) // Unselect date if already selected
                : [...prevSelected, date] // Select the date
        );
    };

    const handleConfirmSelection = () => {
        // Format selected dates as `YYYY-MM-DD` before sending to the backend
        const formattedDates = selectedDates.map(formatDate);
        onAcceptChange(data.requestid, formattedDates);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4">Approve Change: Select Dates</h2>

                {/* Displaying pending change wfh_dates with checkboxes */}
                <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-left">Select Dates to Approve Change:</h3>
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
                            <label htmlFor={date}>{formatDate(date)}</label> 
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
                        onClick={handleConfirmSelection} // Confirm selection and pass formatted dates
                        className="bg-green-500 text-white px-3 py-2 rounded"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcceptChangeModal;
