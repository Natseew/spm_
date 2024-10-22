import React, { useState, useEffect } from 'react';
import AdhocModal from './AdhocModal'; // Make sure to create or import the Modal component.
// import CalendarComponent from "@/components/CalendarComponent";
import HandleRejectModal from './HandleRejectModal';
import Notification from './Notification'; // Import your Notification component


const statusOptions = ['Pending', 'Approved', 'Withdrawn', 'Rejected','Pending Withdrawal','Pending Change'];
const employeeNameid = {} // Object to store staff_id and their corresponding full names
const ManagerID = '130002'; //Change according to the managerID of the Session. Hardcoded for now. 


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
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectData, setRejectData] = useState(null);
    const [notification, setNotification] = useState(''); // State for notification message
    
    // Combine the fetching of employee IDs and ad hoc schedule data into one function
    useEffect(() => {
        const fetchEmployeeAndAdhocData = async () => {
            try {
                // Step 1: Fetch employee IDs based on the manager ID
                const idResponse = await fetch(`http://localhost:4000/employee/by-manager/${ManagerID}`); // Replace with actual managerId
                if (!idResponse.ok) {
                    throw new Error(`Error fetching employee IDs: ${idResponse.status}`);
                }
                const employeeData = await idResponse.json();
                const ids = employeeData.map(emp => emp.staff_id);
                setEmployeeIds(ids); // Store employee IDs in state
                
                // Create employeeNameid mapping
                employeeData.forEach(emp => {
                employeeNameid[emp.staff_id] = `${emp.staff_fname} ${emp.staff_lname}`; // Map staff_id to full name
                });
                
                // Log the employeeNameid for verification
                console.log("Employee ID to Name Mapping:", employeeNameid);

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
                
                console.log("Fetched Employee Data:",employeeData)


            } catch (error) {
                console.error('Error during fetch operations:', error);
                setError(error.message);
            } finally {
                setLoading(false); // Set loading to false irrespective of success or failure
            }
        };
        fetchEmployeeAndAdhocData();
    }, []); // Fetch once when component mounts

    
    useEffect(() => {
        if (adhocData.length > 0) {
            console.log('Adhoc Data after update:', adhocData);
        }
    }, [adhocData]); // This will run every time adhocData is updated

    // Modals Opening and Closing
    const openRejectModal = (data) => {
        setRejectData(data);
        setRejectModalOpen(true);
    };
    
    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setRejectData(null);
    };

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

    const getStaffName = (id) => {
        // Use the employeeNameid dictionary to retrieve the full name
        const name = employeeNameid[Number(id)] || 'Unknown'; // Convert id to number for matching
    
        // Optionally log the name for debugging purposes
        // console.log(name); // Log the retrieved name
        return name; // Return either found name or 'Unknown'
    };
    
    
// Action Handlers
const handleAccept = async (recordID) => {
    console.log(`Accepting request with ID: ${recordID}`);
    try {
        const response = await fetch(`http://localhost:4000/wfh_records/accept/${recordID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error updating status: ${response.status}`);
        }

        const updatedData = await response.json();
        console.log('Record updated successfully:', updatedData);

        // Update the state
        setAdhocData(prevData => 
            prevData.map(item => 
                item.recordid === recordID ? { ...item, status: 'Approved' } : item
            )
        );

        setNotification('Request accepted successfully!');
        setTimeout(() => setNotification(''), 3000);
    } catch (error) {
        console.error('Error during status update:', error);
        setNotification(`Error accepting request: ${error.message}`);
        setTimeout(() => setNotification(''), 3000);
    }
};

// Handle Rejection Button

const handleReject = async (reqId, reason) => {
    console.log(`Rejecting request with ID: ${reqId} for reason: ${reason}`);
    try {
        const response = await fetch(`http://localhost:4000/wfh_records/reject/${reqId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason }), // Send the reason in the request body
        });

        if (!response.ok) {
            throw new Error(`Error rejecting request: ${response.status}`);
        }

        const updatedData = await response.json();
        console.log('Rejection recorded successfully:', updatedData);
        
        setAdhocData(prevData => 
            prevData.map(item => 
                item.recordid === reqId ? { ...item, status: 'Rejected', reject_reason: reason } : item
            )
        );

        setNotification('Request rejected!');
        setTimeout(() => setNotification(''), 3000);
    } catch (error) {
        console.error('Error during rejection update:', error);
    }
};

// Handle Accept Withdrawal
const handleAcceptWithdraw = async (recordID) => {
    console.log(`Accepting request with ID: ${recordID}`);
    try {
        const response = await fetch(`http://localhost:4000/wfh_records/acceptwithdrawal/${recordID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error updating status: ${response.status}`);
        }

        const updatedData = await response.json();
        console.log('Record updated successfully:', updatedData);

        // Update the state
        setAdhocData(prevData => 
            prevData.map(item => 
                item.recordid === recordID ? { ...item, status: 'Pending Withdrawal' } : item
            )
        );

        setNotification('Withdrawal accepted successfully!');
        setTimeout(() => setNotification(''), 3000);
    } catch (error) {
        console.error('Error during status update:', error);
        setNotification(`Error accepting request: ${error.message}`);
        setTimeout(() => setNotification(''), 3000);
    }
};




// Handle Reject Withdrawal
// const handleRejectWithdraw = async (reqId, reason) => {
//     console.log(`Rejecting request with ID: ${reqId} for reason: ${reason}`);
//     try {
//         const response = await fetch(`http://localhost:4000/wfh_records/rejectwithdrawal/${reqId}`, {
//             method: 'PATCH',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ reason }), // Send the reason in the request body
//         });

