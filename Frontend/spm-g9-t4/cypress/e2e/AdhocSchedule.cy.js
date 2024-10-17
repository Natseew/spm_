// AdHocSchedule.cy.js

import React from 'react';
import { mount } from '@cypress/react';
import AdHocSchedule from './AdHocSchedule';

// Mock the global fetch API
cy.spy(window, 'fetch').as('fetchSpy');

describe('AdHocSchedule Component', () => {
  beforeEach(() => {
    const mockResponse = {
      json: () => Promise.resolve([]),
    };
    cy.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
  });

  it('should display loading initially', () => {
    mount(<AdHocSchedule />);
    cy.contains('Loading...').should('be.visible');
  });

  it('should render error message on fetch failure', () => {
    const fetchStub = cy.stub(window, 'fetch').rejects(new Error('Fetch failed'));
    mount(<AdHocSchedule />);
    cy.wait('@fetchSpy');
    cy.contains(/error/i).should('be.visible');
  });

  it('should render filters after loading', () => {
    mount(<AdHocSchedule />);
    cy.wait('@fetchSpy');
    cy.contains('Filter By Status:').should('be.visible');
    cy.contains('Filter Date:').should('be.visible');
  });

  it('should allow status change', () => {
    mount(<AdHocSchedule />);
    cy.wait('@fetchSpy');
    cy.get('button').contains('Approved').click();
    cy.get('button').contains('Approved').should('have.class', 'bg-blue-500 text-white');
  });

  it('should allow date filtering', () => {
    mount(<AdHocSchedule />);
    cy.wait('@fetchSpy');
    cy.get('input[type="date"]').type('2024-05-15');
    cy.get('input[type="date"]').should('have.value', '2024-05-15');
  });
});
