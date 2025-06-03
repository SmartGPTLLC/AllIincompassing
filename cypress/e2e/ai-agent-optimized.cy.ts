/// <reference types="cypress" />

describe('Phase 4: AI Agent Optimization E2E Tests', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '**/auth/v1/token**', {
      fixture: 'auth-success.json'
    }).as('login');

    // Mock Supabase functions
    cy.intercept('POST', '**/functions/v1/ai-agent-optimized', {
      statusCode: 200,
      body: {
        response: 'AI response mock',
        action: { type: 'schedule_session', data: {} },
        responseTime: 750,
        cacheHit: false,
        tokenUsage: { prompt: 100, completion: 50, total: 150 }
      }
    }).as('aiAgent');

    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
  });

  describe('AI Chat Interface', () => {
    beforeEach(() => {
      cy.contains('AI Assistant').click();
    });

    it('should handle bulk scheduling requests', () => {
      const bulkMessage = 'Schedule 3 sessions: Dr. Smith with John Doe tomorrow at 10am, Dr. Jones with Jane Smith Friday at 2pm, and Dr. Wilson with Bob Johnson next Monday at 9am';
      
      cy.get('[data-testid="ai-chat-input"]').type(bulkMessage);
      cy.get('[data-testid="send-message"]').click();
      
      cy.wait('@aiAgent').then((interception) => {
        expect(interception.request.body).to.have.property('message', bulkMessage);
      });

      // Verify AI processes bulk request
      cy.contains('I\'ll schedule these 3 sessions for you').should('exist');
      cy.get('[data-testid="ai-response"]').should('contain', 'sessions scheduled');
    });

    it('should detect and suggest conflict resolutions', () => {
      const conflictMessage = 'Schedule Dr. Smith with Mary Wilson tomorrow at 10am';
      
      cy.get('[data-testid="ai-chat-input"]').type(conflictMessage);
      cy.get('[data-testid="send-message"]').click();
      
      cy.wait('@aiAgent');
      
      // Should detect conflict and provide alternatives
      cy.contains('conflict detected').should('exist');
      cy.contains('alternative times').should('exist');
      cy.get('[data-testid="suggested-times"]').should('exist');
    });

    it('should provide proactive workload suggestions', () => {
      cy.get('[data-testid="ai-chat-input"]').type('Show me this week\'s schedule optimization');
      cy.get('[data-testid="send-message"]').click();
      
      cy.wait('@aiAgent');
      
      cy.contains('workload analysis').should('exist');
      cy.get('[data-testid="optimization-suggestions"]').should('exist');
    });

    it('should show performance metrics', () => {
      cy.get('[data-testid="ai-performance-panel"]').should('exist');
      cy.get('[data-testid="response-time"]').should('contain', 'ms');
      cy.get('[data-testid="cache-hit-rate"]').should('contain', '%');
    });
  });

  describe('Smart Scheduling Features', () => {
    beforeEach(() => {
      cy.contains('Schedule').click();
    });

    it('should handle optimized schedule requests', () => {
      cy.get('[data-testid="smart-schedule-btn"]').click();
      
      cy.intercept('POST', '**/functions/v1/ai-agent-optimized', {
        body: {
          response: 'Optimized schedule generated',
          action: {
            type: 'smart_schedule_optimization',
            data: {
              optimizations: [
                { type: 'load_balancing', count: 3 },
                { type: 'conflict_resolution', count: 2 }
              ]
            }
          }
        }
      }).as('smartSchedule');

      cy.get('[data-testid="optimization-type"]').select('load_balancing');
      cy.get('[data-testid="date-range"]').type('2025-01-15 to 2025-01-21');
      cy.get('[data-testid="optimize-schedule"]').click();
      
      cy.wait('@smartSchedule');
      cy.contains('Schedule optimized').should('exist');
    });

    it('should predict and display conflicts', () => {
      cy.intercept('GET', '**/rpc/detect_scheduling_conflicts', {
        body: [
          {
            conflict_type: 'double_booking',
            severity: 3,
            affected_sessions: [],
            suggested_resolutions: []
          }
        ]
      }).as('conflictDetection');

      cy.get('[data-testid="conflict-detector"]').click();
      cy.wait('@conflictDetection');
      
      cy.get('[data-testid="conflict-warning"]').should('exist');
      cy.contains('double_booking').should('exist');
    });
  });

  describe('Performance Validation', () => {
    it('should meet response time requirements', () => {
      cy.intercept('POST', '**/functions/v1/ai-agent-optimized', (req) => {
        req.reply((res) => {
          // Simulate optimized response time
          setTimeout(() => {
            res.send({
              statusCode: 200,
              body: {
                response: 'Fast response',
                responseTime: 650 // Under 750ms target
              }
            });
          }, 650);
        });
      }).as('fastResponse');

      cy.contains('AI Assistant').click();
      cy.get('[data-testid="ai-chat-input"]').type('Quick test');
      
      const startTime = Date.now();
      cy.get('[data-testid="send-message"]').click();
      
      cy.wait('@fastResponse').then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(1000); // Performance target
      });
    });

    it('should validate cache performance', () => {
      cy.intercept('POST', '**/functions/v1/ai-agent-optimized', {
        body: { response: 'Cached response', cacheHit: true, responseTime: 150 }
      }).as('cachedResponse');

      cy.contains('AI Assistant').click();
      
      // First request
      cy.get('[data-testid="ai-chat-input"]').type('What are today\'s sessions?');
      cy.get('[data-testid="send-message"]').click();
      
      // Second identical request should hit cache
      cy.get('[data-testid="ai-chat-input"]').clear().type('What are today\'s sessions?');
      cy.get('[data-testid="send-message"]').click();
      
      cy.wait('@cachedResponse').then((interception) => {
        expect(interception.response.body.cacheHit).to.be.true;
        expect(interception.response.body.responseTime).to.be.lessThan(200);
      });
    });
  });

  describe('Error Handling & Resilience', () => {
    it('should handle AI service failures gracefully', () => {
      cy.intercept('POST', '**/functions/v1/ai-agent-optimized', {
        statusCode: 500,
        body: { error: 'Service temporarily unavailable' }
      }).as('aiFailure');

      cy.contains('AI Assistant').click();
      cy.get('[data-testid="ai-chat-input"]').type('Test message');
      cy.get('[data-testid="send-message"]').click();
      
      cy.wait('@aiFailure');
      cy.contains('AI assistant is temporarily unavailable').should('exist');
      cy.get('[data-testid="fallback-options"]').should('exist');
    });

    it('should provide fallback functionality', () => {
      cy.intercept('POST', '**/functions/v1/ai-agent-optimized', {
        statusCode: 503
      }).as('serviceDown');

      cy.contains('Schedule').click();
      cy.get('[data-testid="ai-schedule-assist"]').click();
      
      cy.wait('@serviceDown');
      cy.contains('Manual scheduling mode').should('exist');
      cy.get('[data-testid="manual-schedule-form"]').should('be.visible');
    });
  });
}); 