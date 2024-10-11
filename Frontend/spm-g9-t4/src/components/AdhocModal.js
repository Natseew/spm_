import React from 'react';

const AdhocModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null; // Return null if modal is not open

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-4 max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4">WFH Record Details</h2>
                <div>
                    {/* Display the details of the WFH record */}
                    <p><strong>Record ID:</strong> {data.recordID}</p>
                    <p><strong>Staff ID:</strong> {data.staffID}</p>
                    <p><strong>WFH Date:</strong> {new Date(data.wfh_date).toLocaleDateString()}</p>
                    <p><strong>Recurring:</strong> {data.recurring ? 'Yes' : 'No'}</p>
                    <p><strong>Timeslot:</strong> {data.timeslot}</p>
                    <p><strong>Status:</strong> {data.status}</p>
                    <p><strong>Request Reason:</strong> {data.request_reason || 'N/A'}</p>
                    <p><strong>Request ID:</strong> {data.requestID}</p>
                    <p><strong>Request Date:</strong> {new Date(data.requestDate).toLocaleDateString()}</p>
                    {/* <p><strong>Reject Reason:</strong> {data.reject_reason || 'N/A'}</p> */}
                    {/* <p><strong>Timestamp:</strong> {new Date(data.timestamp).toLocaleString()}</p> */}
                </div>
                <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
            </div>
        </div>
    );

};

export default AdhocModal;
