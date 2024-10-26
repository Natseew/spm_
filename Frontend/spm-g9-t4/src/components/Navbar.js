import React from 'react';
import { useRouter } from 'next/router';

const Navbar = () => {
    const router = useRouter();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#333',
            padding: '10px 20px',
            height: '60px'
        }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img src="logo.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
            </a>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button style={buttonStyle} onClick={() => router.push('/manager-view')}>Manager View</button>
                <button style={buttonStyle} onClick={() => router.push('/HR')}>HR</button>
                <button style={buttonStyle} onClick={() => router.push('/team_schedule')}>Team Schedule</button>
                {/* Add more navigation as needed */}
                <button style={buttonStyle} onClick={() => router.push('/')}>Home</button> {/* Optional Home Button */}
            </div>
        </div>
    );
};

const buttonStyle = {
    backgroundColor: '#555',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    margin: '0 5px'
};

export default Navbar;