//         if (!response.ok) {
//             throw new Error(`Error rejecting request: ${response.status}`);
//         }

//         const updatedData = await response.json();
//         console.log('Withdrawal Revoked recorded successfully:', updatedData);
        
//         setAdhocData(prevData => 
//             prevData.map(item => 
//                 item.recordid === reqId ? { ...item, status: 'Rejected', reject_reason: reason } : item
//             )
//         );

//         setNotification('Request rejected!');
//         setTimeout(() => setNotification(''), 3000);
//     } catch (error) {
//         console.error('Error during rejection update:', error);
//     }
// };


// Handling modal for reject action
const handleRejectOpen = (data) => {
    openRejectModal(data);
};

// Handle Cancelling Request
const handleCancel = async (recordID) => {
    console.log(`Accepting request with ID: ${recordID}`);
    try {
        const response = await fetch(`http://localhost:4000/wfh_records/cancel/${recordID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error updating status: ${response.status}`);
        }

        const updatedData = await response.json();
        console.log('Record updated successfully:', updatedData);

        // Optionally update the state if you want more control over the UI
        // You can still leave this here if you want:
        setAdhocData(prevData => 
            prevData.map(item => 
                item.recordid === recordID ? { ...item, status: 'Cancelled' } : item
            )
        );

        setNotification('Cancelled request successfully!');
        setTimeout(() => setNotification(''), 3000);
    } catch (error) {
        console.error('Error during status update:', error);
        setNotification(`Error accepting request: ${error.message}`);
        setTimeout(() => setNotification(''), 3000);
    }
};

    return (
        
        <div>
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}

        {/* <div>
                <CalendarComponent events={adhocData} />
            </div> */}

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
                        <th className="py-2 px-4 border-b border-gray-300">Scheduled Dates</th>
                        <th className="py-2 px-4 border-b border-gray-300">Timeslot</th>
                        <th className="py-2 px-4 border-b border-gray-300">Status</th>
                        <th className="py-2 px-4 border-b border-gray-300">
                            {selectedStatus === 'Rejected' ? 'Rejection Reason' : 'Reason'}
                        </th>                        
                        <th className="py-2 px-4 border-b border-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody>
                        {filteredData
                        .filter(item => item.status === selectedStatus) // Filter data by selected status
                        .map((item, index) => (
                        <tr key={item.req_id || index} className="text-center hover:bg-blue-100 transition-colors ">
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.recordid}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.staffid}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{getStaffName(item.staffid)}</td>
                            <td className="py-2 px-4 border-b border-gray-300">{new Date(item.wfh_date).toLocaleDateString()}</td>
                            <td className="py-2 px-4 border-b border-gray-200">{item.timeslot}</td>
                            <td className="py-2 px-4 border-b border-gray-300">{item.status}</td>
                            <td className="py-2 px-4 border-b border-gray-200">
                                {item.status === 'Rejected' ? item.reject_reason : item.request_reason}
                            </td>                            
                            <td className="py-2 px-4 border-b border-gray-300">
                                <button 
                                    className="bg-blue-500 text-white px-2 py-1 rounded mx-6" 
                                    onClick={() => openModal(item)} // Open modal with item data
                                >
                                    View Details
                                </button>
                                {/* Pending */}
                                {
                                    item.status === 'Pending' &&
                                    <>
                                        <button 
                                            className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                            onClick={() => handleAccept(item.recordid)} // Call accept handler
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            className="bg-red-500 text-white px-2 py-1 rounded" 
                                            onClick={() => openRejectModal(item)} // Open rejection modal with data
                                        >
                                            Reject
                                        </button>
                                    </>
                                }


                                {
                                    item.status === 'Approved' &&
                                    <button 
                                        className="bg-yellow-500 text-white px-2 py-1 rounded" 
                                        onClick={() => handleCancel(item.recordid)} // Call cancel handler for accepted requests
                                    >
                                        Cancel
                                    </button>
                                }
                                {item.status === 'Withdrawn' || item.status === 'Rejected' ? null : null}

                                {/* Pending Change */}
                                {item.status === 'Pending Change' && (
                                <>
                                    <button 
                                        className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                        onClick={() => handleAccept(item.recordid)} // Accept button for Pending Change
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        className="bg-red-500 text-white px-2 py-1 rounded" 
                                        onClick={() => openRejectModal(item)} // Reject button for Pending Change
                                    >
                                        Reject
                                    </button>
                                    </>
                                )}

                                {/* Pending Withdrawal */}
                                {item.status === 'Pending Withdrawal' && (
                                    <>
                                        <button 
                                            className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                            onClick={() => handleAcceptWithdraw(item.recordid)} // Accept button for Pending Withdrawal
                                        >
                                            Accept
                                        </button>
                                        {/* <button 
                                            className="bg-red-500 text-white px-2 py-1 rounded" 
                                            onClick={() => openRejectModal(item)} // Reject button for Pending Withdrawal
                                        >
                                            Reject
                                        </button> */}
                                    </>
                                )}
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

            <HandleRejectModal 
                isOpen={rejectModalOpen} 
                onClose={closeRejectModal} 
                onReject={handleReject} // Pass OnReject as the function to call
                data={rejectData} // Pass the relevant data to the modal
            />

        </div>
        );
    };

export default AdHocSchedule;
