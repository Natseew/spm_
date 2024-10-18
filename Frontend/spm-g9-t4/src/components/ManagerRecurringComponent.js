import React, { useState, useEffect } from 'react';
import RecurringModal from './RecurringModal'; // Make sure to create or import the Modal component.
import HandleReccuringRejectModal from './HandleReccuringRejectModal'; // Changed to the correct component name
import Notification from './Notification'; // Import your Notification component


const statusOptions = ['Pending', 'Approved', 'Withdrawn', 'Rejected','Pending Withdrawal','Pending Change'];
const employeeNameid = {} // Object to store staff_id and their corresponding full names
const ManagerID = '130002'; //Change according to the managerID of the Session. Hardcoded for now. 

const RecurringSchedule = () => {
    const [RecurringData, setRecurringData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employeeIds, setEmployeeIds] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [someData, setSomeData] = useState(null);
    const [modalDates, setModalDates] = useState([]); // For storing dates for the rejection modal
    const [selectedDate, setSelectedDate] = useState(""); 
    const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);

    // Combine the fetching of employee IDs and ad hoc schedule data into one function
    useEffect(() => {
        const fetchEmployeeAndRecurringData = async () => {
            try {
                // Step 1: Fetch employee IDs based on the manager ID
                const idResponse = await fetch(`http://localhost:4000/employee/by-manager/${ManagerID}`); // Replace with actual managerId
                if (!idResponse.ok) {
                    throw new Error(`Error fetching employee IDs: ${idResponse.status}`);
                }
                const employeeData = await idResponse.json();
                const ids = employeeData.map(emp => emp.staff_id);
                setEmployeeIds(ids); // Store employee IDs in state
                console.log(ids)

                // Create employeeNameid mapping
                employeeData.forEach(emp => {
                    employeeNameid[emp.staff_id] = `${emp.staff_fname} ${emp.staff_lname}`; // Map staff_id to full name
                    });
                    
                    // Log the employeeNameid for verification
                    console.log("Employee ID to Name Mapping:", employeeNameid);
    
                // Step 2: Use these employee IDs to fetch WFH records
                const wfhResponse = await fetch('http://localhost:4000/recurring_request/by-employee-ids', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ employeeIds: ids }), // Sending employee IDs in the request body
                });

                if (!wfhResponse.ok) {
                    throw new Error(`Error fetching Recurring WFH records: ${wfhResponse.status}`);
                }

                const wfhData = await wfhResponse.json();
                setRecurringData(wfhData); // Store ad hoc data in state
                console.log("Fetched Employee Data:",employeeData)
                console.log("Fetched WFH Data:", wfhData); // Log the data for debugging
                console.log('Recurring Data:', RecurringData)
                
            } catch (error) {
                console.error('Error during fetch operations:', error);
                setError(error.message);
            } finally {
                setLoading(false); // Set loading to false irrespective of success or failure
            }
        };
        fetchEmployeeAndRecurringData();
    }, []); // Fetch once when component mounts

    useEffect(() => {
        if (RecurringData.length > 0) {
            console.log('Recurring Data after update:', RecurringData);
        }
    }, [RecurringData]); // RecurringData is now included as a dependency
    

    const openModal = (data) => {
        setModalData(data); // Set the data to be displayed in the modal
        setModalOpen(true); // Open the modal
    };

    const closeModal = () => {
        setModalOpen(false); // Close the modal
        setModalData({}); // Clear the modal data
    };

    const extractUniqueDates = (data) => {
        const dates = new Set();
        data.forEach((item) => {
            if (item.wfh_dates) {
                item.wfh_dates.forEach(date => dates.add(date)); // Assuming wfh_dates is an array
            }
        });
        return Array.from(dates);
    };

    const openRejectModal = (data) => {
        setSomeData(data); // Set the request data
        setModalDates(data.wfh_dates || []); // Get specific request dates
        setRejectModalOpen(true); // Open the rejection modal
    };

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setSomeData(null);
        setModalDates([]);
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
    const filteredData = RecurringData.filter(item => {
        const dateMatches = selectedDate ? new Date(item.wfh_date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString() : true;
        return item.status === selectedStatus && dateMatches; // Both status and date match
    });
    
    const getStaffName = (id) => {
        // Use the employeeNameid dictionary to retrieve the full name
        const name = employeeNameid[Number(id)] || 'Unknown'; // Convert id to number for matching
    
        // Optionally log the name for debugging purposes
        console.log(name); // Log the retrieved name
        return name; // Return either found name or 'Unknown'
    };


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


    // Action Handlers
    const handleAccept = async (reqId) => {
        // Logic to accept the request
        console.log(`Accepting request with ID: ${reqId}`);
    };

    const handleReject = async (recordId, reason, dates) => {
        console.log(`Rejecting request with ID: ${recordId}, Reason: ${reason}, Dates: ${dates}`);
        // Logic to handle rejection
        closeRejectModal(); 
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
                        <th className="py-2 px-4 border-b border-gray-300">Staff ID</th>
                        <th className="py-2 px-4 border-b border-gray-300">Name</th>
                        <th className="py-2 px-4 border-b border-gray-300">Start Date</th>
                        <th className="py-2 px-4 border-b border-gray-300">End Date</th>
                        <th className="py-2 px-4 border-b border-gray-300">Day of Week</th>
                        <th className="py-2 px-4 border-b border-gray-300">Timeslot</th>
                        <th className="py-2 px-4 border-b border-gray-300">Status</th>
                        <th className="py-2 px-4 border-b border-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody>
                        {filteredData
                        .filter(item => item.status === selectedStatus) // Filter data by selected status
                        .map((item, index) => (
                        <tr key={item.req_id || index} className="text-center hover:bg-blue-100 transition-colors ">
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.requestid}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.staff_id}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{getStaffName(item.staff_id)}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{new Date(item.start_date).toLocaleDateString()}</td> 
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{new Date(item.end_date).toLocaleDateString()}</td>
                            {/* <td className="py-2 px-4 border-b border-gray-300" >{formatDatesFromObject(item.wfh_dates)}</td> */}
                            <td className="py-2 px-4 border-b border-gray-300" >{FormatDateToDayofweek(item.day_of_week)}</td>
                            <td className="py-2 px-4 border-b border-gray-200">{item.timeslot}</td>
                            <td className="py-2 px-4 border-b border-gray-300">{item.status}</td>
                            <td className="py-2 px-4 border-b border-gray-300">
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
                                            onClick={() => openRejectModal(item)} // Open reject modal
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
            <RecurringModal 
                isOpen={modalOpen} 
                onClose={closeModal} 
                data={modalData} // Data to be displayed in the modal
            />

            <HandleReccuringRejectModal 
                isOpen={rejectModalOpen} 
                onClose={closeRejectModal}
                onReject={handleReject}
                data={someData} 
                dates={modalDates} // Only the selected request's dates
            />
        </div>
        );
    };

export default RecurringSchedule;