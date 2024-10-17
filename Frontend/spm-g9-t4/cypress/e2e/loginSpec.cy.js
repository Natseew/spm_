// cypress/e2e/login.spec.js

describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/'); // Adjust the URL if needed
  });

  //Test for HR
  it('should successfully log in with valid credentials', () => {
    const email = "Sophia.Fu@allinone.com.sg";
    const password = 'Sophia';

    // Mocking the API response
    cy.intercept('POST', 'http://localhost:4000/employee/login', {
      statusCode: 200,
      body: [
        {
          id: 1,
          email: email,
          role: '1', // Adjust based on the role you want to test
        },
      ],
    }).as('loginRequest');

    // Fill in the email and password
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Wait for the request to complete
    cy.wait('@loginRequest');

    // Assert the redirect happened
    cy.url().should('include', '/HR'); // Adjust based on the expected role redirect
  });

  //Test for Staff
  it('should successfully log in with valid credentials', () => {
    const email = "Kumari.Pillai@allinone.com.sg";
    const password = 'Kumari';

    // Mocking the API response
    cy.intercept('POST', 'http://localhost:4000/employee/login', {
      statusCode: 200,
      body: [
        {
          id: 1,
          email: email,
          role: '2', // Adjust based on the role you want to test
        },
      ],
    }).as('loginRequest');

    // Fill in the email and password
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Wait for the request to complete
    cy.wait('@loginRequest');

    // Assert the redirect happened
    cy.url().should('include', '/staff'); // Adjust based on the expected role redirect
  });

  it('should display an error message for invalid credentials', () => {
    const email = 'wrong@example.com';
    const password = 'wrongpassword';

    // Mocking the API response for error
    cy.intercept('POST', 'http://localhost:4000/employee/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginRequest');

    // Fill in the email and password
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Wait for the request to complete
    cy.wait('@loginRequest');

  // Assert that the Snackbar with the error message is displayed
    cy.get('.MuiSnackbarContent-message', { timeout: 10000 }) // Adjust timeout if necessary
      .should('be.visible') // Ensure it is visible
      .and('contain', 'Invalid Credentials'); // Check the message content
  });
});
