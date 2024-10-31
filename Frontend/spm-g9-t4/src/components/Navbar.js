// Navbar.jsx

"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const Navbar = ({ userType }) => {
  const pathname = usePathname(); // Get current path

  // retrieve user role from database
  
  const getTitle = () => {
    switch (userType) {
      case 'HR':
        return 'HR Manager & Senior Management';
      case 'Manager':
        return 'Manager';
      case 'Staff':
        return 'Staff';
      default:
        return 'User';
    }
  };

  const isActive = (path) => pathname === path;

  const renderLinks = () => {
    switch (userType) {
      case 'HR':
        return (
          <ul style={styles.navList}>
            <li style={isActive('/HR') ? styles.activeNavItem : styles.navItem}>
              <Link href="/HR">HR Home</Link>
            </li>
            <li
              style={isActive('/TeamScheduleHR') ? styles.activeNavItem : styles.navItem}
            >
              <Link href="/TeamScheduleHR">HR Scheduler</Link>
            </li>
          </ul>
        );
      case 'Manager':
        return (
          <ul style={styles.navList}>
            <li style={isActive('/manager-view') ? styles.activeNavItem : styles.navItem}>
              <Link href="/manager-view">Manager View</Link>
            </li>
            <li style={isActive('/request_view') ? styles.activeNavItem : styles.navItem}>
              <Link href="/request_view">Request View</Link>
            </li>
            <li style={isActive('/recurring_requests') ? styles.activeNavItem : styles.navItem}>
              <Link href="/recurring_requests">Recurring Request</Link>
            </li>
            
          </ul>
        );
        case 'Staff':
          return (
            <ul style={styles.navList}>
              <li style={isActive('/staff') ? styles.activeNavItem : styles.navItem}>
                <Link href="/staff">Own Schedule</Link>
              </li>
              <li style={isActive('/staff/team_schedule') ? styles.activeNavItem : styles.navItem}>
                <Link href="/staff/team_schedule">Team Schedule</Link>
              </li>
              <li style={isActive('/WFH_Application') ? styles.activeNavItem : styles.navItem}>
                <Link href="/WFH_Application">WFH Application</Link>
              </li>
              <li style={isActive('/adhoc_requests') ? styles.activeNavItem : styles.navItem}>
                <Link href="/adhoc_requests">View Ad-Hoc Requests</Link>
              </li>
              <li style={isActive('/recurring_requests') ? styles.activeNavItem : styles.navItem}>
                <Link href="/recurring_requests">View Recurring Requests</Link>
              </li>
              <li style={isActive('/recurring_arrangement_application') ? styles.activeNavItem : styles.navItem}>
                <Link href="/recurring_arrangement_application">Recurring Application</Link>
              </li>
            </ul>
          );
      default:
        return <p style={{ fontFamily: 'Calibri' }}>User type not found!</p>;
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logoContainer}>
        <Image src="/logo.png" alt="Company Logo" width={50} height={50} />
        <h2 style={styles.logoText}>{getTitle()}</h2>
      </div>
      <div style={styles.linksContainer}>{renderLinks()}</div>
    </nav>
  );
};

// CSS-in-JS Styles
const styles = {
  navbar: {
    backgroundColor: '#ffffff',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'Calibri, sans-serif',
    borderBottom: '1px solid #e0e0e0',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px', // Spacing between logo and text
  },
  logoText: {
    fontFamily: 'Calibri, sans-serif',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  linksContainer: {
    display: 'flex',
    gap: '20px',
  },
  navList: {
    display: 'flex',
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  navItem: {
    marginLeft: '15px',
    fontSize: '16px',
    padding: '8px 12px',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  activeNavItem: {
    marginLeft: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#DDD5F3',
    color: '#000000',
    borderRadius: '5px',
    padding: '8px 12px',
    boxSizing: 'border-box',
  },
};

export default Navbar;
