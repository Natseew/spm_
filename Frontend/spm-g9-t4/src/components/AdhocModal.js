import React from 'react';

const AdhocModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null; // Return null if modal is not open

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-4 max-w-lg w-full">
                <div className="w-full max-w-md mx-auto bg-white rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">WFH Request Details</h2>
                    <p className="mb-2"><strong>Request ID:</strong> {data.recordid}</p>
                    <p className="mb-2"><strong>Staff ID:</strong> {data.staffid}</p>
                    <p className="mb-2"><strong>Staff Name:</strong> {data.staffname || 'Unknown'}</p>
                    <p className="mb-2"><strong>WFH Date:</strong> {new Date(data.wfh_date).toLocaleDateString()}</p>
                    <p className="mb-2"><strong>Timeslot:</strong> {data.timeslot}</p>
                    <p className="mb-2"><strong>Status:</strong> {data.status}</p>
                    <p className="mb-2"><strong>Request Reason:</strong> {data.request_reason || 'N/A'}</p>
                    <p className="mb-2"><strong>Request Date:</strong> {new Date(data.requestdate).toLocaleDateString()}</p>
                </div>
                <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
            </div>
        </div>
    );

};

export default AdhocModal;
