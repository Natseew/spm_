describe('Recurring Arrangement Page', () => {
    // Visit the page before each test
    beforeEach(() => {
      cy.visit('http://localhost:3000/recurring_requests'); // Adjust the URL as necessary for your app
    });
  
    // Test 1: Ensure the page loads successfully
    it('should load the recurring arrangement page', () => {
      cy.contains('Recurring WFH Request Application'); // Ensure the title is present
      cy.get('form').should('be.visible'); // Ensure the form is visible
    });
  
    // Test 2: Test successful form submission with valid data
    it('should successfully submit the form with valid data', () => {
      // Intercept the POST request to mock the API response
      cy.intercept('POST', `${Cypress.env('API_URL')}recurring_request/submit`, {
        statusCode: 201,
        body: { message: 'Recurring WFH request submitted successfully' },
      }).as('submitRequest');
  
      // Fill the form with valid data
      cy.get('[name="startDate"]').click().type('2024/11/01'); // Start Date
      cy.get('[name="endDate"]').click().type('2024/11/30'); // End Date
      cy.get('[name="dayOfWeek"]').select('1'); // Monday
      cy.get('[name="timeslot"]').select('AM'); // AM
      cy.get('[name="reason"]').type('Work from home due to project deadlines'); // Reason
  
      // Submit the form
      cy.get('button[type="submit"]').click();
  
      // Wait for the POST request and check if it's successful
      cy.wait('@submitRequest').its('response.statusCode').should('eq', 201);
  
      // Check for the success message
      cy.contains('Recurring WFH request submitted successfully').should('be.visible');
    });
  
    // Test 3: Test form submission with missing required fields (error case)
    it('should show an error when required fields are missing', () => {
      // Intercept the POST request to mock an error response
      cy.intercept('POST', `${Cypress.env('API_URL')}recurring_request/submit`, {
        statusCode: 400,
        body: { message: 'Staff ID, start date, end date, day of week, request reason, and timeslot are required.' },
      }).as('submitRequest');
  
      // Click the submit button without filling in the form
      cy.get('button[type="submit"]').click();
  
      // Wait for the POST request and check the error response
      cy.wait('@submitRequest').its('response.statusCode').should('eq', 400);
  
      // Check for the error message
      cy.contains('Staff ID, start date, end date, day of week, request reason, and timeslot are required.').should('be.visible');
    });
  
    // Test 4: Test form submission with invalid timeslot
    it('should show an error when the timeslot is invalid', () => {
      // Intercept the POST request to mock an error response
      cy.intercept('POST', `${Cypress.env('API_URL')}recurring_request/submit`, {
        statusCode: 400,
        body: { message: 'Timeslot must be either AM, PM, or FD (Full Day).' },
      }).as('submitRequest');
  
      // Fill the form with invalid data
      cy.get('[name="startDate"]').click().type('2024/11/01'); // Start Date
      cy.get('[name="endDate"]').click().type('2024/11/30'); // End Date
      cy.get('[name="dayOfWeek"]').select('1'); // Monday
      cy.get('[name="timeslot"]').select('INVALID'); // Invalid Timeslot
      cy.get('[name="reason"]').type('Work from home due to project deadlines'); // Reason
  
      // Submit the form
      cy.get('button[type="submit"]').click();
  
      // Wait for the POST request and check the error response
      cy.wait('@submitRequest').its('response.statusCode').should('eq', 400);
  
      // Check for the error message
      cy.contains('Timeslot must be either AM, PM, or FD (Full Day).').should('be.visible');
    });
  
    // Test 5: Ensure that the form resets when canceled
    it('should reset the form when canceled', () => {
      // Fill the form with some data
      cy.get('[name="startDate"]').click().type('2024/11/01'); // Start Date
      cy.get('[name="endDate"]').click().type('2024/11/30'); // End Date
      cy.get('[name="dayOfWeek"]').select('1'); // Monday
      cy.get('[name="timeslot"]').select('AM'); // AM
      cy.get('[name="reason"]').type('Work from home due to project deadlines'); // Reason
  
      // Check that the form is filled
      cy.get('[name="startDate"]').should('have.value', '2024/11/01');
      cy.get('[name="endDate"]').should('have.value', '2024/11/30');
      cy.get('[name="reason"]').should('have.value', 'Work from home due to project deadlines');
  
      // Click the Cancel button
      cy.get('button[color="secondary"]').click();
  
      // Check that the form is reset
      cy.get('[name="startDate"]').should('have.value', '');
      cy.get('[name="endDate"]').should('have.value', '');
      cy.get('[name="reason"]').should('have.value', '');
    });
  });
  