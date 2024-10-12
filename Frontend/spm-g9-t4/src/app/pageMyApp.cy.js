import React from 'react'
import MyApp from './page'

describe('<MyApp />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<MyApp />)
  })
})