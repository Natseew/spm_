// describe('Recurring Arrangement Page', () => {
//   beforeEach(() => {
//     cy.visit('http://localhost:3000/recurring_arrangement_application'); // Adjust to the correct route
//   });

//   it('should load the page correctly', () => {
//     cy.get('h6').contains('WFH Recurring Request Application');
//   });

//   it('should fill out the form and submit successfully', () => {
//     // Fill in the start date
//     cy.get('input[placeholder="Start Date"]').click().type('2024-10-01'); // Adjust date format as necessary

//     // Fill in the end date
//     cy.get('input[placeholder="End Date"]').click().type('2024-10-15'); // Adjust date format as necessary

//     // Select day of the week
//     cy.get('input[name="dayOfWeek"]').select('Monday');

//     // Select timeslot
//     cy.get('input[name="timeslot"]').select('AM');

//     // Fill in the reason
//     cy.get('textarea').type('Working from home for project work.');

//     // Mocking API response for success
//     cy.intercept('POST', '**/recurring_request/submit', {
//       statusCode: 200,
//       body: { message: 'Request submitted successfully!' },
//     }).as('submitRequest');

//     // Submit the form
//     cy.get('button').contains('Submit').click();

//     // Verify success dialog appears
//     cy.get('h2').contains('Request submitted successfully!'); // Adjust selector as necessary
//   });

//   it('should not submit the form if required fields are empty', () => {
//     // Click submit without filling the form
//     cy.get('button').contains('Submit').click();

//     // Check that error messages are displayed for required fields
//     cy.get('input[placeholder="Start Date"]').should('be.empty');
//     cy.get('input[placeholder="End Date"]').should('be.empty');
//     cy.get('input[name="dayOfWeek"]').should('have.value', '');
//     cy.get('textarea').should('be.empty');
//   });

//   it('should reset form fields on cancel button click', () => {
//     // Fill in some fields
//     cy.get('input[placeholder="Start Date"]').click().type('2024-10-01');
//     cy.get('input[placeholder="End Date"]').click().type('2024-10-15');

//     // Click cancel
//     cy.get('button').contains('Cancel').click();

//     // Check if fields are reset
//     cy.get('input[placeholder="Start Date"]').should('be.empty');
//     cy.get('input[placeholder="End Date"]').should('be.empty');
//     cy.get('input[name="dayOfWeek"]').should('have.value', '');
//     cy.get('textarea').should('be.empty');
//   });
// });
