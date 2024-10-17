import React, { useEffect } from 'react';

const EmailSender = () => {
    // Define email details
    const emailData = {
    email: 'recipient@example.com', // Replace with the recipient's email
    subject: 'Hello from Vercel!',  // Customize your subject line
    message: 'This is a test email sent from a Vercel function.', // Customize your message
    };

    const sendEmail = async () => {
    try {
        const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
        });

        if (!response.ok) {
        throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Email sent successfully!', data);
        
    } catch (error) {
        console.error('Error sending email:', error);
    }
    };

    useEffect(() => {
    sendEmail(); // Call sendEmail when component mounts
    }, []); // Empty dependency array ensures this runs once on mount

    return (
    <div>
        <p>Sending email...</p>
    </div>
    );
    };

export default EmailSender;
