import dayjs from 'dayjs';

describe('HRPage Component', () => {
  beforeEach(() => {
    // Setting up session storage with a test user and visiting the HR page
    cy.window().then((win) => {
      const user = { staff_id: '140001', role: '1' };
      win.sessionStorage.setItem('user', JSON.stringify(user));
    });
    cy.visit('http://localhost:3000/HR');
  });

  it('should load the page and display the correct elements', () => {
    // Verify visibility of main page sections
    cy.contains('SESSION').should('be.visible');
    cy.contains('DEPARTMENT').should('be.visible');
    cy.get('input[type="checkbox"]').should('have.length', 10);
    cy.get('.rdrCalendarWrapper').should('be.visible');
    cy.contains('Submit').should('be.visible');
  });

  it('should allow session selection', () => {
    // Check and verify session checkboxes
    cy.get('input[name="AM"]').check().should('be.checked');
    cy.get('input[name="PM"]').check().should('be.checked');
  });

  it('should allow department selection', () => {
    // Check and verify department checkboxes
    const departments = ["Finance", "CEO", "HR", "Sales", "Consultancy", "Engineering", "IT", "Solutioning"];
    departments.forEach((dept) => {
      cy.get(`input[value="${dept}"]`).check().should('be.checked');
    });
  });

  it('should allow date range selection and submit the form', () => {
    // Select sessions and department, pick a date range, then submit
    cy.get('input[name="AM"]').check();
    cy.get('input[value="HR"]').check();
    cy.get('.rdrDayStartOfMonth').first().click();
    cy.get('.rdrDayEndOfMonth').last().click();
    cy.contains('Submit').click();

    // Verify table appears with data after submission
    cy.get('table').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should display staff count boxes correctly after form submission', () => {
    // Check sessions, department, select date range, and submit
    cy.get('input[name="AM"]').check();
    cy.get('input[name="PM"]').check();
    cy.get('input[value="Sales"]').check();
    cy.get('.rdrDayStartOfMonth').first().click();
    cy.get('.rdrDayEndOfMonth').last().click();
    cy.contains('Submit').click();

    // Verify staff count boxes
    cy.contains('Total Employees').should('be.visible');
    cy.contains('In Office').should('be.visible');
    cy.contains('At Home').should('be.visible');
  });


  it('should show an error if no session is selected', () => {
    // Deselect sessions, select department, pick date range, and submit
    cy.get('input[name="AM"]').uncheck();
    cy.get('input[name="PM"]').uncheck();
    cy.get('input[value="Sales"]').check();
    cy.get('.rdrDayStartOfMonth').first().click();
    cy.get('.rdrDayEndOfMonth').last().click();
    cy.contains('Submit').click();
    cy.contains('Please select at least one session (AM or PM).', { timeout: 10000 }).should('be.visible');
  });

});

// it('should display a no data message if no staff data is available', () => {
//   // Intercept empty data response and verify message
//   cy.intercept('GET', '**/wfh_records/schedule/**', { staff_schedules: [] }).as('getStaffScheduleEmpty');
//   cy.get('input[name="AM"]').check();
//   cy.get('input[value="HR"]').check();
//   cy.get('.rdrDayStartOfMonth').first().click();
//   cy.get('.rdrDayEndOfMonth').last().click();
//   cy.contains('Submit').click();
//   cy.wait(500);
//   cy.contains('No staff data available for this date.').should('be.visible');
// });
