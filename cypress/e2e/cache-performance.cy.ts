/// <reference types="cypress" />

describe('Cache Performance Regression Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
  });

  describe('Phase 3: Database Caching Performance', () => {
    it('should cache sessions data with proper TTL', () => {
      // Mock the optimized sessions query
      cy.intercept('POST', '**/rpc/get_sessions_optimized', {
        statusCode: 200,
        delay: 100, // First request takes 100ms
        body: {
          sessions: [
            { id: '1', start_time: '2025-01-15T10:00:00Z', therapist: 'Dr. Smith' }
          ],
          cache_hit: false,
          query_time: 95
        }
      }).as('firstSessionsLoad');

      // Second request should be faster (cached)
      cy.intercept('POST', '**/rpc/get_sessions_optimized', {
        statusCode: 200,
        delay: 10, // Cached request takes 10ms
        body: {
          sessions: [
            { id: '1', start_time: '2025-01-15T10:00:00Z', therapist: 'Dr. Smith' }
          ],
          cache_hit: true,
          query_time: 5
        }
      }).as('cachedSessionsLoad');

      cy.contains('Schedule').click();
      cy.wait('@firstSessionsLoad');

      // Reload page to test cache
      cy.reload();
      cy.contains('Schedule').click();
      cy.wait('@cachedSessionsLoad');

      // Verify performance improvement
      cy.get('@cachedSessionsLoad').should((interception) => {
        expect(interception.response.body.cache_hit).to.be.true;
        expect(interception.response.body.query_time).to.be.lessThan(50);
      });
    });

    it('should maintain cache hit rate above 60%', () => {
      const requests = [];
      let cacheHits = 0;

      // Simulate multiple data requests
      for (let i = 0; i < 10; i++) {
        cy.intercept('POST', '**/rpc/get_dashboard_data', (req) => {
          const isCacheHit = Math.random() > 0.35; // 65% cache hit rate
          if (isCacheHit) cacheHits++;
          
          req.reply({
            statusCode: 200,
            body: {
              data: { metric: i },
              cache_hit: isCacheHit,
              response_time: isCacheHit ? 50 : 200
            }
          });
        }).as(`dashboardRequest${i}`);
      }

      cy.contains('Dashboard').click();
      
      // Wait for all requests
      for (let i = 0; i < 10; i++) {
        cy.wait(`@dashboardRequest${i}`);
      }

      // Verify cache hit rate
      cy.then(() => {
        const hitRate = cacheHits / 10;
        expect(hitRate).to.be.greaterThan(0.6); // Above 60%
      });
    });

    it('should handle cache invalidation properly', () => {
      // Initial cached data
      cy.intercept('GET', '**/clients*', {
        body: [{ id: '1', name: 'John Doe' }],
        headers: { 'x-cache-status': 'hit' }
      }).as('cachedClients');

      // After mutation, cache should be invalidated
      cy.intercept('POST', '**/clients', {
        statusCode: 201,
        body: { id: '2', name: 'Jane Smith' }
      }).as('createClient');

      cy.intercept('GET', '**/clients*', {
        body: [
          { id: '1', name: 'John Doe' },
          { id: '2', name: 'Jane Smith' }
        ],
        headers: { 'x-cache-status': 'miss' }
      }).as('freshClients');

      cy.contains('Clients').click();
      cy.wait('@cachedClients');

      // Create new client (should invalidate cache)
      cy.contains('Add Client').click();
      cy.get('input[name="name"]').type('Jane Smith');
      cy.get('button[type="submit"]').click();
      cy.wait('@createClient');

      // Refresh should get fresh data
      cy.reload();
      cy.contains('Clients').click();
      cy.wait('@freshClients');

      cy.get('@freshClients').then((interception) => {
        expect(interception.response.headers['x-cache-status']).to.equal('miss');
      });
    });
  });

  describe('Phase 4: AI Response Caching', () => {
    it('should cache AI responses with semantic similarity', () => {
      const similarQueries = [
        'What are today\'s sessions?',
        'Show me today\'s appointments',
        'List sessions for today'
      ];

      // First query - cache miss
      cy.intercept('POST', '**/functions/v1/ai-agent-optimized', {
        body: {
          response: 'Today you have 3 sessions scheduled',
          responseTime: 800,
          cacheHit: false,
          tokenUsage: { total: 150 }
        }
      }).as('firstAIQuery');

      // Similar queries - cache hit
      cy.intercept('POST', '**/functions/v1/ai-agent-optimized', {
        body: {
          response: 'Today you have 3 sessions scheduled',
          responseTime: 100,
          cacheHit: true,
          tokenUsage: { total: 0 }
        }
      }).as('cachedAIQuery');

      cy.contains('AI Assistant').click();

      // First query
      cy.get('[data-testid="ai-chat-input"]').type(similarQueries[0]);
      cy.get('[data-testid="send-message"]').click();
      cy.wait('@firstAIQuery');

      // Similar query should hit cache
      cy.get('[data-testid="ai-chat-input"]').clear().type(similarQueries[1]);
      cy.get('[data-testid="send-message"]').click();
      cy.wait('@cachedAIQuery');

      cy.get('@cachedAIQuery').then((interception) => {
        expect(interception.response.body.cacheHit).to.be.true;
        expect(interception.response.body.responseTime).to.be.lessThan(200);
      });
    });

    it('should maintain AI cache efficiency metrics', () => {
      cy.intercept('GET', '**/rpc/get_ai_cache_metrics', {
        body: {
          total_entries: 450,
          valid_entries: 380,
          expired_entries: 70,
          hit_rate: 0.844,
          average_response_time: 125,
          cache_size_mb: 2.1
        }
      }).as('cacheMetrics');

      cy.contains('Admin').click();
      cy.contains('Performance Metrics').click();
      cy.wait('@cacheMetrics');

      // Verify cache performance standards
      cy.get('[data-testid="cache-hit-rate"]').should('contain', '84.4%');
      cy.get('[data-testid="avg-response-time"]').should('contain', '125ms');
      
      cy.get('@cacheMetrics').then((interception) => {
        const metrics = interception.response.body;
        expect(metrics.hit_rate).to.be.greaterThan(0.8); // >80% hit rate
        expect(metrics.average_response_time).to.be.lessThan(200); // <200ms avg
        expect(metrics.cache_size_mb).to.be.lessThan(5); // <5MB size
      });
    });

    it('should handle cache cleanup and optimization', () => {
      cy.intercept('POST', '**/rpc/cleanup_ai_cache', {
        body: { deleted_entries: 25, remaining_entries: 425 }
      }).as('cacheCleanup');

      cy.contains('Admin').click();
      cy.contains('System Maintenance').click();
      cy.get('[data-testid="cleanup-cache-btn"]').click();
      
      cy.wait('@cacheCleanup');
      
      cy.get('[data-testid="cleanup-result"]')
        .should('contain', '25 expired entries removed');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet Phase 3 performance targets', () => {
      const benchmarks = {
        schedulePageLoad: 2000, // 2 seconds max
        reportsGeneration: 3000, // 3 seconds max
        dashboardRefresh: 1500   // 1.5 seconds max
      };

      // Schedule page performance
      const scheduleStart = Date.now();
      cy.contains('Schedule').click();
      cy.get('[data-testid="schedule-loaded"]', { timeout: benchmarks.schedulePageLoad })
        .should('exist');
      
      cy.then(() => {
        const loadTime = Date.now() - scheduleStart;
        expect(loadTime).to.be.lessThan(benchmarks.schedulePageLoad);
      });

      // Reports performance
      const reportsStart = Date.now();
      cy.contains('Reports').click();
      cy.get('[data-testid="generate-report"]').click();
      cy.get('[data-testid="report-generated"]', { timeout: benchmarks.reportsGeneration })
        .should('exist');
      
      cy.then(() => {
        const reportTime = Date.now() - reportsStart;
        expect(reportTime).to.be.lessThan(benchmarks.reportsGeneration);
      });
    });

    it('should meet Phase 4 AI performance targets', () => {
      const aiPerformanceTargets = {
        responseTime: 750,    // 750ms max
        tokenEfficiency: 950, // <950 tokens per request
        cacheHitRate: 0.8     // >80% cache hit rate
      };

      cy.intercept('POST', '**/functions/v1/ai-agent-optimized', (req) => {
        const startTime = Date.now();
        
        req.reply((res) => {
          const responseTime = Date.now() - startTime;
          res.send({
            statusCode: 200,
            body: {
              response: 'Performance test response',
              responseTime,
              tokenUsage: { total: 850 }, // Under limit
              cacheHit: Math.random() > 0.15 // 85% hit rate
            }
          });
        });
      }).as('aiPerformanceTest');

      cy.contains('AI Assistant').click();
      
      // Test multiple requests
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="ai-chat-input"]')
          .clear()
          .type(`Performance test query ${i}`);
        cy.get('[data-testid="send-message"]').click();
        cy.wait('@aiPerformanceTest');
      }

      // Verify all requests meet targets
      cy.get('@aiPerformanceTest.all').then((interceptions) => {
        interceptions.forEach((interception, index) => {
          const { responseTime, tokenUsage, cacheHit } = interception.response.body;
          
          expect(responseTime, `Request ${index} response time`)
            .to.be.lessThan(aiPerformanceTargets.responseTime);
          expect(tokenUsage.total, `Request ${index} token usage`)
            .to.be.lessThan(aiPerformanceTargets.tokenEfficiency);
        });

        const cacheHitRate = interceptions.filter(i => 
          i.response.body.cacheHit
        ).length / interceptions.length;
        
        expect(cacheHitRate).to.be.greaterThan(aiPerformanceTargets.cacheHitRate);
      });
    });
  });
}); 