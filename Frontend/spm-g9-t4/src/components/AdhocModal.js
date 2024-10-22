import React from 'react';

const AdhocModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null; // Return null if modal is not open

        // Helper function to format dates in DD/MM/YY format
        const formatDateYY = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with zeros if needed
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed) and pad with zeros
            const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year
    
            return `${day}/${month}/${year}`; // Combine in DD/MM/YY format
        };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-4 max-w-lg w-full">
                <div className="w-full max-w-md mx-auto bg-white rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">WFH Request Details</h2>
                    <p className="mb-2"><strong>Request ID:</strong> {data.recordid}</p>
                    <p className="mb-2"><strong>Staff ID:</strong> {data.staffid}</p>
                    <p className="mb-2"><strong>Staff Name:</strong> {data.staffname || 'Unknown'}</p>
                    <p className="mb-2"><strong>WFH Date:</strong> {formatDateYY(data.wfh_date)}</p>
                    <p className="mb-2"><strong>Timeslot:</strong> {data.timeslot}</p>
                    <p className="mb-2"><strong>Status:</strong> {data.status}</p>
                    <p className="mb-2"><strong>Request Reason:</strong> {data.request_reason || 'N/A'}</p>
                    <p className="mb-2"><strong>Request Date:</strong> {formatDateYY(data.requestdate)}</p>
                </div>
                <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
            </div>
        </div>
    );

};

export default AdhocModal;
