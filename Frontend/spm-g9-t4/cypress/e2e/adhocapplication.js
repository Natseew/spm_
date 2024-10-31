describe('ArrangementForm Component', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000/adhoc_application');
    });
  
    it('should load the form and display elements correctly', () => {
      cy.contains('AdHoc WFH Request Application').should('be.visible');
      cy.contains('Choose your WFH Date').should('be.visible');
      cy.contains('Schedule Type').should('be.visible');
      cy.get('textarea[placeholder="Reason"]').should('be.visible');
      cy.contains('Cancel').should('be.visible');
      cy.contains('Submit').should('be.visible');
    });
  
    it('should disable Submit button if required fields are empty', () => {
      cy.get('button').contains('Submit').should('be.disabled');
    });
  
    it('should enable Submit button when required fields are filled', () => {
      cy.get('input[placeholder="Select WFH Date"]').click().type('2024-12-01');
      cy.get('div[role="button"]').contains('Full Day').click();
      cy.get('textarea[placeholder="Reason"]').type('Testing reason');
      cy.get('button').contains('Submit').should('not.be.disabled');
    });
  
    it('should submit the form and display success message', () => {
      cy.get('input[placeholder="Select WFH Date"]').click().type('2024-12-01');
      cy.get('div[role="button"]').contains('Full Day').click();
      cy.get('textarea[placeholder="Reason"]').type('Testing reason');
      cy.get('button').contains('Submit').click();
  
      cy.contains('WFH request submitted successfully.').should('be.visible');
    });
  
    it('should display error message when submission fails', () => {
      cy.intercept('POST', '**/wfh_records/wfh_adhoc_request', { statusCode: 500 }).as('submitRequest');
      cy.get('input[placeholder="Select WFH Date"]').click().type('2024-12-01');
      cy.get('div[role="button"]').contains('Full Day').click();
      cy.get('textarea[placeholder="Reason"]').type('Testing error');
      cy.get('button').contains('Submit').click();
  
      cy.contains('An error occurred. Please try again.').should('be.visible');
    });
  
    it('should reset form when Cancel button is clicked', () => {
      cy.get('input[placeholder="Select WFH Date"]').click().type('2024-12-01');
      cy.get('div[role="button"]').contains('Full Day').click();
      cy.get('textarea[placeholder="Reason"]').type('Testing cancel');
      cy.get('button').contains('Cancel').click();
  
      cy.get('input[placeholder="Select WFH Date"]').should('not.have.value');
      cy.get('textarea[placeholder="Reason"]').should('have.value', '');
    });
  
    it('should navigate between tabs', () => {
      cy.get('button').contains('RECURRING APPLICATION').click();
      cy.url().should('include', '/recurring_application');
      cy.get('button').contains('ADHOC-APPLICATION').click();
      cy.url().should('include', '/adhoc_application');
    });
  });
  