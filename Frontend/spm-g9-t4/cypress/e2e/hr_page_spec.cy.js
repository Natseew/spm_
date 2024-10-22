import dayjs from 'dayjs';

describe('HRPage Component', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/HR');
  });

  it('should load the page and display the correct elements', () => {
    cy.contains('SESSION').should('be.visible');
    cy.contains('DEPARTMENT').should('be.visible');
    cy.get('input[type="checkbox"]').should('have.length', 10); // 8 departments + 2 session checkboxes
    cy.get('.rdrCalendarWrapper').should('be.visible'); // Check if date range picker is visible
    cy.contains('Submit').should('be.visible');
  });

  it('should allow session selection', () => {
    cy.get('input[name="AM"]').check().should('be.checked');
    cy.get('input[name="PM"]').check().should('be.checked');
  });

  it('should allow department selection', () => {
    const departments = ["Finance", "CEO", "HR", "Sales", "Consultancy", "Engineering", "IT", "Solutioning"];
    departments.forEach((dept) => {
      cy.get(`input[value="${dept}"]`).check().should('be.checked');
    });
  });

  it('should allow date range selection and submit the form', () => {
    cy.get('input[name="AM"]').check();
    cy.get('input[value="HR"]').check(); 
    
    // Select the start and end dates
    cy.get('.rdrCalendarWrapper').should('be.visible');
    cy.get('.rdrDayStartOfMonth').first().click(); 
    cy.get('.rdrDayEndOfMonth').last().click(); 

    cy.contains('Submit').click();

    // Ensure that the table is displayed after form submission
    cy.get('table').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should allow filtering by date after form submission', () => {
    // Check both AM and PM sessions
    cy.get('input[name="AM"]').check();
    cy.get('input[name="PM"]').check();
  
    // Check the Sales department
    cy.get('input[value="Sales"]').check();
  
    // September (value = "8") and 2024 and date 19th
    cy.get('.rdrMonthPicker select').select('8', { force: true });
    cy.get('.rdrYearPicker select').select('2024', { force: true });
    cy.contains('.rdrDayNumber', '19').click(); 
    cy.contains('Submit').click();
  

    cy.get('[data-testid="date-filter-select"]').click();  
    cy.get('li[data-value="2024-09-19"]').should('be.visible').click(); 
  
    // Ensure the table is visible and contains rows
    cy.get('table').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });
  
  

  it('should display staff count boxes correctly after form submission', () => {
    cy.get('input[name="AM"]').check();
    cy.get('input[name="PM"]').check();
    cy.get('input[value="Sales"]').check();

    // Interact with the date range picker to select the start and end dates
    cy.get('.rdrCalendarWrapper').should('be.visible');
    cy.get('.rdrDayStartOfMonth').first().click(); // Select the first day
    cy.get('.rdrDayEndOfMonth').last().click(); // Select the last day

    // Submit the form
    cy.contains('Submit').click();

    // Check for staff count boxes
    cy.contains('Total Employees').should('be.visible');
    cy.contains('In Office').should('be.visible');
    cy.contains('At Home').should('be.visible');
  });

  it('should display a no data message if no staff data is available', () => {
    cy.intercept('GET', '**/wfh_records/schedule/**', { staff_schedules: [] }).as('getStaffScheduleEmpty');
    cy.get('input[name="AM"]').check();
    cy.get('input[value="HR"]').check();

    // Interact with the date range picker to select start and end dates
    cy.get('.rdrCalendarWrapper').should('be.visible');
    cy.get('.rdrDayStartOfMonth').first().click(); // Select the first day
    cy.get('.rdrDayEndOfMonth').last().click(); // Select the last day

    // Submit the form
    cy.contains('Submit').click();
    cy.wait('@getStaffScheduleEmpty');

    // Check for no data message
    cy.contains('No staff data available for this date.').should('be.visible');
  });

  it('should display an error message if API call fails', () => {
    cy.intercept('GET', '**/wfh_records/schedule/**', { forceNetworkError: true }).as('getStaffSchedule');
    cy.get('input[name="PM"]').check();
    cy.get('input[value="Finance"]').check();

    // Interact with the date range picker to select start and end dates
    cy.get('.rdrCalendarWrapper').should('be.visible');
    cy.get('.rdrDayStartOfMonth').first().click(); // Select the first day
    cy.get('.rdrDayEndOfMonth').last().click(); // Select the last day

    // Submit the form
    cy.contains('Submit').click();
    cy.wait('@getStaffSchedule');

    // Check for error message
    cy.contains('Error fetching staff schedule', { timeout: 10000 }).should('be.visible');
  });

  it('should show an error if no session is selected', () => {
    // uncheck session , check department
    cy.get('input[name="AM"]').uncheck();
    cy.get('input[name="PM"]').uncheck();
    cy.get('input[value="Sales"]').check();
  
    // select start and end dates
    cy.get('.rdrCalendarWrapper').should('be.visible');
    cy.get('.rdrDayStartOfMonth').first().click(); 
    cy.get('.rdrDayEndOfMonth').last().click(); 
  
    // Submit the form
    cy.contains('Submit').click();
  
    // Wait for the error message and assert visibility
    cy.contains('Please select at least one session (AM or PM).', { timeout: 10000 }).should('be.visible');
  });
  
  
  it('should navigate to the reporting manager page when a link is clicked', () => {
    // Mock API response to include staff schedules with the reporting manager's name
    cy.intercept('GET', '**/wfh_records/schedule/**', {
      staff_schedules: {
        '2024-10-01': [
          {
            staff_id: 1,
            staff_fname: 'John',
            staff_lname: 'Doe',
            dept: 'HR',
            schedule_status: 'Office',
            reporting_manager: 'Manager Name', // Using just the manager's name here
          },
        ],
      },
      total_employees: [],
    }).as('getStaffSchedule');
  
    cy.get('input[name="PM"]').check();
    cy.get('input[value="HR"]').check();
  
    // Interact with the date range picker to select start and end dates
    cy.get('.rdrCalendarWrapper').should('be.visible');
    cy.get('.rdrDayStartOfMonth').first().click(); // Select the first day
    cy.get('.rdrDayEndOfMonth').last().click(); // Select the last day
  
    // Submit the form
    cy.contains('Submit').click();
  
    // Wait for the API response
    cy.wait('@getStaffSchedule');
  
    // Click on the manager's name to navigate to the reporting manager page
    cy.contains('Manager Name').click();
  
    // Ensure the URL changes to the reporting manager page
    cy.url().should('include', '/TeamScheduleHR');
  });
  
});
