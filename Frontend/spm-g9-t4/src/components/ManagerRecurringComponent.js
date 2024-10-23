import React, { useState, useEffect } from 'react';
import RecurringModal from './RecurringModal';
import HandleReccuringRejectModal from './HandleReccuringRejectModal';
import Notification from './Notification';

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
    const [modalData, setModalData] = useState(null);
    const [someData, setSomeData] = useState(null);
    const [modalDates, setModalDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);

    useEffect(() => {
        const fetchEmployeeAndRecurringData = async () => {
            try {
                // Note to Zhen Yue: Comment out mine and uncomment yours  
                // const idResponse = await fetch(`http://localhost:4000/employee/by-manager/${ManagerID}`);
                const idResponse = await fetch(`http://localhost:4000/employee/by-manager/${YZManagerID}`);
                if (!idResponse.ok) {
                    throw new Error(`Error fetching employee IDs: ${idResponse.status}`);
                }
                const employeeData = await idResponse.json();
                const ids = employeeData.map(emp => emp.staff_id);
                setEmployeeIds(ids);

                employeeData.forEach(emp => {
                    employeeNameid[emp.staff_id] = `${emp.staff_fname} ${emp.staff_lname}`;
                });

                const wfhResponse = await fetch('http://localhost:4000/recurring_request/by-employee-ids', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeIds: ids }),
                });

                if (!wfhResponse.ok) {
                    throw new Error(`Error fetching Recurring WFH records: ${wfhResponse.status}`);
                }

                const wfhData = await wfhResponse.json();
                console.log('Recurring WFH Data:', wfhData);
                setRecurringData(wfhData);
            } catch (error) {
                console.error('Error during fetch operations:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployeeAndRecurringData();
    }, []);

    const openModal = (data) => {
        setModalData(data);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalData({});
    };

    const openRejectModal = (data) => {
        setSomeData(data);
        setModalDates(data.wfh_dates || []);
        setRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setSomeData(null);
        setModalDates([]);
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
            // If filtering by 'Pending Change', check if any wfh_records have that status
            statusMatches = item.wfh_records.some(record => record.status === 'Pending Change');
        } else {
            // For other statuses, check the parent status only
            statusMatches = item.status === selectedStatus;
        }
        return statusMatches && dateMatches;
    });
    

    const getStaffName = (id) => {
        const name = employeeNameid[Number(id)] || 'Unknown';
        return name;
    };

    const FormatDateToDayofweek = (num) => {
        const dayofweek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayofweek[num - 1];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date'; // Handle null or undefined dates
        return dateString.split('T')[0]; // Split at 'T' and take the first part
    };
    
    
    const handleAcceptChange = async (reqId) => {
        console.log(`Accepting change request with ID: ${reqId}`);
    };

    const handleRejectChange = async (reqId) => {
        console.log(`Rejecting change request with ID: ${reqId}`);
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

            {/* Recurring Data Table */}
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                <thead className="bg-gray-500 text-white">
                    <tr className="text-center">
                        <th className="py-2 px-4 border-b border-gray-300">Request ID</th>
                        <th className="py-2 px-4 border-b border-gray-300">Staff ID</th>
                        <th className="py-2 px-4 border-b border-gray-300">Name</th>
                        <th className="py-2 px-4 border-b border-gray-300">WFH Date</th>
                        <th className="py-2 px-4 border-b border-gray-300">Timeslot</th>
                        <th className="py-2 px-4 border-b border-gray-300">
                            {selectedStatus === 'Pending Change' ? 'Requested Change Date' : 'Actions'}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((item, index) => (
                        <tr key={item.req_id || index} className="text-center hover:bg-blue-100 transition-colors">
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.requestid}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.staff_id}</td>
                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{getStaffName(item.staff_id)}</td>

                            {/* WFH Date Column */}
                            <td className="py-2 px-4 border-b border-gray-300">
                                {
                                    (() => {
                                        const pendingChangeRecord = item.wfh_records ? item.wfh_records.find(record => record.status === 'Pending Change') : null;
                                        if (pendingChangeRecord && pendingChangeRecord.wfh_date) {
                                            return formatDate(pendingChangeRecord.wfh_date);
                                        }
                                        return 'No Pending Change';
                                    })()
                                }
                            </td>

                            <td className="py-2 px-4 border-b bg-white-400 border-gray-300">{item.timeslot}</td>

                            {/* Requested Change Date Column */}
                            {selectedStatus === 'Pending Change' ? (
                                <td className="py-2 px-4 border-b border-gray-300">
                                    {
                                        (() => {
                                            const pendingChangeRecord = item.wfh_records ? item.wfh_records.find(record => record.status === 'Pending Change') : null;
                                            if (pendingChangeRecord && pendingChangeRecord.wfh_date) {
                                                return (
                                                    <div>
                                                        {formatDate(pendingChangeRecord.wfh_date)}
                                                        {/* Add Accept and Reject Buttons */}
                                                        <div className="mt-2">
                                                            <button 
                                                                className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
                                                                onClick={() => handleAcceptChange(item.req_id)}
                                                            >
                                                                Accept Change
                                                            </button>
                                                            <button 
                                                                className="bg-red-500 text-white px-2 py-1 rounded" 
                                                                onClick={() => handleRejectChange(item.req_id)}
                                                            >
                                                                Reject Change
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return 'No Pending Change';
                                        })()
                                    }
                                </td>
                            ) : (
                                <td className="py-2 px-4 border-b border-gray-300">
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded mx-6" onClick={() => openModal(item)}>
                                        View Details
                                    </button>
                                    {item.status === 'Pending' && (
                                        <>
                                            <button className="bg-green-500 text-white px-2 py-1 rounded mr-2" onClick={() => handleAcceptChange(item.req_id)}>
                                                Accept
                                            </button>
                                            <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleRejectChange(item.req_id)}>
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>



            {/* Modals */}
            <RecurringModal isOpen={modalOpen} onClose={closeModal} data={modalData} />
            <HandleReccuringRejectModal isOpen={rejectModalOpen} onClose={closeRejectModal} onReject={handleRejectChange} data={someData} dates={modalDates} />
        </div>
    );
};

export default RecurringSchedule;
