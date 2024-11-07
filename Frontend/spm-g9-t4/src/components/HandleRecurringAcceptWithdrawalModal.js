import React, { useState, useEffect } from 'react';

const formatDate = (dateString) => {
    const dateParts = dateString.split('/');
    
    if (dateParts.length === 3) {
        let year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        
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

const HandleRecurringAcceptWithdrawalModal = ({ isOpen, onClose, onAcceptWithdrawal, data }) => {
    const [selectedDates, setSelectedDates] = useState([]);

    // Reset selected dates based on incoming data.wfh_dates
    useEffect(() => {
        if (isOpen && data?.wfh_dates) {
            setSelectedDates([]);
        }
    }, [isOpen, data]);

    if (!isOpen) return null;

    const handleDateSelection = (date) => {
        setSelectedDates((prevSelected) => 
            prevSelected.includes(date)
                ? prevSelected.filter(d => d !== date)
                : [...prevSelected, date]
        );
    };

    const handleConfirmSelection = () => {
        const formattedDates = selectedDates
            .map(formatDate)
            .filter(date => date !== null);
        onAcceptWithdrawal(data.requestid, formattedDates);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4">Approve Withdrawal: Select Dates</h2>
                <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-left">Select Dates to Approve Withdrawal:</h3>
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
                        onClick={handleConfirmSelection}
                        className="bg-red-500 text-white px-3 py-2 rounded"
                    >
                        Confirm Withdrawal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HandleRecurringAcceptWithdrawalModal;
