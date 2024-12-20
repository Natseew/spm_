// cypress/integration/staffSchedule.spec.js

describe('Staff Schedule Page', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      const user = {
        reporting_manager: '160008', // Replace with the actual reporting manager ID you want to test
        role: '1',
        // Add other user fields if necessary
      };
      win.sessionStorage.setItem('user', JSON.stringify(user));
    });
    // Visit the page before each test
    cy.visit('http://localhost:3000/staff/team_schedule'); // Update with the actual path to your page
  });

  it('should render the date range picker', () => {
    // Check if the loading spinner is visible initially
    cy.get('.rdrCalendarWrapper').should('be.visible'); // Adjust this selector based on your spinner implementation
  });

  it('should allow the user to select a date range', () => {
    // Select the date range input and change the date
    cy.wait(1000); // Adjust as needed based on your loading time
    cy.get('.rdrCalendarWrapper').click(); // Adjust selector as needed
    cy.get('.rdrDayStartOfMonth').first().click(); // Click the first day
    cy.get('.rdrDayEndOfMonth').last().click(); // Click the last day

    // You can add a wait to allow data fetching
    cy.wait(1000); // Adjust as needed based on your loading time
  });

});

  // it('should display the fetched staff data', () => {
  //   // Intercept the API call
  //   cy.intercept('**/wfh_records/team-schedule-v2/**', {
  //     fixture: 'staffSchedule.json', // Use the mock data from the fixture
  //   }).as('getStaffSchedule');
  //   // You can add a wait to allow data fetching
  //   cy.wait(1000); // Adjust as needed based on your loading time
  //   // Open the date range picker and select dates to trigger the fetch
  //   cy.get('.rdrCalendarWrapper').click(); // Adjust selector as needed
  //   cy.get('.rdrDayStartOfMonth').first().click(); // Click the first day
  //   cy.get('.rdrDayEndOfMonth').last().click() // Click the last day
  //   cy.wait(1000);
  //   // Verify the data appears in the DataGrid
  //   cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0); // Ensure rows are rendered
  //   cy.get('.MuiDataGrid-cell').contains('John Doe'); // Check for specific data; update as needed
  // });