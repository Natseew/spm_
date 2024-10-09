import React from 'react';

const RecurringModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null; // Return null if modal is not open

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-4 max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4">Recurring Request Details</h2>
                <div>
                    {/* Display the details of the recurring request */}
                    <p><strong>Request ID:</strong> {data.requestID}</p>
                    <p><strong>Start Date:</strong> {data.start_date}</p>
                    <p><strong>End Date:</strong> {data.end_date}</p>
                    <p><strong>Staff ID:</strong> {data.staffID}</p>
                    <p><strong>Day of the Week:</strong> {data.day_of_week}</p>
                    <p><strong>Request Reason:</strong> {data.request_reason}</p>
                    <p><strong>Status:</strong> {data.status}</p>
                    <p><strong>Timeslot:</strong> {data.timeslot}</p>
                    <p><strong>WFH Dates:</strong> {data.wfh_dates.join(', ')}</p>
                    <p><strong>Reject Reason:</strong> {data.reject_reason}</p>
                </div>
                <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
            </div>
        </div>
    );
};

export default RecurringModal;
