import React from 'react';

const RecurringModal = ({ isOpen, onClose, data }) => {
    const formatDatesFromObject = (dateArray) => {
        if (!Array.isArray(dateArray)) {
            console.error("Invalid input. Please provide an array of date strings.");
            return [];
        }

        const formattedDates = [];
        for (const date of dateArray) {
            try {
                const dateObject = new Date(date);
                if (isNaN(dateObject)) {
                    console.error(`Invalid date: ${date}`);
                    continue;
                }
                const day = String(dateObject.getDate()).padStart(2, '0');
                const month = String(dateObject.getMonth() + 1).padStart(2, '0');
                const year = dateObject.getFullYear();
                formattedDates.push(`${day}/${month}/${year}`);
            } catch (error) {
                console.error("Error formatting date:", error);
            }
        }
        return formattedDates;
    };

    const FormatDateToDayofweek = (num) => {
        const dayofweek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayofweek[num - 1];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-4 max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4">Recurring Request Details</h2>
                <div>
                    <p><strong>Request ID:</strong> {data.requestID}</p>
                    <p><strong>Start Date:</strong> {new Date(data.start_date).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(data.end_date).toLocaleDateString()}</p>
                    <p><strong>Staff ID:</strong> {data.staff_id}</p>
                    <p><strong>Day of the Week:</strong> {FormatDateToDayofweek(data.day_of_week)}</p>
                    <p><strong>Request Reason:</strong> {data.request_reason}</p>
                    <p><strong>Status:</strong> {data.status}</p>
                    <p><strong>Timeslot:</strong> {data.timeslot}</p>

                    {/* Display the In-Office Percentage */}
                    <p><strong>In-Office Percentage:</strong></p>
                    <ul>
                        {data.inOfficePercentage && data.inOfficePercentage.length > 0 ? (
                            data.inOfficePercentage.map((entry, index) => (
                                <li key={index}>
                                    {new Date(entry.wfh_date).toLocaleDateString()} - Timeslot: {entry.timeslot}, Percentage: {entry.inOfficePercentage}%
                                </li>
                            ))
                        ) : (
                            <p>No in-office percentage data available</p>
                        )}
                    </ul>

                    {/* Display the WFH Dates */}
                    <p><strong>WFH Dates:</strong></p>
                    <ul>
                        {formatDatesFromObject(data.wfh_dates).map((date, index) => (
                            <li key={index}>{date}</li>
                        ))}
                    </ul>
                </div>
                <button onClick={onClose} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
            </div>
        </div>
    );
};

export default RecurringModal;
