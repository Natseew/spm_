import React from 'react';
const RecurringModal = ({ isOpen, onClose, data }) => {


// Function to process and organize dates
const formatDatesFromObject = (dateArray) => {
    // Check if the input is an array
    if (!Array.isArray(dateArray)) {
        throw new Error("Invalid input. Please provide an array of date strings.");
    }

    // Initialize an array to hold formatted dates
    const formattedDates = [];

    // Loop through the date array
    for (const date of dateArray) {
        // Convert the string to a Date object and format it
        const formatted_date = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        // Push the formatted date to the result array
        formattedDates.push(formatted_date);
        formattedDates.push(" ");

    }

    // Return the formatted dates
    return formattedDates;
};

const FormatDateToDayofweek= (num) => {
    const dayofweek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    const match_num = num - 1

return dayofweek[match_num]
}

    if (!isOpen) return null; // Return null if modal is not open

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-4 max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4">Recurring Request Details</h2>
                <div>
                    {/* Display the details of the recurring request */}
                    <p><strong>Request ID:</strong> {data.requestID}</p>
                    <p><strong>Start Date:</strong> {new Date(data.start_date).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(data.end_date).toLocaleDateString()}</p>
                    {/* <p><strong>Start Date:</strong> {data.start_date}</p>
                    <p><strong>End Date:</strong> {data.end_date}</p> */}
                    <p><strong>Staff ID:</strong> {data.staff_id}</p>
                    <p><strong>Day of the Week:</strong> {FormatDateToDayofweek(data.day_of_week)}</p>
                    <p><strong>Request Reason:</strong> {data.request_reason}</p>
                    <p><strong>Status:</strong> {data.status}</p>
                    <p><strong>Timeslot:</strong> {data.timeslot}</p>
                    <p><strong>WFH Dates:</strong> {formatDatesFromObject(data.wfh_dates)}</p>
                    {/* <p><strong>Reject Reason:</strong> {data.reject_reason}</p> */}
                </div>
                <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
            </div>
        </div>
    );
};

export default RecurringModal;
