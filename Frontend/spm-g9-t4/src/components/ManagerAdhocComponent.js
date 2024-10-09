import React, { useState, useEffect } from 'react';
import AdhocModal from './AdhocModal'; // Make sure to create or import the Modal component.

const statusOptions = ['Pending', 'Approved', 'Withdrawn', 'Rejected','Pending Withdrawal'];

const AdHocSchedule = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
    const [selectedDate, setSelectedDate] = useState("");
    const [employeeIds, setEmployeeIds] = useState([]);
    const [adhocData, setAdhocData] = useState([]);
    const [employeeData, setEmployeeData] = useState([]); // State to store employee data
    const [modalOpen, setModalOpen] = useState(false); // State to control modal visibility
    const [modalData, setModalData] = useState(null); // State to hold data to display in the modal

    // Combine the fetching of employee IDs and ad hoc schedule data into one function
    useEffect(() => {
        const fetchEmployeeAndAdhocData = async () => {
            try {
                // Step 1: Fetch employee IDs based on the manager ID
                const idResponse = await fetch('http://localhost:4000/employee/by-manager/130002'); // Replace with actual managerId
                if (!idResponse.ok) {
                    throw new Error(`Error fetching employee IDs: ${idResponse.status}`);
                }
                const employeeData = await idResponse.json();
                const ids = employeeData.map(emp => emp.staff_id);
                setEmployeeIds(ids); // Store employee IDs in state
                
                // Step 2: Use these employee IDs to fetch WFH records
                const wfhResponse = await fetch('http://localhost:4000/wfh_records/by-employee-ids', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ employeeIds: ids }), // Sending employee IDs in the request body
                });

                if (!wfhResponse.ok) {
                    throw new Error(`Error fetching WFH records: ${wfhResponse.status}`);
                }

                const wfhData = await wfhResponse.json();
                setAdhocData(wfhData); // Store ad hoc data in state
                console.log(employeeData)

            } catch (error) {
                console.error('Error during fetch operations:', error);
                setError(error.message);
            } finally {
                setLoading(false); // Set loading to false irrespective of success or failure
            }
        };
        fetchEmployeeAndAdhocData();
    }, []); // Fetch once when component mounts

    const openModal = (data) => {
        setModalData(data); // Set the data to be displayed in the modal
        setModalOpen(true); // Open the modal
    };

    const closeModal = () => {
        setModalOpen(false); // Close the modal
        setModalData({}); // Clear the modal data
    };

    if (loading) {
        return <p>Loading...</p>; // Display loading message
    }

    if (error) {
        return <p>Error: {error}</p>; // Display error message
    }

    // Handle status toggle
    const handleStatusChange = (status) => {
        setSelectedStatus(status);
    };

    // Handle date change
    const handleDateChange = (event) => {
        setSelectedDate(event.target.value); // Update selected date
    };

    // Filtering logic
    const filteredData = adhocData.filter(item => {
        const dateMatches = selectedDate ? new Date(item.wfh_date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString() : true;
        return item.status === selectedStatus && dateMatches; // Both status and date match
    });
    
    // Helper function to get the staff name by staff ID
    const getStaffName = (staff_id) => {
        const employee = employeeData.find(item => item.staff_id === staff_id); // Check against the full employee data
        return employee ? `${employee.staff_fname} ${employee.staff_lname}` : 'Unknown'; // Fixed property name here
    };


    // Action Handlers
    const handleAccept = async (reqId) => {
        // Logic to accept the request
        console.log(`Accepting request with ID: ${reqId}`);
    };

    const handleReject = async (reqId) => {
        // Logic to reject the request
        console.log(`Rejecting request with ID: ${reqId}`);
    };

    const handleCancel = async (reqId) => {
        // Logic to cancel the accepted request
        console.log(`Canceling request with ID: ${reqId}`);
    };


    return (
        <div>
            <div className="flex justify-between mb-4">
                <div className="flex-1 text-left">
                    <label htmlFor="button" className="block mb-2">Filter By Status:</label>
                    {statusOptions.map(status => (
                        <button id='button'
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
                        <th className="py-2 px-4 border-b border-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody>
                        {filteredData
                        .filter(item => item.status === selectedStatus) // Filter data by selected status
                        .map((item, index) => (
                        <tr key={item.req_id} className="text-center">
                            <td className="hover:bg-green-100 transition-colors py-2 px-4 border-b bg-white-400 border-gray-300">{item.recordid}</td>
                            <td className="hover:bg-green-100 transition-colors py-2 px-4 border-b bg-white-400 border-gray-300">{getStaffName(item.staffid)}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-300">{new Date(item.wfh_date).toLocaleDateString()}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-200">{item.timeslot}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-300">{item.status}</td>
                            <td className="hover:bg-blue-100 transition-colors py-2 px-4 border-b border-gray-300">
                                <button 
                                    className="bg-blue-500 text-white px-2 py-1 rounded mx-6" 
                                    onClick={() => openModal(item)} // Open modal with item data
                                >
                                    View Details
                                </button>
                                {
                                    item.status === 'Pending' &&
                                    <>
                                        <button 
                                            className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                            onClick={() => handleAccept(item.req_id)} // Call accept handler
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            className="bg-red-500 text-white px-2 py-1 rounded" 
                                            onClick={() => handleReject(item.req_id)} // Call reject handler
                                        >
                                            Reject
                                        </button>
                                    </>
                                }
                                {
                                    item.status === 'Approved' &&
                                    <button 
                                        className="bg-yellow-500 text-white px-2 py-1 rounded" 
                                        onClick={() => handleCancel(item.req_id)} // Call cancel handler for accepted requests
                                    >
                                        Cancel
                                    </button>
                                }
                                {item.status === 'Withdrawn' || item.status === 'Rejected' ? null : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <AdhocModal 
                isOpen={modalOpen} 
                onClose={closeModal} 
                data={modalData} // Data to be displayed in the modal
            />
        </div>
        );
    };

export default AdHocSchedule;
