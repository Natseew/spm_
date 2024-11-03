import React, { useState, useEffect } from 'react';

const formatDate = (dateString) => {
    // Adjust date format if needed
    if (dateString.startsWith("2020") && dateString.length > 10) {
        dateString = dateString.slice(4);
    }
    
    const dateParts = dateString.split('/');
    if (dateParts.length === 3) {
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        return `${year}/${month}/${day}`;
    }

    console.error("Invalid date format:", dateString);
    return null;
};

const HandleRecurringRejectChangeModal = ({ isOpen, onClose, onRejectChange, data, dates }) => {
    const [reason, setReason] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);

    useEffect(() => {
        if (isOpen && data?.wfh_dates) {
            setSelectedDates([]); // Reset selected dates on modal open
        }
    }, [isOpen, data]);

    if (!isOpen) return null; // Do not render if the modal is not open

    const handleDateSelection = (date) => {
        setSelectedDates((prevSelected) => 
            prevSelected.includes(date)
                ? prevSelected.filter(d => d !== date) // Unselect date if already selected
                : [...prevSelected, date] // Select the date
        );
    };

    const formatToISO8601 = (dateString) => {
        const [year, month, day] = dateString.split('/');
        return `${year}-${month}-${day}`; // Converts 'YYYY/MM/DD' to 'YYYY-MM-DD'
    };

    const handleRejectChangeConfirm = () => {
        const datesToReject = selectedDates.map(formatToISO8601); // Convert selected dates to ISO format
        onRejectChange(data.requestid, datesToReject, reason); // Pass request ID, selected dates, and reason
        setReason(''); // Clear the reason input
        onClose(); // Close the modal
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4">Reject Change: Select Dates</h2>

                {/* Reason for Rejection */}
                <div className="mt-4">
                    <label htmlFor="rejectReason" className="block mb-2">Reason for Rejection:</label>
                    <textarea 
                        id="rejectReason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                        rows="4"
                        placeholder="Enter reason for rejection"
                    />
                </div>

                {/* Display Dates with Checkboxes */}
                <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-left">Select Dates to Reject:</h3>
                    {dates.map((date) => (
                        <div key={date} className="flex items-center">
                            <input 
                                type="checkbox" 
                                id={date} 
                                value={date} 
                                checked={selectedDates.includes(date)} 
                                onChange={() => handleDateSelection(date)} 
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
                        onClick={handleRejectChangeConfirm}
                        disabled={!reason || selectedDates.length === 0} // Disable if no reason or dates
                        className={`bg-red-500 text-white px-3 py-2 rounded ${(!reason || selectedDates.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HandleRecurringRejectChangeModal;
