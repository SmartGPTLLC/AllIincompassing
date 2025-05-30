describe('Schedule Page', () => {
  beforeEach(() => {
    // Mock successful login
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Navigate to schedule page
    cy.contains('Schedule').click();
  });

  it('allows creating a new session', () => {
    // Click add session button
    cy.contains('button', 'Add Session').click();

    // Fill out session form
    cy.get('select[name="therapist_id"]').select(1);
    cy.get('select[name="client_id"]').select(1);
    cy.get('input[name="start_time"]').type('2025-03-18T10:00');
    cy.get('input[name="end_time"]').type('2025-03-18T11:00');

    // Submit form
    cy.contains('button', 'Create Session').click();

    // Verify session was created
    cy.contains('10:00 AM').should('exist');
  });

  it('supports different calendar views', () => {
    // Test day view
    cy.contains('button', 'Day').click();
    cy.get('[data-testid="day-view"]').should('exist');

    // Test week view
    cy.contains('button', 'Week').click();
    cy.get('[data-testid="week-view"]').should('exist');

    // Test matrix view
    cy.contains('button', 'Matrix').click();
    cy.get('[data-testid="matrix-view"]').should('exist');
  });

  it('allows filtering sessions', () => {
    // Open filters
    cy.get('select[name="therapist-filter"]').select(1);
    cy.get('select[name="client-filter"]').select(1);

    // Verify filtered results
    cy.contains('Test Therapist 1').should('exist');
    cy.contains('Test Client 1').should('exist');
  });
});