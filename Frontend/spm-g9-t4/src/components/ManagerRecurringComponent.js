import React, { useState, useEffect } from 'react';
import RecurringModal from './RecurringModal'; // Make sure to create or import the Modal component.
import HandleReccuringRejectModal from './HandleReccuringRejectModal'; // Changed to the correct component name
import Notification from './Notification'; // Import your Notification component
import ModifyRecurringRequestModal from './ModifyRecurringRequestModal'; // Import the new modal component

const statusOptions = ['Pending', 'Approved', 'Withdrawn', 'Rejected', 'Pending Withdrawal', 'Pending Change'];
const employeeNameid = {};
const ManagerID = '130002'; 
const YZManagerID = '140001';

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

    useEffect(() => {
        const fetchEmployeeAndRecurringData = async () => {
            try {
                const idResponse = await fetch(`${path}employee/by-manager/${YZManagerID}`);
                if (!idResponse.ok) {
                    throw new Error(`Error fetching employee IDs: ${idResponse.status}`);
                }
                const employeeData = await idResponse.json();
                const ids = employeeData.map(emp => emp.staff_id);
                setEmployeeIds(ids);

                employeeData.forEach(emp => {
                    employeeNameid[emp.staff_id] = `${emp.staff_fname} ${emp.staff_lname}`;
                });

                const wfhResponse = await fetch(`${path}recurring_request/by-employee-ids`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeIds: ids }),
                });

                if (!wfhResponse.ok) {
                    throw new Error(`Error fetching Recurring WFH records: ${wfhResponse.status}`);
                }

                const wfhData = await wfhResponse.json();
                console.log("Fetched Recurring WFH Data:", wfhData);
                setRecurringData(wfhData);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployeeAndRecurringData();
    }, [path]);


    const openModal = (data) => {
        setModalData(data);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalData({});
    };

    const openRejectModal = (data) => {
        let filteredDates = [];
    
        // Filter based on the selected status
        if (selectedStatus === 'Pending Change') {
            // For "Pending Change", filter the wfh_records to only include pending change dates
            filteredDates = data.wfh_records
                .filter(record => record.status === 'Pending Change')
                .map(record => record.wfh_date);
        } else if (selectedStatus === 'Pending') {
            // For "Pending", filter the wfh_records to only include pending dates
            filteredDates = data.wfh_records
                .filter(record => record.status === 'Pending')
                .map(record => record.wfh_date);
        } else {
            // For other statuses, pass all wfh_dates (or apply other filters if needed)
            filteredDates = data.wfh_records.map(record => record.wfh_date);
        }
    
        // Set the filtered dates and open the modal
        setSomeData(data);
        setModalDates(filteredDates); // Pass only the filtered dates based on status
        setRejectModalOpen(true);
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
    const closeModifyModal = () => {
        // Reset any states if necessary
        setSelectedDate([]);
        setModifyModalOpen(false);
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
    };

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const filteredData = RecurringData.filter(item => {
        const dateMatches = selectedDate ? new Date(item.start_date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString() : true;
        let statusMatches = false;
        if (selectedStatus === 'Pending Change') {
            statusMatches = item.wfh_records.some(record => record.status === 'Pending Change');
        } else if (selectedStatus === 'Pending') {
            statusMatches = item.wfh_records.some(record => record.status === 'Pending');
        } else if (selectedStatus === 'Pending Withdrawal') {
            statusMatches = item.wfh_records.some(record => record.status === 'Pending Withdrawal');
        } else {
            statusMatches = item.status === selectedStatus;
        }

        return statusMatches && dateMatches;
    });

    const getStaffName = (id) => {
        const name = employeeNameid[Number(id)] || 'Unknown';
        return name;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date';
        return dateString.split('T')[0];
    };

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
    // Handle accepting a change request
    const handleAcceptChange = async (reqId) => {
        console.log(`Accepting change request with ID: ${reqId}`);
    
        const reqData = RecurringData.find(item => item.requestid === reqId);
    
        // Debugging log to check the structure of reqData
        console.log("reqData:", reqData);
    
        if (!reqData) {
            console.error(`Request data not found for ID: ${reqId}`);
            Notification('error', `Request data not found for ID: ${reqId}`);
            return;
        }
    
        // Add a check to ensure wfh_records exists
        if (!reqData.wfh_records) {
            console.error(`No wfh_records found for request ID: ${reqId}`);
            Notification('error', `No wfh_records found for request ID: ${reqId}`);
            return;
        }
    
        const wfhRecord = reqData.wfh_records.find(record => record.status === 'Pending Change');
        if (!wfhRecord) {
            console.error(`No pending change record found for request ID: ${reqId}`);
            Notification('error', `No pending change record found for request ID: ${reqId}`);
            return;
        }
    
        // Proceed with the rest of your logic
        const wfhDate = wfhRecord.wfh_date;
        console.log(`Accepting change request for date: ${wfhDate}`);
        const requestid = reqId
    
        const response = await fetch('http://localhost:4000/recurring_request/accept-change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requestID: 122, wfhDate: '2024-10-21' })
        });
        
    
        if (!response.ok) {
            console.error(`Error accepting change request: ${response.status}`);
            Notification('error', 'Error accepting change request');
            return;
        }
    
        Notification('success', 'Change request accepted successfully');
        const updatedData = RecurringData.map(item => {
            if (item.requestid === reqId) {
                const updatedRecords = item.wfh_records.map(record => {
                    if (record.status === 'Pending Change') {
                        return { ...record, status: 'Approved', wfh_date: wfhDate, timeslot };
                    }
                    return record;
                });
                return { ...item, wfh_records: updatedRecords };
            }
            return item;
        });
        setRecurringData(updatedData);
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
    
    // Handle rejecting a change request
    const handleRejectChange = async (reqId, reason) => {
        console.log(`Rejecting change request with ID: ${reqId}, Reason: ${reason}`);
        const reqData = RecurringData.find(item => item.req_id === reqId);
        const wfhRecord = reqData.wfh_records.find(record => record.status === 'Pending Change');
        const wfhDate = wfhRecord.wfh_date;
        const requestid = reqData.requestid;

        const response = await fetch('http://localhost:4000/recurring_request/reject-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestid, wfhDate, reason }),
        });

        if (!response.ok) {
            console.error(`Error rejecting change request: ${response.status}`);
            Notification('error', 'Error rejecting change request');
            return;
        }

        Notification('success', 'Change request rejected');
        const updatedData = RecurringData.map(item => {
            if (item.req_id === reqId) {
                const updatedRecords = item.wfh_records.map(record => {
                    if (record.status === 'Pending Change') {
                        return { ...record, status: 'Rejected', reject_reason: reason };
                    }
                    return record;
                });
                return { ...item, wfh_records: updatedRecords };
            }
            return item;
        });
        setRecurringData(updatedData);
    };
    return (
        <div>
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}

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

            {/* Recurring Data Table */}
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                <thead className="bg-gray-500 text-white">
                    <tr className="text-center">
                        <th className="py-2 px-4 border-b border-gray-300">Request ID</th>
                        <th className="py-2 px-4 border-b border-gray-300">Staff ID</th>
                        <th className="py-2 px-4 border-b border-gray-300">Name</th>
                        <th className="py-2 px-4 border-b border-gray-300">Start Date</th>
                        <th className="py-2 px-4 border-b border-gray-300">End Date</th>
                        <th className="py-2 px-4 border-b border-gray-300">
                            {selectedStatus === 'Pending Change' || selectedStatus === 'Pending Withdrawal' ? 'Requested Change Date' : 'Actions'}
                        </th>
                        <th className="py-2 px-4 border-b border-gray-300">Timeslot</th>
                        <th className="py-2 px-4 border-b border-gray-300">Status</th>
                        <th className="py-2 px-4 border-b border-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((item, index) => (
                        <tr key={item.requestid || index} className="text-center hover:bg-blue-100 transition-colors">
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.requestid}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.staff_id}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{getStaffName(item.staff_id)}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{formatDate(item.start_date)}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{formatDate(item.end_date)}</td>
                            
                            {/* WFH Dates Column */}
                            <td className="py-2 px-4 border-b border-gray-300">
                                {item.wfh_records && item.wfh_records.length > 0 ? 
                                    item.wfh_records.map(record => (
                                        <div key={record.wfh_date}>
                                            {formatDate(record.wfh_date)} - {record.status}
                                        </div>
                                    )) : 
                                    'No WFH Records'
                                }
                            </td>
                            
                            <td className="py-2 px-4 border-b border-gray-200">{item.timeslot}</td>
                            <td className="py-2 px-4 border-b border-gray-300">{item.status}</td>
                            
                            <td className="py-2 px-4 border-b border-gray-200">
                                {item.status === 'Rejected' ? item.reject_reason : item.request_reason}
                            </td>

                            <td className="py-2 px-4 border-b border-gray-300">
                                {(() => {
                                    const pendingChangeRecord = item.wfh_records ? item.wfh_records.find(record => record.status === selectedStatus) : null;
                                    if (pendingChangeRecord && pendingChangeRecord.wfh_date) {
                                        return (
                                            <div>
                                            {formatDate(pendingChangeRecord.wfh_date)}
                                                {/* Add Accept and Reject Buttons */}
                                                <div className="mt-2">
                                                    <button 
                                                        className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                                        onClick={() => handleAcceptChange(item.requestid)} 
                                                    >
                                                        Accept Change
                                                    </button>
                                                    <button 
                                                        className="bg-red-500 text-white px-2 py-1 rounded" 
                                                        onClick={() => openRejectModal(item)}
                                                    >
                                                        Reject Change
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return 'No Pending Change';
                                })()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modals */}
            <RecurringModal isOpen={modalOpen} onClose={closeModal} data={modalData} />
            <HandleReccuringRejectModal 
                isOpen={rejectModalOpen} 
                onClose={closeRejectModal} 
                onReject={handleReject} 
                data={someData} 
                dates={modalDates} 
            />
            <ModifyRecurringRequestModal 
                isOpen={modifyModalOpen} 
                onClose={closeModifyModal} 
                onUpdate={handleModify} 
                data={modalData} 
            />
        </div>
    );
};

