/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      mockSupabaseAuth(): Chainable<void>
    }
  }
}

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })
})

// Custom command for mocking Supabase auth
Cypress.Commands.add('mockSupabaseAuth', () => {
  cy.intercept('POST', '**/auth/v1/token**', {
    fixture: 'auth-success.json'
  }).as('authRequest')
}) 