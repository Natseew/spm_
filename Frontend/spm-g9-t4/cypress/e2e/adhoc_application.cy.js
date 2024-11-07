describe('ArrangementForm Component', () => {
  beforeEach(() => {
    // Mock login by setting the user in sessionStorage
    cy.window().then((win) => {
      const user = { staff_id: '140001', role: '1', }; // Using staff_id 140001 for testing
      win.sessionStorage.setItem('user', JSON.stringify(user));
    });
    
    // Mock approved and pending dates
    cy.intercept('GET', '**/wfh_records/approved&pending_wfh_requests/**', {
      body: [
        new Date().toISOString(), // Today's date as an example of pending/approved date
      ],
    }).as('fetchApprovedDates');
    
    // Visit the protected route
    cy.visit('http://localhost:3000/adhoc_application');
    // cy.wait('@fetchApprovedDates');
  });

  it('should load the form and display elements correctly', () => {
    cy.contains('AdHoc WFH Request Application').should('be.visible');
    cy.contains('Choose your WFH Date').should('be.visible');
    cy.get('div.react-datepicker').should('be.visible'); // Verify DatePicker container is visible
    cy.contains('Schedule Type').should('be.visible');
    
    // Locate the "Reason" field using the specific visible textarea
    cy.get('div.MuiFormControl-root')
      .contains('Reason')
      .parent()
      .find('textarea')
      .not('[aria-hidden="true"]')
      .should('be.visible');

    cy.contains('Cancel').should('be.visible');
    cy.contains('Submit').should('be.visible');
  });

  it('should enable Submit button when required fields are filled', () => {
    // Open DatePicker by interacting with a known parent
    cy.get('div.react-datepicker').should('be.visible').click(); // Open DatePicker
    cy.get('.react-datepicker__day:not(.react-datepicker__day--weekend):not(.react-datepicker__day--disabled)')
      .first()
      .click(); // Select the first available weekday

    // Open the Material UI Select dropdown and choose "Full Day"
    cy.get('div.MuiFormControl-root').first().click(); // Refined selector for dropdown
    cy.contains('li', 'Full Day').click(); // Select the "Full Day" option

    // Enter a reason in the visible textarea
    cy.get('div.MuiFormControl-root')
      .contains('Reason')
      .parent()
      .find('textarea')
      .not('[aria-hidden="true"]')
      .type('Testing reason');
    
    // Check if Submit button is enabled
    cy.get('button').contains('Submit').should('not.be.disabled');
  });

  it('should submit the form and display success message', () => {
    // Open DatePicker and select a valid weekday
    cy.get('div.react-datepicker').should('be.visible').click();
    cy.get('.react-datepicker__day:not(.react-datepicker__day--weekend):not(.react-datepicker__day--disabled)')
      .first()
      .click();

    // Open the Material UI Select dropdown and choose "Full Day"
    cy.get('div.MuiFormControl-root').first().click();
    cy.contains('li', 'Full Day').click();

    // Enter a reason in the visible textarea
    cy.get('div.MuiFormControl-root')
      .contains('Reason')
      .parent()
      .find('textarea')
      .not('[aria-hidden="true"]')
      .type('Testing reason');
    
    // Mock successful submission response
    cy.intercept('POST', '**/wfh_records/wfh_adhoc_request', {
      statusCode: 200,
      body: { message: 'WFH request submitted successfully.' },
    }).as('submitRequest');
    
    // Submit and check for success message
    cy.get('button').contains('Submit').click();
    cy.wait('@submitRequest');
    cy.contains('WFH request submitted successfully.').should('be.visible');
  });

  it('should reset form when Cancel button is clicked', () => {
    // Open DatePicker and select a valid weekday
    cy.get('div.react-datepicker').click();
    cy.get('.react-datepicker__day:not(.react-datepicker__day--weekend):not(.react-datepicker__day--disabled)')
      .first()
      .click();
  
    // Open the Material UI Select dropdown and choose "Full Day"
    cy.get('div.MuiFormControl-root').first().click();
    cy.contains('li', 'Full Day').click();
  
    // Enter a reason in the visible textarea
    cy.get('div.MuiFormControl-root')
      .contains('Reason')
      .parent()
      .find('textarea')
      .not('[aria-hidden="true"]')
      .type('Testing cancel');
    
    // Click Cancel button to reset form
    cy.get('button').contains('Cancel').click();
    
    // Verify that dropdown is reset
    cy.get('div.MuiFormControl-root').first().should('not.contain', 'Full Day'); // Check it’s no longer showing "Full Day"
  
    // Verify that Reason textarea is reset
    cy.get('div.MuiFormControl-root')
      .contains('Reason')
      .parent()
      .find('textarea')
      .not('[aria-hidden="true"]')
      .should('have.value', '');
  
    // Verify DatePicker is still accessible and reset
    cy.get('.react-datepicker__day[aria-selected="true"]').should('not.exist');
  });
  

  it('should navigate between tabs', () => {
    cy.get('button').contains('RECURRING APPLICATION').click();
    cy.url().should('include', '/recurring_application');
    cy.get('button').contains('ADHOC-APPLICATION').click();
    cy.url().should('include', '/adhoc_application');
  });
});
