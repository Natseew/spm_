import React, { useState, useEffect } from 'react';
import RecurringModal from './RecurringModal';
import HandleReccuringRejectModal from './HandleReccuringRejectModal';
import Notification from './Notification';
import ModifyRecurringRequestModal from './ModifyRecurringRequestModal';
import HandleRecurringAcceptChangeModal from './HandleRecurringAcceptChangeModal';
import HandleReccuringRejectChangeModal from './HandleReccuringRejectChangeModal';

const statusOptions = ['Pending', 'Approved', 'Withdrawn', 'Rejected', "Pending Withdrawal", 'Pending Change'];
const employeeNameid = {};
// const ManagerID = '130002'; 
const ManagerID = '140001';

const RecurringSchedule = () => {
    const [RecurringData, setRecurringData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employeeIds, setEmployeeIds] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [AcceptChangeModalOpen, setAcceptChangeModalOpen] = useState(false);
    const [rejectChangeModalOpen, setRejectChangeModalOpen] = useState(false);
    const [modifyModalOpen, setModifyModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [someData, setSomeData] = useState(null);
    const [modalDates, setModalDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
    const [notification, setNotification] = useState('');
    const [modifyData, setModifyData] = useState(null);
    const [path, setPath] = useState(process.env.NEXT_PUBLIC_API_URL);

    useEffect(() => {
        const fetchEmployeeAndRecurringData = async () => {
            try {
                const idResponse = await fetch(`${path}employee/by-manager/${ManagerID}`);
                if (!idResponse.ok) {
                    throw new Error(`Error fetching employee IDs: ${idResponse.status}`);
                }
                const employeeData = await idResponse.json();
                const ids = employeeData.map(emp => emp.staff_id);
                setEmployeeIds(ids);

                employeeData.forEach(emp => {
                    employeeNameid[emp.staff_id] = `${emp.staff_fname} ${emp.staff_lname}`;
                });

                const wfhResponse = await fetch(`${path}recurring_request/by-employee-ids?employeeIds=${ids.join(',')}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
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

        if (selectedStatus === 'Pending') {
            filteredDates = data.wfh_records.filter(record => record.status === 'Pending').map(record => record.wfh_date);
        } 
        // KIV: Is this needed?
        else if (selectedStatus === 'Pending') {
            filteredDates = data.wfh_records.filter(record => record.status === 'Pending').map(record => record.wfh_date);
        } else {
            filteredDates = data.wfh_records.map(record => record.wfh_date);
        }

        setSomeData(data);
        setModalDates(filteredDates);
        setRejectModalOpen(true);
        setRejectChangeModalOpen(false);  
    };

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setSomeData(null);
        setModalDates([]);
    };

    const openRejectChangeModal = (data) => {
        let filteredDates = [];

        if (selectedStatus === 'Pending Change') {
            filteredDates = data.wfh_records.filter(record => record.status === 'Pending Change').map(record => record.wfh_date);
        } 
        // KIV: Is this needed?
        else if (selectedStatus === 'Pending') {
            filteredDates = data.wfh_records.filter(record => record.status === 'Pending').map(record => record.wfh_date);
        } 
        // KIV: Is this needed?
        else {
            filteredDates = data.wfh_records.map(record => record.wfh_date);
        }

        setSomeData(data);
        setModalDates(filteredDates);
        setRejectChangeModalOpen(true);
        setRejectModalOpen(false);  
    };

    const closeRejectChangeModal = () => {
        setRejectChangeModalOpen(false);
        setSomeData(null);
        setModalDates([]);
    };

    const openModifyModal = (data) => {
        let ModifyfilteredDates = [];
        ModifyfilteredDates = data.wfh_records.map(record => record.wfh_date);
        setModifyData({ ...data, wfh_dates: ModifyfilteredDates });
        setModifyModalOpen(true);
    };
    

    const closeModifyModal = () => {
        setModifyModalOpen(false);
        setModifyData(null);
    };

    const AcceptChangeModal = (data) => {
        let AcceptChangefilteredDates = [];
        AcceptChangefilteredDates = data.wfh_records.filter(record => record.status === 'Pending Change').map(record => record.wfh_date);
        setModifyData({ ...data, wfh_dates: AcceptChangefilteredDates });
        setAcceptChangeModalOpen(true);
    };

    const closeAcceptChangeModal = () => {
        setAcceptChangeModalOpen(false);
        setModifyData(null);
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        console.log("selected status: " + status)
    };

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };


    const addOneDayAndFormat = (dateString) => {
        const date = new Date(dateString);
        date.setUTCDate(date.getUTCDate() + 1); // Add one day in UTC
    
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = String(date.getUTCFullYear()); // Full year (4 digits)
    
        return `${year}/${month}/${day}`; // Return in YYYY/MM/DD format
    };    
    
    const filteredData = RecurringData.map(item => {
        const filteredRecords = item.wfh_records.filter(record => record.status === selectedStatus);
        console.log(filteredRecords)

        return filteredRecords.length ? {
            ...item,
            wfh_records: filteredRecords.map(record => ({
                ...record,
                wfh_date: addOneDayAndFormat(record.wfh_date) // Add one day and format
            })),
            
        } : null;
    }).filter(Boolean); // Filter out nulls.

    const getStaffName = (id) => employeeNameid[Number(id)] || 'Unknown';

    // Accept Pending change
    const handleAcceptChange = async (reqId, changeDates) => {
        if (!reqId || !changeDates || !Array.isArray(changeDates)) {
            console.error("Invalid inputs provided:", reqId, changeDates);
            return;
        }
        try {
            const response = await fetch(`${path}recurring_request/accept-change`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requestID: reqId, changeDates }),
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log("Change accepted successfully:", data);
    
                // Update table
                setRecurringData(prevData => 
                    prevData.map(item => 
                        item.requestid === reqId 
                            ? { 
                                ...item, 
                                status: 'Approved', 
                                wfh_records: item.wfh_records.map(record => ({ 
                                    ...record, 
                                    status: 'Approved' 
                                })) 
                            }
                            : item
                    )
                );
            } else {
                console.error("Failed to accept change:", response.statusText);
            }
        } catch (error) {
            console.error("Error accepting change:", error);
        }
    };
    

    const handleRejectChange = async (reqId, rejectDates, reason) => {
        // Find the request data in RecurringData using the request ID
        const reqData = RecurringData.find(item => item.requestid === reqId);
        if (!reqData) return;
    
        try {
            // Send the rejection request to the server with the request ID, dates, and reason
            const response = await fetch(`${path}recurring_request/reject-change`, {
                method: 'PATCH', // Using PATCH since we're only modifying part of the resource
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestID: reqId, changeDates: rejectDates, reject_reason: reason })
            });
    
            if (!response.ok) {
                setNotification('Error rejecting change request');
                return;
            }
    
            // Update the RecurringData state to reflect the rejected status and reason for the selected dates
            const updatedData = RecurringData.map(item => {
                if (item.requestid === reqId) {
                    const updatedRecords = item.wfh_records.map(record => 
                        rejectDates.includes(record.wfh_date) && record.status === 'Pending Change'
                            ? { ...record, status: 'Rejected', reject_reason: reason } // Update status and reason for selected dates
                            : record // Keep other records as is
                    );
                    return { ...item, wfh_records: updatedRecords }; // Return updated item with modified records
                }
                return item; // Keep other items as is
            });
    
            setRecurringData(updatedData); // Update the main state with the modified data
            setNotification('Change request rejected'); // Display success notification
        } catch (error) {
            console.error('Error rejecting change request:', error);
            setNotification('Error rejecting change request');
        }
    };
    




    // Handle Modify
    const handleModify = async (requestid, updatedData) => {
        console.log('Request ID:', requestid);
        console.log('Data to be parsed in:', updatedData);

        if (!requestid || !updatedData || !Array.isArray(updatedData.wfh_dates)) {
            console.error("Invalid inputs provided:", requestid, updatedData);
            return;
        }

        try {
            // Send PATCH request to update the recurring request
            const response = await fetch(`${path}recurring_request/modify/${requestid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                const errorInfo = await response.json();
                throw new Error(`Modification failed: ${errorInfo.message}`);
            }

            const result = await response.json();
            console.log('Modification successful:', result);

            // Update the local state with new dates for the modified request
            setRecurringData(prevData =>
                prevData.map(req =>
                    req.requestid === requestid ? { ...req, wfh_dates: updatedData.wfh_dates } : req
                )
            );

            // Display success notification
            setNotification('Modification successful!');
            setTimeout(() => setNotification(''), 3000);

        } catch (error) {
            console.error('Error during modification:', error);
        }
    };


//Pending Accept
const handleAccept = async (requestid) => {
    console.log(`Accepting request with ID: ${requestid}`);
    try {
        const response = await fetch(`${path}recurring_request/approve/${requestid}`, {
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

        // COMMENTED OUT - because of email limits 
        // const emailResponse = await emailjs.send('service_aby0abw', 'template_or5vnzs', {
        //     user_name: "",
        //     recordID: recordID,
        //     }, 
        //     'iPUoaKtoJPR3QXdd9'); // Replace with your actual public key

        // console.log("Email Updates");
        // console.log('Email sent successfully:', emailResponse);

        // Update the status for BOTH recurring request & wfh_records in displayed table
        setRecurringData(prevData => 
            prevData.map(item => 
                item.requestid === requestid 
                    ? { 
                        ...item, 
                        status: 'Approved', 
                        wfh_records: item.wfh_records.map(record => ({ 
                            ...record, 
                            status: 'Approved' 
                        })) 
                    }
                    : item
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

// Pending Reject
const handleReject = async (requestid,reason) => {
    console.log(`Rejecting request with ID: ${requestid} for reason: ${reason}`);
    try {
        const response = await fetch(`${path}recurring_request/reject/${requestid}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason }) 
        });

        if (!response.ok) {
            throw new Error(`Error updating status: ${response.status}`);
        }

        const updatedData = await response.json();
        console.log('Record updated successfully:', updatedData);

        // COMMENTED OUT - because of email limits 
        // const emailResponse = await emailjs.send('service_aby0abw', 'template_or5vnzs', {
        //     user_name: "",
        //     recordID: recordID,
        //     }, 
        //     'iPUoaKtoJPR3QXdd9'); // Replace with your actual public key

        // console.log("Email Updates");
        // console.log('Email sent successfully:', emailResponse);

        // Update the status in displayed table
        setRecurringData(prevData => 
            prevData.map(item => 
                item.requestid === requestid 
                    ? { 
                        ...item, 
                        status: 'Rejected', // Updates the status of the recurring_request
                        wfh_records: item.wfh_records.map(record => ({ 
                            ...record, 
                            status: 'Rejected' // Updates the status of each corresponding wfh_record
                        })) 
                    }
                    : item
            )
        );

        setNotification('Request Rejected successfully!');
        setTimeout(() => setNotification(''), 3000);
    } catch (error) {
        console.error('Error during status update:', error);
        setNotification(`Error rejecting request: ${error.message}`);
        setTimeout(() => setNotification(''), 3000);
    }
};

const handleAcceptWithdrawal = async (requestid) => {
    console.log(`Accepting request with ID: ${requestid}`);
    try {
        const response = await fetch(`${path}recurring_request/approvewithdrawal/${requestid}`, {
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

        // COMMENTED OUT - because of email limits 
        // const emailResponse = await emailjs.send('service_aby0abw', 'template_or5vnzs', {
        //     user_name: "",
        //     recordID: recordID,
        //     }, 
        //     'iPUoaKtoJPR3QXdd9'); // Replace with your actual public key

        // console.log("Email Updates");
        // console.log('Email sent successfully:', emailResponse);

        // Update the status for BOTH recurring request & wfh_records in displayed table
        setRecurringData(prevData => 
            prevData.map(item => 
                item.requestid === requestid 
                    ? { 
                        ...item, 
                        status: 'Pending Withdrawal', 
                        wfh_records: item.wfh_records.map(record => ({ 
                            ...record, 
                            status: 'Pending Withdrawal' 
                        })) 
                    }
                    : item
            )
        );
        
        setNotification('Withdrawal accepted successfully!');
        setTimeout(() => setNotification(''), 3000);
    } catch (error) {
        console.error('Error during status update:', error);
        setNotification(`Error withdrawing request: ${error.message}`);
        setTimeout(() => setNotification(''), 3000);
    }
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
                        <th className="py-2 px-4 border-b border-gray-300">WFH Dates</th>
                        <th className="py-2 px-4 border-b border-gray-300">Timeslot</th>
                        <th className="py-2 px-4 border-b border-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((item, index) => (
                        <tr key={item.requestid || index} className="text-center hover:bg-blue-100 transition-colors">
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.requestid}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.staff_id}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{getStaffName(item.staff_id)}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.start_date}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.end_date}</td>
                            <td className="py-2 px-4 border-b border-gray-300">
                                {item.wfh_records.length > 0 ? (
                                    item.wfh_records.map(record => (
                                        <div key={record.wfh_date}>
                                            {record.wfh_date} - {record.status}
                                        </div>
                                    ))
                                ) : (
                                    <div>No WFH Records</div>
                                )}
                            </td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.timeslot}</td>
                            <td className="py-2 px-4 border-b border-gray-300">
                                <button className="bg-blue-500 text-white px-2 py-1 rounded mx-6" 
                                onClick={() => openModal(item)}>
                                    View Details
                                </button>
                                {selectedStatus === 'Pending' && (
                                    <>
                                        <button className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                        onClick={() => handleAccept(item.requestid)}>
                                            Accept
                                        </button>
                                        <button className="bg-red-500 text-white px-2 py-1 rounded" 
                                        onClick={() => openRejectModal(item)}>
                                            Reject
                                        </button>
                                    </>
                                )}
                                {selectedStatus === 'Approved' && (
                                    <>
                                        <button 
                                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2" 
                                            onClick={() => openModifyModal(item)}
                                        >
                                            Modify
                                        </button>
                                        <button 
                                            className="bg-red-500 text-white px-2 py-1 rounded" 
                                            onClick={() => openRejectModal(item)}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                                {selectedStatus === 'Pending Change' && (
                                    <>
                                        <button className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                        onClick={() => AcceptChangeModal(item)}>
                                            Accept
                                        </button>
                                        <button className="bg-red-500 text-white px-2 py-1 rounded" 
                                        onClick={() => openRejectChangeModal(item)}>
                                            Reject
                                        </button>
                                    </>
                                )}
                                
                                {selectedStatus === 'Pending Withdrawal' && (
                                    <>
                                        <button className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                        onClick={() => handleAcceptWithdrawal(item.requestid)}>
                                            Accept Withdrawal
                                        </button>
                                        <button className="bg-red-500 text-white px-2 py-1 rounded" 
                                        onClick={() => handleAccept(item.requestid)}>
                                            Reject Withdrawal
                                        </button>
                                    </>
                                )}
                            
                            </td>
                        </tr>
                    ))}
                </tbody>

            </table>

            <RecurringModal 
            isOpen={modalOpen} 
            onClose={closeModal} 
            data={modalData} 
            />

            <HandleReccuringRejectModal 
            isOpen={rejectModalOpen} 
            onClose={closeRejectModal} 
            onReject={handleReject} 
            data={someData} dates={modalDates} 
            />

            <HandleReccuringRejectChangeModal 
            isOpen={rejectChangeModalOpen} 
            onClose={closeRejectChangeModal} 
            onRejectChange={handleRejectChange} 
            data={someData} dates={modalDates} 
            />

            <ModifyRecurringRequestModal 
            isOpen={modifyModalOpen} 
            onClose={closeModifyModal} 
            onModify={handleModify} 
            data={modifyData} 
            />

            <HandleRecurringAcceptChangeModal
            isOpen={AcceptChangeModalOpen} 
            onClose={closeAcceptChangeModal} 
            onAcceptChange={handleAcceptChange} 
            data={modifyData} 
            />
        </div>
    );
};

export default RecurringSchedule;
