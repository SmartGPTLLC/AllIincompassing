describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('shows login form', () => {
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('contain', 'Sign in');
  });

  it('shows validation errors for empty form submission', () => {
    cy.get('button[type="submit"]').click();
    cy.get('input[type="email"]:invalid').should('exist');
    cy.get('input[type="password"]:invalid').should('exist');
  });

  it('navigates to signup page', () => {
    cy.contains('create a new account').click();
    cy.url().should('include', '/signup');
  });
});