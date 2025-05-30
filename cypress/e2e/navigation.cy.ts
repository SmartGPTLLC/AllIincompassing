describe('Navigation', () => {
  beforeEach(() => {
    // Mock successful login
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
  });

  it('shows sidebar navigation', () => {
    cy.get('nav').should('exist');
    cy.contains('Dashboard').should('exist');
    cy.contains('Schedule').should('exist');
    cy.contains('Clients').should('exist');
    cy.contains('Therapists').should('exist');
  });

  it('navigates between pages', () => {
    cy.contains('Schedule').click();
    cy.url().should('include', '/schedule');

    cy.contains('Clients').click();
    cy.url().should('include', '/clients');

    cy.contains('Therapists').click();
    cy.url().should('include', '/therapists');
  });
});