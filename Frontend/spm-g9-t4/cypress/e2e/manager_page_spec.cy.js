describe('Manager Adhoc Component', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:3000/manager-view'); // Adjust the URL if needed
  });

  it('should load the page and display the correct elements', () => {
    cy.contains('Employee Timetable Display').should('be.visible');
    cy.contains('Employee Timetable Display').should('be.visible');
    // cy.contains('DEPARTMENT').should('be.visible');
    // cy.get('input[type="checkbox"]').should('have.length', 10); // 8 departments + 2 session checkboxes
    // cy.get('input[type="date"]').should('be.visible');
    // cy.contains('Submit').should('be.visible');
  });

  // Testing for POST Request with ManagerID
  beforeEach(() => {
    // Mocking the API response for employee data
    cy.intercept('POST', 'http://localhost:4000/employee/by-manager/130002', {
      statusCode: 200,
      body: [
        { staff_id: 130002, staff_fname: 'Jack', staff_lname: 'Sim' },
      ],
    }).as('getEmployees');

    // Mocking the API response for WFH records
    cy.intercept('POST', 'http://localhost:4000/wfh_records/by-employee-ids', {
      statusCode: 200,
      body: [
        {
          recordid: 1,
          staffid: 140001,
          wfh_date: '2024-10-20',
          timeslot: 'AM',
          status: 'Pending',
          request_reason: 'Need to focus on project',
        },
        {
          recordid: 2,
          staffid: 150008,
          wfh_date: '2024-10-22',
          timeslot: 'PM',
          status: 'Approved',
          request_reason: 'Annual leave',
        },
      ],
    }).as('getWfhRecords');

    cy.visit('http://localhost:3000/manager-view'); // Adjust URL based on your routing
  });


// Testing for Loading Visible
  it('should display loading initially', () => {
    // Before data loads
    cy.contains('Loading...').should('be.visible');
  });

// Testing for Filters Visible
  it('should render filters after loading', () => {

    // Once loaded, check for filter elements
    cy.contains('Filter By Status:').should('be.visible');
    cy.contains('Filter Date:').should('be.visible');
  });


  // Testing the Accept Buttons 
  it('should allow Accept button to approve requests', () => {
    // cy.wait('@getEmployees');
    // cy.wait('@getWfhRecords');

    cy.intercept('PATCH', '/wfh_records/accept/1', {
      statusCode: 200,
      body: { message: 'Status updated to approved.', record: { status: 'Approved' } },
    }).as('acceptRequest');

    // Simulate clicking the Accept button
    cy.get('button').contains('Accept').first().click();
    cy.wait('@acceptRequest');

    // Check for success notification
    cy.get('.notification').should('contain', 'Request accepted successfully!');
  });

// Testing the Reject Button
it('should allow Reject button to reject requests', () => {
  // cy.wait('@getEmployees');
  // cy.wait('@getWfhRecords');

  cy.intercept('PATCH', '/wfh_records/reject/*', {
    statusCode: 200,
    body: { message: 'Rejection reason updated successfully.', record: { status: 'Rejected', reject_reason: 'Not needed' } },
  }).as('rejectRequest');

  // Simulate clicking the Reject button
  cy.get('button').contains('Reject').first().click();
  
  // Assume you've implemented a textarea in your HandleRejectModal
  cy.get('textarea').type('Not needed'); // provided reason for rejection
  cy.get('button').contains('Submit').click(); // Submit button for the modal

  cy.wait('@rejectRequest');

    // Check for success notification
    cy.get('.notification').should('contain', 'Request rejected!');
  });


// Testing the Filter Record based on Selected Status
it('should filter records based on selected status', () => {
  cy.wait('@getEmployees');
  cy.wait('@getWfhRecords');

  // Change status to "Approved"
  cy.get('button').contains('Approved').click();
  cy.get('td').contains('Approved').should('exist'); // Check if approved requests are displayed
  cy.get('td').contains('Pending').should('not.exist'); // Ensure pending requests are hidden
});

// Testing the Filter Record based on Selected Date.
it('should update date filtering', () => {
  cy.wait('@getEmployees');
  cy.wait('@getWfhRecords');

  // Input a date to filter on
  cy.get('input[type="date"]').type('2024-10-20');
  cy.get('input[type="date"]').should('have.value', '2024-10-20');

  // Ensure only the filtered date's records are visible
  cy.get('td').contains('2024-10-20').should('exist'); // Check if entries for this date are present
  cy.get('td').contains('2024-10-22').should('not.exist'); // Make sure other entries are not displayed
});


