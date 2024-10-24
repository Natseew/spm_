import React, { useState, useEffect } from 'react';
import RecurringModal from './RecurringModal'; // Make sure to create or import the Modal component.
import HandleReccuringRejectModal from './HandleReccuringRejectModal'; // Changed to the correct component name
import Notification from './Notification'; // Import your Notification component
import ModifyRecurringRequestModal from './ModifyRecurringRequestModal'; // Import the new modal component


const statusOptions = ['Pending', 'Approved', 'Withdrawn', 'Rejected','Pending Withdrawal','Pending Change'];
const employeeNameid = {} // Object to store staff_id and their corresponding full names
const ManagerID = '130002'; //Change according to the managerID of the Session. Hardcoded for now. 
// process.env.NEXT_PUBLIC_API_URL

const RecurringSchedule = () => {
    const [RecurringData, setRecurringData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employeeIds, setEmployeeIds] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [modifyModalOpen, setModifyModalOpen] = useState(false); // State for the modify modal
    const [modalData, setModalData] = useState(null);
    const [modalDates, setModalDates] = useState([]);
    const [someData, setSomeData] = useState(null);
    const [modifyData, setModifyData] = useState(null); // State for modification data
    const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
    const [selectedDate, setSelectedDate] = useState([]); 
    const [notification, setNotification] = useState('');
    const [path, setPath] = useState(process.env.NEXT_PUBLIC_API_URL)

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
                // console.log(ids)

                // Create employeeNameid mapping
                employeeData.forEach(emp => {
                    employeeNameid[emp.staff_id] = `${emp.staff_fname} ${emp.staff_lname}`; // Map staff_id to full name
                    });
                    
                    // Log the employeeNameid for verification
                    // console.log("Employee ID to Name Mapping:", employeeNameid);
    
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
                // console.log("Fetched Employee Data:",employeeData)
                console.log("Fetched WFH Data:", wfhData); // Log the data for debugging
                // console.log('Recurring Data:', RecurringData)
                
            } catch (error) {
                console.error('Error during fetch operations:', error);
                setError(error.message);
            } finally {
                setLoading(false); // Set loading to false irrespective of success or failure
            }
        };
        fetchEmployeeAndRecurringData();
    }, []); // Fetch once when component mounts

    // useEffect(() => {
    //     console.log('Recurring Data after update:', RecurringData);
    // }, [RecurringData]); // Monitor RecurringData changes

    useEffect(() => {
        console.log('path', path);
    }, [path]); // Monitor RecurringData changes



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
        console.log("Opening reject modal with data:", data); // Debugging line
        setSomeData(data); // Set the request data
        setModalDates(data.wfh_dates || []); // Get specific request dates
        setRejectModalOpen(true); // Open the rejection modal
    };
    

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setSomeData(null);
        setModalDates([]);
    };
    
    const openModifyModal = (data) => {
        console.log("Opening modify modal with data:", data);
        setModifyData(data); // Set the request data to be modified
        setModifyModalOpen(true); // Open the modify modal
    };
    // const closeModifyModal = () => {
    //     // Reset any states if necessary
    //     setSelectedDate([]);
    //     setModifyModalOpen(false);
    // };

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
        // console.log(name); // Log the retrieved name
        return name; // Return either found name or 'Unknown'
    };


// // Function to process and organize dates
// const formatDatesFromObject = (dateArray) => {
//     // Check if the input is an array
//     if (!Array.isArray(dateArray)) {
//         throw new Error("Invalid input. Please provide an array of date strings.");
//     }

//     // Initialize an array to hold formatted dates
//     const formattedDates = [];

//     // Loop through the date array
//     for (const date of dateArray) {
//         // Convert the string to a Date object and format it
//         const formatted_date = new Date(date).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: '2-digit',
//             day: '2-digit'
//         });
        
//         // Push the formatted date to the result array
//         formattedDates.push(formatted_date);
//         formattedDates.push(" ");

//     }

//     // Return the formatted dates
//     return formattedDates;
// };

