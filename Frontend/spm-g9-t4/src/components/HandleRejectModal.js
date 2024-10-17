import React, { useState } from 'react';

const HandleRejectModal = ({ isOpen, onClose, onReject, data }) => {
    const [reason, setReason] = useState(''); // State for rejection reason

    if (!isOpen) return null; // Do not render if the modal is not open

    const handleRejectConfirm = () => {
        onReject(data.recordid, reason); // Pass the record ID and reason
        setReason(''); // Clear the input field
        onClose(); // Close the modal after action
    };
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4">Confirm Rejection</h2>
                <p>Are you sure you want to reject this request?</p>
                {/* Input field for reason */}
                <div className="mt-4">
                    <label htmlFor="rejectReason" className="block mb-2">Reason for Rejection:</label>
                    <textarea 
                        id="rejectReason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)} // Update state on change
                        className="w-full border border-gray-300 p-2 rounded"
                        rows="4"
                        placeholder="Enter reason for rejection"
                    />
                </div>
                <div className="flex justify-end mt-4">
                    <button 
                        onClick={onClose}
                        className="bg-gray-500 text-white px-3 py-2 mr-2 rounded"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleRejectConfirm}
                        disabled={!reason} // Disable the button if reason is empty
                        className={`bg-red-500 text-white px-3 py-2 rounded ${!reason ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HandleRejectModal;
