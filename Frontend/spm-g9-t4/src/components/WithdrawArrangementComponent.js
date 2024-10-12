import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Button, Dialog, DialogTitle, DialogActions } from '@mui/material';

const WfhRecordsTable = ({ staffId }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false); // State to control dialog visibility
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await fetch(`http://localhost:4000/wfh_records/${staffId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch records');
                }
                const data = await response.json();
                setRecords(data);
            } catch (err) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [staffId]);

    const handleWithdraw = async (recordid) => {
        try {
            const response = await fetch(`http://localhost:4000/wfh_records/withdraw/${recordid}`, {
                method: 'PUT', 
            });
            if (!response.ok) {
                throw new Error('Failed to withdraw record');
            }
            // Optionally, refresh the records
            setRecords((prevRecords) => prevRecords.filter(record => record.recordid !== recordid));
            // Set success message and open dialog
            setStatusMessage('Successfully withdrawn');
            setOpen(true);
        } catch (err) {
            console.error(err);
            setStatusMessage('Error withdrawing record');
            setOpen(true);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Record ID</TableCell>
                            <TableCell>Staff ID</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Timeslot</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Action</TableCell> {/* Added for the button */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.map((record) => (
                            <TableRow key={record.recordid}>
                                <TableCell>{record.recordid}</TableCell>
                                <TableCell>{record.staffid}</TableCell>
                                <TableCell>{new Date(record.wfh_date).toLocaleDateString()}</TableCell>
                                <TableCell>{record.timeslot}</TableCell>
                                <TableCell>{record.request_reason || 'N/A'}</TableCell>
                                <TableCell>{record.status}</TableCell>
                                <TableCell>
                                    <Button 
                                        variant="contained" 
                                        color="secondary" 
                                        onClick={() => handleWithdraw(record.recordid)} // Call withdraw function
                                    >
                                        Withdraw Arrangement
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{statusMessage}</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default WfhRecordsTable;
