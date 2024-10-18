describe('RecurringArrangementPage Component', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000/recurring_arrangement_application');
    });
  
    it('should load the page and display necessary elements', () => {
      cy.contains('WFH Recurring Request Application').should('be.visible');
      cy.get('input[type="date"]').should('have.length', 2); // Start and End Date
      cy.contains('Day of the Week').should('be.visible');
      cy.contains('Timeslot').should('be.visible');
      cy.contains('Reason').should('be.visible');
      cy.contains('Submit').should('be.visible');
      cy.contains('Cancel').should('be.visible');
    });
  
    it('should allow date selection', () => {
      const startDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
      const endDate = dayjs().add(5, 'day').format('YYYY-MM-DD');
      cy.get('input[type="date"]').first().type(startDate).should('have.value', startDate);
      cy.get('input[type="date"]').last().type(endDate).should('have.value', endDate);
    });
  
    it('should allow selecting day of the week', () => {
      cy.get('input[name="dayOfWeek"]').select('1').should('have.value', '1'); // Monday
    });
  
    it('should allow selecting timeslot', () => {
      cy.get('input[name="timeslot"]').select('AM').should('have.value', 'AM');
    });
  
    it('should require all fields to be filled out before submission', () => {
      cy.contains('Submit').click();
      cy.contains('Please fill out all required fields.').should('be.visible'); // Assuming you have a validation message
    });
  
    it('should submit the form successfully and display a confirmation message', () => {
      const startDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
      const endDate = dayjs().add(5, 'day').format('YYYY-MM-DD');
      cy.get('input[type="date"]').first().type(startDate);
      cy.get('input[type="date"]').last().type(endDate);
      cy.get('input[name="dayOfWeek"]').select('1'); // Monday
      cy.get('input[name="timeslot"]').select('AM');
      cy.get('textarea').type('Need to work from home for personal reasons.');
      cy.contains('Submit').click();
      
      // Assuming you expect a status message after submission
      cy.contains('Request submitted successfully!').should('be.visible'); 
    });
  
    it('should show an error message for unsuccessful submission', () => {
      cy.intercept('POST', '/recurring_request/submit', {
        statusCode: 400,
        body: { message: 'Bad Request' }
      }).as('submitRequest');
  
      cy.get('input[type="date"]').first().type(dayjs().format('YYYY-MM-DD'));
      cy.get('input[name="dayOfWeek"]').select('1');
      cy.get('input[name="timeslot"]').select('AM');
      cy.get('textarea').type('Reason for request.');
      cy.contains('Submit').click();
      
      cy.wait('@submitRequest');
      cy.contains('Error: Bad Request').should('be.visible'); // Check for error message
    });
  
    it('should close the dialog when the close button is clicked', () => {
      // Assuming the dialog opens on submission
      cy.get('input[type="date"]').first().type(dayjs().format('YYYY-MM-DD'));
      cy.contains('Submit').click();
      
      cy.get('button').contains('Close').click();
      cy.get('dialog').should('not.exist'); // Check that the dialog is closed
    });
  });
  