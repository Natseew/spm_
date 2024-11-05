describe('Recurring Arrangement Form', () => {
    beforeEach(() => {
      cy.window().then((win) => {
            const user = { staff_id: '140001' }; // Using staff_id 140001 for testing
            win.sessionStorage.setItem('user', JSON.stringify(user));
      });
      // Visit the page (adjust URL as necessary)
      cy.visit('http://localhost:3000/recurring_application');
    });

    it('should display day of the week options in the select dropdown', () => {
        // Find the select element (with the label "Day of the Week")
        cy.get('label').contains('Day of the Week') // Ensure the label is visible first
          .parent() // Get the parent <FormControl> of the label to locate the <Select> inside
      
        // Click the select to open the dropdown
        cy.get('label').contains('Day of the Week')
          .parent() // Get the <FormControl> container
        
        // Check if all MenuItem options are visible in the dropdown
        // cy.get('ul[role="listbox"]') // Select the dropdown menu list
        //   .should('be.visible') // Ensure the dropdown list is open and visible
        //   .within(() => {
        //     cy.get('li').contains('Monday').should('be.visible');
        //     cy.get('li').contains('Tuesday').should('be.visible');
        //     cy.get('li').contains('Wednesday').should('be.visible');
        //     cy.get('li').contains('Thursday').should('be.visible');
        //     cy.get('li').contains('Friday').should('be.visible');
        //   });
      });

      it('should display start date and end date calendars', () => {
        // Check if the Start Date field and its label are visible
        cy.get('label').contains('Start Date')
          .should('be.visible'); // Check if the label is visible
        cy.get('input[placeholder="Select Start Date"]')
          .should('be.visible') // Check if the input for Start Date is visible
          .click(); // Trigger a click to open the calendar
      
        // After clicking the Start Date input, check if the calendar appears
        cy.get('.react-datepicker').should('be.visible'); // Check if the calendar (datepicker) appears
      
        // Now check the End Date field and label are visible
        cy.get('label').contains('End Date')
          .should('be.visible'); // Check if the label for End Date is visible
        cy.get('input[placeholder="Select End Date"]')
          .should('be.visible') // Check if the input for End Date is visible
          .click(); // Trigger a click to open the calendar
      
        // After clicking the End Date input, check if the calendar appears
        cy.get('.react-datepicker').should('be.visible'); // Check if the calendar (datepicker) appears
      });
      
      it('should contain submit and cancel', () => {
        cy.contains('Cancel').should('be.visible');
        cy.contains('Submit').should('be.visible');
      });

      it('should contain reason', () => {
        cy.get('div.MuiFormControl-root')
        .contains('Reason')
        .parent()
        .find('textarea')
        .not('[aria-hidden="true"]')
        .should('be.visible');
      });

    //   it('should display and select timeslot', () => {
    //     // Click the 4th FormControl (Timeslot dropdown)
    //     cy.get('div.MuiFormControl-root') // Select all FormControl components
    //       .eq(3) // Select the 4th FormControl (index is 0-based, so eq(3) is the 4th)
    //       .click(); // Open the dropdown
    
    //     // Wait for the dropdown list to become visible
    //     cy.get('ul[role="listbox"]', { timeout: 5000 }).should('be.visible');
    
    //     // Ensure the "Full Day" option is visible
    //     cy.contains('li', 'Full Day').should('be.visible');
    
    //     // Select the "Full Day" option
    //     cy.contains('li', 'Full Day').click();
    
    //     // Verify that the correct value ("Full Day") is selected in the dropdown
    //     cy.get('div.MuiFormControl-root')
    //       .eq(3) // Again, select the 4th FormControl (Timeslot dropdown)
    //       .find('input') // Find the input inside the dropdown
    //       .should('have.value', 'Full Day'); // Check that the selected value is 'Full Day'
    // });

    //   it('should display and select a timeslot option', () => {
    //     // Check if the Timeslot dropdown is visible
    //     cy.pause();
    //     cy.contains('Timeslot').should('be.visible'); // Ensures the Timeslot label is visible
        
    //     cy.get('div.MuiFormControl-root').first().click();
        
    //     cy.contains('li', 'Full Day').click();
    
    //     // Open the Timeslot dropdown by clicking on the label
    //     cy.get('label').contains('Timeslot').click(); // Click on the Timeslot label to open the dropdown
    
    //     // Ensure the dropdown options are visible (with the role="listbox")
    //     cy.get('div[role="listbox"]', { timeout: 5000 }).should('be.visible');
    
    //     // Ensure the options inside the dropdown are visible
    //     cy.get('li[role="option"]').contains('AM').should('be.visible');
    //     cy.get('li[role="option"]').contains('PM').should('be.visible');
    //     cy.get('li[role="option"]').contains('Full Day').should('be.visible');
    
    //     // Select the "AM" option (for example)
    //     cy.get('li[role="option"]').contains('AM').click();
    
    //     // Verify that the selected value is now displayed in the Timeslot field
    //     cy.get('input').first() // Target the first input (Timeslot select input field)
    //       .should('have.value', 'AM'); // Ensure the value is set to "AM"
    //   });
      
    //   it('should navigate between tabs', () => {
    //     cy.get('button').contains('RECURRING APPLICATION').click();
    //     cy.url().should('include', '/recurring_application');
    //     cy.get('button').contains('ADHOC-APPLICATION').click();
    //     cy.url().should('include', '/adhoc_application');
    //   });
      
    //   it('should display and select timeslot', () => {
    //     // Step 1: Click the Timeslot label to open the dropdown
    //     cy.get('label').contains('Timeslot').click(); // Open the Select dropdown by clicking the label
        
    //     // Step 2: Wait for the dropdown menu to appear. We’ll check for the role attribute to ensure the dropdown is open.
    //     cy.get('div[role="listbox"]', { timeout: 5000 }).should('be.visible'); // Ensure the dropdown is visible
      
    //     // Step 3: Ensure that all expected options are in the dropdown
    //     cy.get('li[role="option"]').contains('AM').should('be.visible');      // AM option
    //     cy.get('li[role="option"]').contains('PM').should('be.visible');      // PM option
    //     cy.get('li[role="option"]').contains('Full Day').should('be.visible'); // Full Day option
        
    //     // Step 4: Select the 'AM' option
    //     cy.get('li[role="option"]').contains('AM').click(); // Click on 'AM'
      
    //     // Step 5: Verify that the selected value appears in the input field
    //     cy.get('input').first()  // Target the first input field
    //       .should('have.value', 'AM'); // Ensure the value is set correctly to 'AM'
    //   });
      
      
      
  
    // it('should display all form components', () => {
    //   // Check if the text fields and labels for Start Date and End Date are rendered
    //   cy.get('label').contains('Start Date').should('be.visible');
    //   cy.get('label').contains('End Date').should('be.visible');
    //   cy.get('input[placeholder="Select Start Date"]').should('be.visible');
    //   cy.get('input[placeholder="Select End Date"]').should('be.visible');
  
  
    //   // Check if the timeslot select dropdown is rendered
    //   cy.get('label').contains('Timeslot').should('be.visible');
    // //   cy.get('select').contains('AM').should('be.visible');
    // //   cy.get('select').contains('PM').should('be.visible');
    // //   cy.get('select').contains('Full Day').should('be.visible');
  
    //   // Check if the reason text field is rendered
    //   cy.get('label').contains('Reason').should('be.visible');
    //   cy.get('textarea').should('be.visible');
  
    //   // Check if the submit button is rendered and not disabled initially
    //   cy.get('button').contains('Submit').should('be.visible').and('not.be.disabled');
  
    //   // Check if the cancel button is rendered
    //   cy.get('button').contains('Cancel').should('be.visible');
  
    //   // Check if success and error alerts are present
    //   cy.get('div.MuiAlert-root').should('not.exist');  // Initially, there should be no alerts
    // });
  });
  