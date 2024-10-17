describe('Manager Adhoc Component', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:3000/manager-view'); // Adjust the URL if needed
  });

  it('should load the page and display the correct elements', () => {
    cy.contains('SESSION').should('be.visible');
    cy.contains('DEPARTMENT').should('be.visible');
    cy.get('input[type="checkbox"]').should('have.length', 10); // 8 departments + 2 session checkboxes
    cy.get('input[type="date"]').should('be.visible');
    cy.contains('Submit').should('be.visible');
  });

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
