// Notification.js
import React from 'react';

const Notification = ({ message, onClose }) => {
    return (
        <div className="notification" onClick={onClose} style={styles.notification}>
            {message}
        </div>
    );
};

const styles = {
    notification: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'grey', // Green background
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        zIndex: 1000,
    },
};

export default Notification;
