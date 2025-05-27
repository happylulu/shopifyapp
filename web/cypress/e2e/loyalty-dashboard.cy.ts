describe('Loyalty Dashboard E2E', () => {
  beforeEach(() => {
    // Stub the FastAPI backend calls
    cy.intercept('GET', '/api/loyalty/profiles/*', {
      fixture: 'customer-profile.json'
    }).as('getCustomerProfile');

    cy.intercept('GET', '/api/rewards/', {
      fixture: 'rewards.json'
    }).as('getRewards');

    cy.intercept('GET', '/api/tiers/', {
      fixture: 'tiers.json'
    }).as('getTiers');

    cy.intercept('PUT', '/api/loyalty/profiles/*/points/', {
      fixture: 'updated-profile.json'
    }).as('adjustPoints');

    // Mock Shopify App Bridge
    cy.window().then((win) => {
      win.shopify = {
        toast: {
          show: cy.stub().as('showToast')
        }
      };
    });
  });

  it('should load and display customer loyalty dashboard', () => {
    cy.visit('/customers/customer123/loyalty');

    // Wait for API calls
    cy.wait('@getCustomerProfile');
    cy.wait('@getRewards');
    cy.wait('@getTiers');

    // Check that customer info is displayed
    cy.contains('John Doe').should('be.visible');
    cy.contains('john@example.com').should('be.visible');
    cy.contains('1,250 points').should('be.visible');

    // Check that tier information is shown
    cy.contains('Silver').should('be.visible');
    cy.contains('Progress to Gold').should('be.visible');

    // Check that rewards are listed
    cy.contains('10% Discount').should('be.visible');
    cy.contains('Free Shipping').should('be.visible');
  });

  it('should allow points adjustment', () => {
    cy.visit('/customers/customer123/loyalty');
    cy.wait('@getCustomerProfile');

    // Click the add points button
    cy.contains('Add 100 Points').click();

    // Verify API call was made
    cy.wait('@adjustPoints').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        amount: 100,
        reason: 'Manual adjustment'
      });
    });

    // Verify toast notification
    cy.get('@showToast').should('have.been.calledWith', 
      'Added 100 points: Manual adjustment'
    );
  });

  it('should open redeem modal when reward is clicked', () => {
    cy.visit('/customers/customer123/loyalty');
    cy.wait(['@getCustomerProfile', '@getRewards']);

    // Click redeem button for first reward
    cy.get('[data-testid="reward-item"]').first()
      .find('button').contains('Redeem').click();

    // Modal should open
    cy.contains('Redeem Reward').should('be.visible');
    cy.contains('10% Discount').should('be.visible');
    cy.contains('Points Summary').should('be.visible');

    // Check points calculation
    cy.contains('Current Points: 1,250').should('be.visible');
    cy.contains('Reward Cost: -100').should('be.visible');
    cy.contains('Remaining Points: 1,150').should('be.visible');
  });

  it('should handle reward redemption flow', () => {
    // Mock the discount creation API
    cy.intercept('POST', '/api/graphql', {
      data: {
        discountCodeBasicCreate: {
          codeDiscountNode: {
            codeDiscount: {
              codes: {
                nodes: [{ code: 'LOYALTY123456' }]
              }
            }
          },
          userErrors: []
        }
      }
    }).as('createDiscount');

    cy.visit('/customers/customer123/loyalty');
    cy.wait(['@getCustomerProfile', '@getRewards']);

    // Open redeem modal
    cy.get('[data-testid="reward-item"]').first()
      .find('button').contains('Redeem').click();

    // Fill in customer email
    cy.get('input[type="email"]').type('customer@example.com');

    // Confirm redemption
    cy.contains('Confirm Redemption').click();

    // Verify API calls
    cy.wait('@adjustPoints');
    cy.wait('@createDiscount');

    // Verify success toast
    cy.get('@showToast').should('have.been.calledWith', 
      'Reward redeemed successfully! Discount code: LOYALTY123456'
    );
  });

  it('should handle insufficient points gracefully', () => {
    // Override customer profile with low points
    cy.intercept('GET', '/api/loyalty/profiles/*', {
      body: {
        id: '1',
        shopify_customer_id: 'customer123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        points_balance: 50, // Low points
        current_tier_name: 'Bronze',
        total_points_earned: 50,
        total_points_redeemed: 0
      }
    }).as('getLowPointsProfile');

    cy.visit('/customers/customer123/loyalty');
    cy.wait('@getLowPointsProfile');

    // Rewards should show as unavailable
    cy.contains('Insufficient Points').should('be.visible');
    cy.get('button').contains('Unavailable').should('be.disabled');
  });

  it('should display tier progress correctly', () => {
    cy.visit('/customers/customer123/loyalty');
    cy.wait(['@getCustomerProfile', '@getTiers']);

    // Check tier progress bar
    cy.get('[data-testid="tier-progress"]').should('be.visible');
    cy.contains('Progress to Gold').should('be.visible');
    cy.contains('250 points to Gold').should('be.visible');

    // Progress bar should show correct percentage
    cy.get('[data-testid="progress-bar"]')
      .should('have.css', 'width')
      .and('match', /\d+%/);
  });

  it('should handle API errors gracefully', () => {
    // Simulate API error
    cy.intercept('GET', '/api/loyalty/profiles/*', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('getProfileError');

    cy.visit('/customers/customer123/loyalty');
    cy.wait('@getProfileError');

    // Should show error message
    cy.contains('Failed to load customer data').should('be.visible');
    
    // Should show toast notification
    cy.get('@showToast').should('have.been.calledWith', 
      'Failed to load customer data', 
      { isError: true }
    );
  });
});