const FormatDateToDayofweek= (num) => {
    const dayofweek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    const match_num = num - 1

return dayofweek[match_num]
}


    // Action Handlers
    const handleAccept = async (requestId) => {
        console.log(`Accepting request with ID: ${requestId}`);
    
        try {
            const response = await fetch(`${path}recurring_request/approve/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (!response.ok) {
                throw new Error(`Error updating status: ${response.statusText}`);
            }
    
            const result = await response.json();
            console.log(result.message);
    
            // Update the state to reflect the modified request
            setRecurringData(prevData =>
                prevData.map(req =>
                    req.requestid === requestId ? { ...req, status: 'Approved' } : req
                )
            );
    
            // Optionally display a notification to the user
            setNotification('Request accepted successfully!');
            setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
            
        } catch (error) {
            console.error('Error during status update:', error);
            setNotification(`Error accepting request: ${error.message}`);
            setTimeout(() => setNotification(''), 3000);
        }
    };
    
    
    const handleReject = async (requestId, reason) => {
        console.log('Request ID:', requestId); 
        console.log('Rejection Reason:', reason);
    
        try {
            const response = await fetch(`${path}/recurring_request/reject/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason }),
            });
    
            if (!response.ok) {
                throw new Error(`Error rejecting the request: ${response.statusText}`);
            }
    
            const result = await response.json();
            console.log(result.message);
    
            // Option 1: Directly update the state by filtering out the rejected item
            setRecurringData(prevData => prevData.filter(req => req.requestid !== requestId));
    
            // Option 2: Optionally fetch the data again to reload the updated list (might depend on how your backend handles the reject operation)
            fetchEmployeeAndRecurringData();
    
            setNotification('Request rejected successfully!');
            setTimeout(() => setNotification(''), 3000);
    
        } catch (error) {
            console.error('Error during status update:', error);
            setNotification(`Error handling rejection: ${error.message}`);
            setTimeout(() => setNotification(''), 3000);
        }
    };
    
    
    // handle Cancel
    const handleCancel = async (requestId) => {
        console.log(`Canceling request with ID: ${requestId}`);
        // API call or logic to cancel the request
        try {
            const response = await fetch(`${path}recurring_request/withdraw_entire/${requestId}`, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Failed to cancel the request.');
            }

            const result = await response.json();
            console.log(result.message);
            setRecurringData(prevData => prevData.filter(req => req.requestID !== requestId));
            setNotification('Cancelled request successfully!');
            setTimeout(() => setNotification(''), 3000);
        } catch (error) {
            console.error('Error during status update:', error);
            setNotification(`Error  canceling request: ${error.message}`);
            setTimeout(() => setNotification(''), 3000);
        }
    };

    // Handle Modify
    const handleModify = async (requestid, updatedData) => {
        console.log('Request ID:', requestid); 
        console.log('Data to be parsed in:', updatedData);

        // Validate inputs
        if (!requestid || !updatedData || !Array.isArray(updatedData.wfh_dates)) {
            console.error("Validation failed for inputs", requestid, updatedData);
            return;
        }
    
        try {
            // Send the PATCH request
            const response = await fetch(`${path}recurring_request/modify/${requestid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });
    
            if (!response.ok) {
                const errorInfo = await response.json();
                throw new Error(`Error modifying the request: ${errorInfo.message}`);
            }
    
            const result = await response.json();
            console.log('Modification successful:', result);


            // Option 1: Directly update the local state
            // Assuming RecurringData is the state variable holding the requests
            setRecurringData(prevData =>
                prevData.map(req =>
                    req.requestid === requestid ? { ...req, wfh_dates: updatedData.wfh_dates } : req
                )
            );

            // Notify user of success
            setNotification('Modification successful!');
            setTimeout(() => setNotification(''), 3000);


            // Handle success, possibly update local state or provide user feedback
        } catch (error) {
            console.error('Error handling modification:', error);
        }
    };

    // const handleModify = async (requestid, updatedData) => {
    //     // Validate parameters before proceeding
    //     if (!requestid || !updatedData || !Array.isArray(updatedData.wfh_dates)) {
    //         console.error("Validation failed for inputs", requestid, updatedData);
    //         return;
    //     }
    
    //     try {
    //         const response = await fetch(`/recurring_request/modify/${requestid}`, {
    //             method: 'PATCH',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(updatedData),
    //         });
    
    //         // Check if response is not ok (e.g., 4XX or 5XX HTTP code)
    //         if (!response.ok) {
    //             throw new Error(`Error modifying the request: ${response.statusText}`);
    //         }
    
    //         const result = await response.json();
    //         console.log(result.message); // Log success message
    
    //         // Update the local state with the modified dates
    //         setRecurringData(prevData => 
    //             prevData.map(req => 
    //                 req.requestid === requestId ? { ...req, wfh_dates: updatedData.wfh_dates } : req
    //             )
    //         );
    
    //         // Close the modification modal
    //         setModifyModalOpen(false); 
    //     } catch (error) {
    //         console.error('Error handling modification:', error);
    //     }
    // };
    

    return (
        <div>
            {/* {notification && <div className="notification">{notification}</div>} */}
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}

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
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.requestid}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.staff_id}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{getStaffName(item.staff_id)}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{new Date(item.start_date).toLocaleDateString()}</td> 
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{new Date(item.end_date).toLocaleDateString()}</td>
                            {/* <td className="py-2 px-4 border-b border-gray-300" >{formatDatesFromObject(item.wfh_dates)}</td> */}
                            <td className="py-2 px-4 border-b border-gray-300" >{FormatDateToDayofweek(item.day_of_week)}</td>
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
                                {
                                    item.status === 'Pending' &&
                                    <>
                                        <button 
                                            className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                            onClick={() => handleAccept(item.requestid)} // Call accept handler
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
                                    <>
                                        <button 
                                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2" 
                                            onClick={() => openModifyModal(item)} // Open modify modal
                                        >
                                            Modify
                                        </button>
                                        <button 
                                            className="bg-red-500 text-white px-2 py-1 rounded" 
                                            onClick={() => handleCancel(item.requestid)} // Call cancel handler
                                        >
                                            Cancel
                                        </button>
                                    </>
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
                onReject={handleReject} // Connect to new handle reject function
                data={someData} 
                dates={modalDates} 
            />

            <ModifyRecurringRequestModal 
                isOpen={modifyModalOpen} 
                onClose={closeModifyModal} 
                onModify={handleModify} 
                data={modifyData} 
            />

        </div>
        );
    };

export default RecurringSchedule;