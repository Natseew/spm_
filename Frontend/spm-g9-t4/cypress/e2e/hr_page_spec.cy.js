import dayjs from 'dayjs';

describe('HRPage Component', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/HR');
  });

  it('should load the page and display the correct elements', () => {
    cy.contains('SESSION').should('be.visible');
    cy.contains('DEPARTMENT').should('be.visible');
    cy.get('input[type="checkbox"]').should('have.length', 10); // 8 departments + 2 session checkboxes
    cy.get('input[type="date"]').should('be.visible');
    cy.contains('Submit').should('be.visible');
  });

  it('should allow session selection', () => {
    cy.get('input[name="AM"]').check().should('be.checked');
    cy.get('input[name="PM"]').check().should('be.checked');
  });

  it('should allow department selection', () => {
    // Check each department checkbox to ensure they all work
    const departments = ["Finance", "CEO", "HR", "Sales", "Consultancy", "Engineering", "IT", "Solutioning"];
    departments.forEach((dept) => {
      cy.get(`input[value="${dept}"]`).check().should('be.checked');
    });
  });  

  it('should allow date selection and submit the form', () => {
    cy.get('input[name="AM"]').check();
    cy.get('input[value="HR"]').check(); // Only one session and department needed
    const date = dayjs().format('YYYY-MM-DD');
    cy.get('input[type="date"]').type(date).should('have.value', date);
    cy.contains('Submit').click();
    cy.get('table').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should display staff count boxes correctly after form submission', () => {
    cy.get('input[name="AM"]').check();
    cy.get('input[name="PM"]').check();
    // Check a few departments only
    cy.get('input[value="Sales"]').check();
    cy.get('input[value="Engineering"]').check();
    const date = dayjs().format('YYYY-MM-DD');
    cy.get('input[type="date"]').type(date);
    cy.contains('Submit').click();
    cy.contains('AM').should('be.visible');
    cy.contains('PM').should('be.visible');
  });

  it('should display a no data message if no staff data is available', () => {
    cy.intercept('GET', '**/wfh_records/schedule/**', { staff_schedules: [] }).as('getStaffScheduleEmpty');
    // Only one department and session needed
    cy.get('input[name="AM"]').check();
    cy.get('input[value="HR"]').check();
    const date = dayjs().format('YYYY-MM-DD');
    cy.get('input[type="date"]').type(date);
    cy.contains('Submit').click();
    cy.wait('@getStaffScheduleEmpty');
    cy.contains('No staff data available.').should('be.visible');
  });

  it('should display an error message if API call fails', () => {
    cy.intercept('GET', '**/wfh_records/schedule/**', { forceNetworkError: true }).as('getStaffSchedule');
    cy.get('input[name="PM"]').check();
    cy.get('input[value="Finance"]').check(); // One department and session
    const date = dayjs().format('YYYY-MM-DD');
    cy.get('input[type="date"]').type(date);
    cy.contains('Submit').click();
    cy.wait('@getStaffSchedule');
    cy.contains('Error fetching staff schedule', { timeout: 10000 }).should('be.visible');
  });

  it('show an error if no session is selected', () => {
    cy.get('input[name="AM"]').uncheck();
    cy.get('input[name="PM"]').uncheck();
    cy.get('input[value="Sales"]').check(); // Check only one department
    const date = dayjs().format('YYYY-MM-DD');
    cy.get('input[type="date"]').type(date);
    cy.contains('Submit').click();
    cy.contains('Please select at least one session (AM or PM).', { timeout: 10000 }).should('be.visible');
    cy.contains('In Office').parent().contains('0');
    cy.contains('At Home').parent().contains('0');
  });

  it('should show an error message if no department is selected', () => {
    cy.get('input[name="AM"]').check(); // Only one session selected
    cy.get('input[type="checkbox"]').uncheck();
    const date = dayjs().format('YYYY-MM-DD');
    cy.get('input[type="date"]').type(date);
    cy.contains('Submit').click();
    cy.contains('Please select at least one department.', { timeout: 10000 }).should('be.visible');
    cy.contains('In Office').parent().contains('0');
    cy.contains('At Home').parent().contains('0');
  });

  it('should navigate to the reporting manager page when a link is clicked', () => {
    cy.intercept('GET', '**/wfh_records/schedule/**', {
      staff_schedules: [{
        staff_id: 1,
        staff_fname: 'John',
        staff_lname: 'Doe',
        dept: 'IT',
        schedule_status: 'Office',
        reporting_manager: 'Manager Name'
      }]
    }).as('getStaffSchedule');
    cy.get('input[name="PM"]').check();
    cy.get('input[value="HR"]').check();
    const date = dayjs().format('YYYY-MM-DD');
    cy.get('input[type="date"]').type(date);
    cy.contains('Submit').click();
    cy.wait('@getStaffSchedule');
    cy.contains('Manager Name').click();
    cy.url().should('include', '/TeamScheduleHR');
  });
});