// // Testing Accept Button on Pending Withdrawal
// it('should only show Accept button for Pending Withdrawal', () => {
//   // Mock interface to have pending withdrawal entries
//   cy.intercept('POST', 'http://localhost:4000/wfh_records/by-employee-ids', {
//       statusCode: 200,
//       body: [
//           {
//               recordid: 3,
//               staffid: 130002,
//               wfh_date: '2024-10-25',
//               timeslot: 'AM',
//               status: 'Pending Withdrawal',
//               request_reason: 'Medical leave',
//           },
//       ],
//   }).as('getPendingWithdrawal');

//   cy.wait('@getEmployees');
//   cy.wait('@getPendingWithdrawal');
  
//   cy.get('button').contains('Pending Withdrawal').click(); // Set Filter to Pending Withdrawal
//   cy.get('tbody tr').should('have.length', 1); // Ensure there's one entry for this status

//   // Confirm that the Accept button is rendered
//   cy.get('button').contains('Accept').should('exist');
//   // Ensure that Reject button does NOT exist
//   cy.get('button').contains('Reject').should('not.exist');
// });


  // it('should display error message when fetch fails', () => {
  //   // Simulate an API failure
  //   cy.intercept('POST', 'http://localhost:4000/employee/by-manager/130002', {
  //     statusCode: 500,
  //     body: { message: 'Internal server error' },
  //   }).as('failedGetEmployees');

  //   // cy.visit('http://localhost:3000/manager-view');
  //   cy.wait('@failedGetEmployees');

  //   // Expect to see an error message
  //   cy.contains('Error:').should('be.visible');
  // });

})



// describe('ManagerAdHocComponent', () => {
//   beforeEach(() => {
//     cy.intercept('POST', 'http://localhost:4000/employee/by-manager/130002', {
//       statusCode: 200,
//       body: [
//         // Mocked employee data
//         { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe' },
//       ],
//     }).as('getEmployees');

//     cy.intercept('POST', 'http://localhost:4000/wfh_records/by-employee-ids', {
//       statusCode: 200,
//       body: [
//         // Include mocked WFH records data
//         {
//           staffid: 1,
//           recordid: 101,
//           wfh_date: '2024-05-15',
//           timeslot: 'AM',
//           status: 'Pending',
//           request_reason: 'Need to focus on project',
//         },
//       ],
//     }).as('getWfhRecords');

//     cy.visit('http://localhost:4000/employee/by-manager/130002'); // Adjust URL path if needed
//   });

//   it('should display loading initially', () => {
//     cy.contains('Loading...').should('be.visible');
//   });

//   it('renders error message when fetch fails', () => {
//     cy.intercept('POST', 'http://localhost:4000/employee/by-manager/130002', {
//       statusCode: 500,
//       body: { message: 'Internal server error' },
//     }).as('failedGetEmployees');

//     cy.visit('/your-ad-hoc-schedule-path');
//     cy.wait('@failedGetEmployees');

//     cy.contains('Error:').should('be.visible');
//   });

//   it('displays filters after loading', () => {
//     cy.wait('@getEmployees');
//     cy.wait('@getWfhRecords');
    
//     cy.contains('Filter By Status:').should('be.visible');
//     cy.contains('Filter Date:').should('be.visible');
//   });

//   it('allows Accept button to approve requests', () => {
//     cy.wait('@getEmployees');
//     cy.wait('@getWfhRecords');

//     cy.intercept('PATCH', '/wfh_records/accept/101', {
//       statusCode: 200,
//       body: { message: 'Status updated to approved.', record: { status: 'Approved' } }
//     }).as('acceptRequest');
    
//     cy.get('button').contains('Accept').click();
//     cy.wait('@acceptRequest');

//     cy.get('.notification').should('contain', 'Request accepted successfully!');
//   });

//   it('allows Reject button to reject requests', () => {
//     cy.wait('@getEmployees');
//     cy.wait('@getWfhRecords');

//     cy.intercept('PATCH', '/wfh_records/reject/101', {
//       statusCode: 200,
//       body: { message: 'Rejection reason updated successfully.', record: { status: 'Rejected', reject_reason: 'Personal reasons' } }
//     }).as('rejectRequest');
    
//     cy.get('button').contains('Reject').click();
//     cy.get('textarea').type('Personal reasons'); // Assuming you have a textarea for rejection reason
//     cy.get('button').contains('Submit').click(); // Assuming a submit button in your Reject modal
    
//     cy.wait('@rejectRequest');

//     cy.get('.notification').should('contain', 'Request rejected!');
//   });

//   it('allows changing status through buttons', () => {
//     cy.wait('@getEmployees');
//     cy.wait('@getWfhRecords');
//     cy.get('button').contains('Approved').click();
//     cy.get('button').contains('Approved').should('have.class', 'bg-blue-500 text-white');
//   });

//   it('filters data by date correctly', () => {
//     cy.wait('@getEmployees');
//     cy.wait('@getWfhRecords');
    
//     cy.get('input[type="date"]').type('2024-05-15');
//     cy.get('input[type="date"]').should('have.value', '2024-05-15');
//   });
// });
