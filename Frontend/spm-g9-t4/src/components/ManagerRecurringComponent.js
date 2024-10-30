import React, { useState, useEffect } from 'react';
import RecurringModal from './RecurringModal';
import HandleReccuringRejectModal from './HandleReccuringRejectModal';
import Notification from './Notification';
import ModifyRecurringRequestModal from './ModifyRecurringRequestModal';
import HandleReccuringRejectChangeModal from './HandleReccuringRejectChangeModal';

const statusOptions = ['Pending', 'Approved', 'Withdrawn', 'Rejected', 'Pending Withdrawal', 'Pending Change'];
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
        } else if (selectedStatus === 'Pending') {
            filteredDates = data.wfh_records.filter(record => record.status === 'Pending').map(record => record.wfh_date);
        } else {
            filteredDates = data.wfh_records.map(record => record.wfh_date);
        }

        setSomeData(data);
        setModalDates(filteredDates);
        setRejectModalOpen(true);
        setRejectChangeModalOpen(false);  // Ensure change modal is closed
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
        } else if (selectedStatus === 'Pending') {
            filteredDates = data.wfh_records.filter(record => record.status === 'Pending').map(record => record.wfh_date);
        } else {
            filteredDates = data.wfh_records.map(record => record.wfh_date);
        }

        setSomeData(data);
        setModalDates(filteredDates);
        setRejectChangeModalOpen(true);
        setRejectModalOpen(false);  // Ensure reject modal is closed
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

    const getStaffName = (id) => employeeNameid[Number(id)] || 'Unknown';

    // For pending change functionality
    const handleAcceptChange = async (reqId) => {
        const reqData = RecurringData.find(item => item.requestid === reqId);

        if (!reqData || !reqData.wfh_records) return;

        const wfhRecord = reqData.wfh_records.find(record => record.status === 'Pending Change');
        if (!wfhRecord) return;

        const wfhDate = wfhRecord.wfh_date;
        const response = await fetch(`${path}recurring_request/accept-change`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestID: reqId, wfhDate }),
        });

        if (!response.ok) {
            setNotification('Error accepting change request');
            return;
        }

        setNotification('Change request accepted successfully');
        const updatedData = RecurringData.map(item => {
            if (item.requestid === reqId) {
                const updatedRecords = item.wfh_records.map(record => record.status === 'Pending Change' ? { ...record, status: 'Approved' } : record);
                return { ...item, wfh_records: updatedRecords };
            }
            return item;
        });
        setRecurringData(updatedData);
    };

    const handleRejectChange = async (reqId, reason) => {
        const reqData = RecurringData.find(item => item.requestid === reqId);
        if (!reqData) return;

        const wfhRecord = reqData.wfh_records.find(record => record.status === 'Pending Change');
        const wfhDate = wfhRecord?.wfh_date;

        const response = await fetch(`${path}recurring_request/reject-change`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestid: reqId, wfhDate, reason }),
        });

        if (!response.ok) {
            setNotification('Error rejecting change request');
            return;
        }

        setNotification('Change request rejected');
        const updatedData = RecurringData.map(item => {
            if (item.requestid === reqId) {
                const updatedRecords = item.wfh_records.map(record => record.status === 'Pending Change' ? { ...record, status: 'Rejected', reject_reason: reason } : record);
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

        // handle Cancel
        // const handleCancel = async (requestId) => {
        //     console.log(`Canceling request with ID: ${requestId}`);
        //     // API call or logic to cancel the request
        //     try {
        //         const response = await fetch(`${path}recurring_request/withdraw-entire/${requestId}`, {
        //             method: 'PUT',
        //         });
    
        //         if (!response.ok) {
        //             throw new Error('Failed to cancel the request.');
        //         }
    
        //         const result = await response.json();
        //         console.log(result.message);
        //         setRecurringData(prevData => prevData.filter(req => req.requestID !== requestId));
        //         setNotification('Cancelled request successfully!');
        //         setTimeout(() => setNotification(''), 3000);
        //     } catch (error) {
        //         console.error('Error during status update:', error);
        //         setNotification(`Error  canceling request: ${error.message}`);
        //         setTimeout(() => setNotification(''), 3000);
        //     }
        // };

//Handle Accept
// Action Handlers
// Changed "recordID" to "requestID" to match the API
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

// Added reason parameter to async function
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
                    {filteredData
                        .filter(item => item.status === selectedStatus) // Filter data by selected status
                        .map((item, index) => (
                        <tr key={item.requestid || index} className="text-center hover:bg-blue-100 transition-colors">
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.requestid}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.staff_id}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{getStaffName(item.staff_id)}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.start_date}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.end_date}</td>
                            <td className="py-2 px-4 border-b border-gray-300">
                                {item.wfh_records?.map(record => (
                                    <div key={record.wfh_date}>
                                        {record.wfh_date} - {record.status}
                                    </div>
                                )) || 'No WFH Records'}
                            </td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.timeslot}</td>
                            <td className="py-2 px-4 border-b border-gray-300">
                                <button className="bg-blue-500 text-white px-2 py-1 rounded mx-6" 
                                onClick={() => openModal(item)}>
                                    View Details
                                </button>
                                {item.status === 'Pending' && (
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
                                {item.status === 'Approved' && (
                                    <>
                                        <button 
                                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2" 
                                            onClick={() => openModifyModal(item)}
                                        >
                                            Modify
                                        </button>
                                        <button 
                                            className="bg-red-500 text-white px-2 py-1 rounded" 
                                            onClick={() => openRejectModal(item)} // cancel button just route to rejectHandler
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                                {item.status === 'Withdrawn' || item.status === 'Rejected' ? null : null}
                                {item.status === 'Pending Change' && (
                                    <>
                                        <button className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                        onClick={() => handleAcceptChange(item.requestid)}>
                                            Accept
                                        </button>
                                        <button className="bg-red-500 text-white px-2 py-1 rounded" 
                                        onClick={() => openRejectChangeModal(item)}>
                                            Reject
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
            onModify={handleAcceptChange} 
            data={modifyData} 
            />
        </div>
    );
};

export default RecurringSchedule;
