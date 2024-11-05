describe('POST /submit - Recurring Request Submission', () => {

    // TO COME BACK TO THIS -> will fail because of existing db entries

    //it('should successfully submit a recurring request (faked response)', () => {
      // Intercept the POST request and return a mocked response
    //   cy.intercept('POST', 'http://localhost:4000/recurring_request/submit', {
    //     statusCode: 201, // Simulate a successful creation
    //     body: {
    //       message: 'Recurring WFH request submitted successfully',
    //       requestID: 12345, // Mocked request ID returned
    //     },
    //   }).as('submitRequest'); // Alias for the intercepted request
  
    //   // Simulate the form submission via the POST request
    //   cy.request({
    //     method: 'POST',
    //     url: 'http://localhost:4000/recurring_request/submit', // Full URL (ensure baseUrl is set correctly or use full URL)
    //     body: {
    //       staff_id: 150215,
    //       start_date: '2024-11-01',
    //       end_date: '2024-11-30',
    //       day_of_week: 2,
    //       request_reason: 'Work from home due to project deadlines',
    //       timeslot: 'AM',
    //     },
    //   }).then((response) => {
    //     // Assert that the response status code is 201 (Created)
    //     expect(response.status).to.eq(201);
  
    //     // Assert that the mocked message is returned
    //     expect(response.body.message).to.eq('Recurring WFH request submitted successfully');
  
    //     // Assert that the mocked request ID is returned
    //     expect(response.body.requestID).to.eq(12345);
    //   });
  
    //   // Wait for the request to complete and then assert that it was intercepted
    //   cy.wait('@submitRequest');
    // });
  
    it('should return an error when required fields are missing', () => {
      // Setup the test data with missing fields
      const invalidData = {
        start_date: '2024-11-01',
        end_date: '2024-11-30',
        day_of_week: 1,    // Monday
        request_reason: 'Work from home due to personal reasons',
        timeslot: 'AM',
      };
  
      // Make the POST request
      cy.request({
        method: 'POST',
        url: `http://localhost:4000/recurring_request/submit`,  // Ensure correct URL
        body: invalidData,
        failOnStatusCode: false, // Prevent automatic failure on non-2xx status
      }).then((response) => {
        // Assert that the response status is 400 (Bad Request)
        expect(response.status).to.eq(400);
        // Assert that the error message is correct
        expect(response.body.message).to.eq('Staff ID, start date, end date, day of week, request reason, and timeslot are required.');
      });
    });
  
    it('should return an error when day_of_week is invalid', () => {
      // Setup the test data with an invalid `day_of_week`
      const invalidDayData = {
        staff_id: 130001,
        start_date: '2024-11-01',
        end_date: '2024-11-30',
        day_of_week: 6,    // Invalid day (outside 1-5)
        request_reason: 'Work from home due to personal reasons',
        timeslot: 'AM',
      };
  
      // Make the POST request
      cy.request({
        method: 'POST',
        url: `http://localhost:4000/recurring_request/submit`,  // Ensure correct URL
        body: invalidDayData,
        failOnStatusCode: false, // Prevent automatic failure on non-2xx status
      }).then((response) => {
        // Assert that the response status is 400 (Bad Request)
        expect(response.status).to.eq(400);
        // Assert that the error message is correct
        expect(response.body.message).to.eq('Day of week must be between 1 (Monday) and 5 (Friday).');
      });
    });
  
    it('should return an error when timeslot is invalid', () => {
      // Setup the test data with an invalid `timeslot`
      const invalidTimeslotData = {
        staff_id: 130001,
        start_date: '2024-11-01',
        end_date: '2024-11-30',
        day_of_week: 1,    // Monday
        request_reason: 'Work from home due to personal reasons',
        timeslot: 'INVALID', // Invalid timeslot
      };
  
      // Make the POST request
      cy.request({
        method: 'POST',
        url: `http://localhost:4000/recurring_request/submit`,  // Ensure correct URL
        body: invalidTimeslotData,
        failOnStatusCode: false, // Prevent automatic failure on non-2xx status
      }).then((response) => {
        // Assert that the response status is 400 (Bad Request)
        expect(response.status).to.eq(400);
        // Assert that the error message is correct
        expect(response.body.message).to.eq('Timeslot must be either AM, PM, or FD (Full Day).');
      });
    });
  
    it('should return an error when start date is too far in the past', () => {
      const invalidStartDateData = {
        staff_id: 130001,
        start_date: '2023-08-01', // More than 2 months ago
        end_date: '2024-11-30',
        day_of_week: 1,    // Monday
        request_reason: 'Work from home due to personal reasons',
        timeslot: 'AM',
      };
  
      cy.request({
        method: 'POST',
        url: `http://localhost:4000/recurring_request/submit`,  // Ensure correct URL
        body: invalidStartDateData,
        failOnStatusCode: false, // Prevent automatic failure on non-2xx status
      }).then((response) => {
        // Assert that the response status is 400 (Bad Request)
        expect(response.status).to.eq(400);
        // Assert that the error message is correct
        expect(response.body.message).to.eq('Start date cannot be more than 2 months before the current date.');
      });
    });
    
    it('should return an error when end date is too far in the future', () => {
      const invalidEndDateData = {
        staff_id: 130001,
        start_date: '2024-11-01',
        end_date: '2025-11-01', // More than 3 months from now
        day_of_week: 1,    // Monday
        request_reason: 'Work from home due to personal reasons',
        timeslot: 'AM',
      };
  
      cy.request({
        method: 'POST',
        url: `http://localhost:4000/recurring_request/submit`,  // Ensure correct URL
        body: invalidEndDateData,
        failOnStatusCode: false, // Prevent automatic failure on non-2xx status
      }).then((response) => {
        // Assert that the response status is 400 (Bad Request)
        expect(response.status).to.eq(400);
        // Assert that the error message is correct
        expect(response.body.message).to.eq('End date cannot be more than 3 months after the current date.');
      });
    });
    
  });
  