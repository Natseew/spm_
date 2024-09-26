import React, { useState, useEffect } from 'react';

const statusOptions = ['Pending', 'Approved', 'Withdrawn', 'Rejected'];

const CombinedSchedule = () => {
    const [adhocData, setAdhocData] = useState([]);
    const [recurringData, setRecurringData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
    const [selectedDate, setSelectedDate] = useState("");

    // Retrieve ad hoc schedule data
    useEffect(() => {
        const fetchAdhocData = async () => {
            try {
                const response = await fetch('http://localhost:4000/adhoc_requests');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const fetchedData = await response.json();
                setAdhocData(fetchedData);
            } catch (error) {
                console.error('Error fetching ad hoc schedule data:', error);
                setError(error.message);
            }
        };

        fetchAdhocData();
    }, []); // Fetch once on mount

    // Retrieve recurring schedule data
    useEffect(() => {
        const fetchRecurringData = async () => {
            try {
                const response = await fetch('http://localhost:4000/recurring_schedule');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const fetchedData = await response.json();
                setRecurringData(fetchedData);
            } catch (error) {
                console.error('Error fetching recurring schedule data:', error);
                setError(error.message);
            } finally {
                setLoading(false); // Ensure loading state is updated to false
            }
        };

        fetchRecurringData();
    }, []); // Fetch once on mount

    if (loading) return <p>Loading...</p>; // Display loading message
    if (error) return <p>Error: {error}</p>; // Display error message

    // Combined Data
    const combinedData = [...adhocData, ...recurringData];

    // Filtering logic
    const filteredData = combinedData.filter(item => {
        const dateMatches = selectedDate ?
            new Date(item.sched_date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString() :
            true;
        return item.status === selectedStatus && dateMatches; // Both status and date match
    });

    // Handle status toggle
    const handleStatusChange = (status) => {
        setSelectedStatus(status);
    };

    // Handle date change
    const handleDateChange = (event) => {
        setSelectedDate(event.target.value); // Update selected date
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <div className="flex-1 text-left">
                    <label htmlFor="button" className="block mb-2">Filter By Status:</label>
                    {statusOptions.map(status => (
                        <button
                            key={status}
                            className={`py-2 px-4 mr-2 ${selectedStatus === status ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            onClick={() => handleStatusChange(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="flex-1 text-right">
                    <label htmlFor="date" className="block mb-2">Filter Date:</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="p-2 border border-gray-300 rounded"
                    />
                </div>
            </div>
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
                    {filteredData.map((item, index) => (
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

export default CombinedSchedule;