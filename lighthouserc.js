/**
 * Lighthouse CI Configuration for Kubes Aura
 * 
 * Configures performance, accessibility, best practices, and SEO thresholds
 * for the Pi Controller web interface.
 */

module.exports = {
  ci: {
    collect: {
      // Build the app before running Lighthouse
      staticDistDir: './dist',
      url: [
        // Main application pages to test
        'http://localhost:4173/',                    // Homepage/Dashboard
        'http://localhost:4173/nodes',               // Nodes list
        'http://localhost:4173/clusters',            // Clusters list
        'http://localhost:4173/settings',            // Settings page
      ],
      numberOfRuns: 3,  // Run 3 times and average the results
    },
    assert: {
      // Performance threshold: >60
      assertions: {
        'categories:performance': ['error', { minScore: 0.6 }],
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.6 }],
        
        // Specific performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Accessibility checks
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        
        // Best practices
        'uses-https': 'off',  // Not applicable for local development
        'is-on-https': 'off', // Not applicable for local development
        
        // SEO basics
        'document-title': 'error',
        'meta-description': 'error',
        'meta-viewport': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',  // Store results temporarily for CI
    },
    server: {
      command: 'npm run preview',  // Start preview server
      port: 4173,
      wait: 5000,  // Wait 5 seconds for server to start
    },
  },
};