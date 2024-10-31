"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [userType, setUserType] = useState(null); // Initialize userType as null
  const [loading, setLoading] = useState(true); // Loading state to prevent immediate redirection

  useEffect(() => {
    // Retrieve user data from session storage on the client side
    if (typeof window !== 'undefined') {
      try {
        const storedUser = JSON.parse(window.sessionStorage.getItem("user"));
        console.log("Stored User:", storedUser); // Debugging: Check the stored user data

        if (storedUser && storedUser.role) {
          // Set userType based on the role in session storage
          switch (storedUser.role) {
            case 1:
              setUserType("HR");
              break;
            case 2:
              setUserType("Manager");
              break;
            case 3:
              setUserType("Staff");
              break;
            default:
              setUserType("User");
          }
        } else {
          // Redirect to login only if no valid user data is found
          router.push("/");
        }
      } catch (error) {
        console.error("Error reading session storage:", error);
        router.push("/");
      } finally {
        setLoading(false); // Set loading to false after checking session storage
      }
    }
  }, []);

  if (loading) return null; // Prevent the component from rendering until session is checked

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
    let links = [];

    if (userType === "HR") {
      links = [
        { href: '/HR', label: 'HR Home' },
        { href: '/TeamScheduleHR', label: 'HR Scheduler' }
      ];
    } else if (userType === "Manager") {
      links = [
        { href: '/manager-view', label: 'Manager View' },
        { href: '/request_view', label: 'Request View' },
        { href: '/recurring_requests', label: 'Recurring Request' },
        { href: '/staff', label: 'Own Schedule' },
        { href: '/staff/team_schedule', label: 'Team Schedule' },
        { href: '/WFH_Application', label: 'WFH Application' },
        { href: '/adhoc_requests', label: 'View Ad-Hoc Requests' },
        { href: '/recurring_requests', label: 'View Recurring Requests' },
        { href: '/recurring_arrangement_application', label: 'Recurring Application' }
      ];
    } else if (userType === "Staff") {
      links = [
        { href: '/staff', label: 'Own Schedule' },
        { href: '/staff/team_schedule', label: 'Team Schedule' },
        { href: '/WFH_Application', label: 'WFH Application' },
        { href: '/adhoc_requests', label: 'View Ad-Hoc Requests' },
        { href: '/recurring_requests', label: 'View Recurring Requests' },
        { href: '/recurring_arrangement_application', label: 'Recurring Application' }
      ];
    }

    return (
      <ul style={styles.navList}>
        {links.map(({ href, label }) => (
          <li key={href} style={isActive(href) ? styles.activeNavItem : styles.navItem}>
            <Link href={href}>{label}</Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logoContainer}>
        <Image src="/logo.png" alt="Company Logo" width={50} height={30} /> {/* Logo set to 50x30 */}
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
    gap: '12px', // Space between logo and title
  },
  logoText: {
    fontFamily: 'Calibri, sans-serif',
    fontSize: '18px', // Original title size
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
    fontSize: '12px', // Set nav item font size to 12px
    padding: '8px 12px',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  activeNavItem: {
    marginLeft: '15px',
    fontSize: '12px', // Set active nav item font size to 12px
    fontWeight: 'bold',
    backgroundColor: '#DDD5F3',
    color: '#000000',
    borderRadius: '5px',
    padding: '8px 12px',
    boxSizing: 'border-box',
  },
};

export default Navbar;
