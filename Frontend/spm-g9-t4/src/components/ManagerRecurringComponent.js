import React, { useState, useEffect } from 'react';

const RecurringSchedule = () => {
    const [adhocData, setRecurringData] = useState([]); // State to store fetched ad hoc data
    const [loading, setLoading] = useState(true); // State to track loading status
    const [error, setError] = useState(null); // State to capture any error messages

    // Retrieve ad hoc schedule data
    useEffect(() => {
        const fetchRecurringData = async () => {
            try {
                const response = await fetch('http://localhost:4000/recurring_schedule'); // Adjust endpoint as needed
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const fetchedData = await response.json();
                setRecurringData(fetchedData); // Store ad hoc data in state
            } catch (error) {
                console.error('Error fetching ad hoc schedule data:', error);
                setError(error.message); // Set error state if fetching fails
            } finally {
                setLoading(false); // Set loading to false either way
            }
        };

        fetchRecurringData();
    }, []); // Fetch ad hoc schedule data once on mount

    if (loading) {
        return <p>Loading...</p>; // Display loading message
    }

    if (error) {
        return <p>Error: {error}</p>; // Display error message
    }

    return (
        <div>
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                <thead className="bg-gray-500 text-white">
                    <tr className="text-center">
                        <th className="py-2 px-4 border-b border-gray-300">Request ID</th>
                        <th className="py-2 px-4 border-b border-gray-300">Name</th>
                        <th className="py-2 px-4 border-b border-gray-300">Scheduled Dates</th>
                        <th className="py-2 px-4 border-b border-gray-300">Timeslot</th>
                        <th className="py-2 px-4 border-b border-gray-300">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {adhocData.map((item, index) => (
                        <tr key={item.req_id} className="text-center">
                            <td className="hover:bg-green-100 transition-colors py-2 px-4 border-b bg-white-400 border-gray-300">{item.req_id}</td>
                            <td className="hover:bg-green-100 transition-colors py-2 px-4 border-b bg-white-400 border-gray-300">{`${item.staff_fname} ${item.staff_lname}`}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-300">{new Date(item.sched_date).toLocaleDateString()}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-200">{item.timeslot}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-300">{item.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RecurringSchedule;