export default RecurringSchedule;



                        // {/* Requested Change or Withdrawal Date */}
                        // {selectedStatus === 'Pending Change' || selectedStatus === 'Pending Withdrawal' ? (
                        //     <td className="py-2 px-4 border-b border-gray-300">
                        //         {
                        //             (() => {
                        //                 const pendingChangeRecord = item.wfh_records ? item.wfh_records.find(record => record.status === selectedStatus) : null;
                        //                 if (pendingChangeRecord && pendingChangeRecord.wfh_date) {
                        //                     return (
                        //                         <div>
                        //                             {formatDate(pendingChangeRecord.wfh_date)}
                        //                             {/* Add Accept and Reject Buttons */}
                        //                             <div className="mt-2">
                        //                                 <button 
                        //                                     className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                        //                                     onClick={() => handleAcceptChange(item.requestid)} // Updated to use requestid
                        //                                 >
                        //                                     Accept Change
                        //                                 </button>
                        //                                 <button 
                        //                                     className="bg-red-500 text-white px-2 py-1 rounded" 
                        //                                     onClick={() => openRejectModal(item)}
                        //                                 >
                        //                                     Reject Change
                        //                                 </button>
                        //                             </div>
                        //                         </div>
                        //                     );
                        //                 }
                        //                 return 'No Pending Change';
                        //             })()
                        //         }
                        //     </td>
                        // ) : (
                        //     <td className="py-2 px-4 border-b border-gray-300">
                        //         <button className="bg-blue-500 text-white px-2 py-1 rounded mx-6" onClick={() => openModal(item)}>
                        //             View Details
                        //         </button>
                        //         {item.status === 'Pending' && (
                        //             <>
                        //                 <button 
                        //                     className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                        //                     onClick={() => handleAccept(item.requestid)} // Call accept handler
                        //                 >
                        //                     Accept
                        //                 </button>
                        //                 <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => openRejectModal(item)}>
                        //                     Reject
                        //                 </button>
                        //             </>
                        //         )}
    

            {/* Modals */}
            <RecurringModal isOpen={modalOpen} onClose={closeModal} data={modalData} />
            <HandleReccuringRejectModal isOpen={rejectModalOpen} onClose={closeRejectModal} onReject={handleRejectChange} data={someData} dates={modalDates} />
        </div>
    );
};

export default RecurringSchedule;
