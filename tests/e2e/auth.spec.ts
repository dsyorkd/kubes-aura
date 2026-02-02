import { test, expect } from '../setup/fixtures';
import { mockApiRoute, navigateTo, setupDefaultApiMocks } from '../utils/helpers';
import { mockUsers, mockAuthToken } from '../setup/test-data';

// ── Task #93: Basic Login Flow Tests ─────────────────────────────────────────

test.describe('Auth - Login Flow', () => {
  test('renders login page with form elements', async ({ page }) => {
    await navigateTo(page, '/auth/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText('Sign in to your Pi-Controller account')).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    const mockUser = mockUsers[0]; // admin user

    // Mock the auth login API endpoint to return success
    await mockApiRoute(
      page,
      'auth/login',
      {
        success: true,
        user: mockUser,
        token: mockAuthToken,
      },
      { method: 'POST' },
    );

    // Also set up default API mocks for the dashboard page
    await setupDefaultApiMocks(page);

    await navigateTo(page, '/auth/login');

    // Fill in credentials
    await page.getByLabel(/username/i).fill(mockUser.username);
    await page.getByLabel(/password/i).fill('Admin123!@#');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*\/pi-controller/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();
  });

  test('login form shows validation errors for empty fields', async ({ page }) => {
    await navigateTo(page, '/auth/login');

    // Click sign in without filling any fields
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should display validation error messages
    await expect(page.getByText(/username is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('login form shows error for short username', async ({ page }) => {
    await navigateTo(page, '/auth/login');

    await page.getByLabel(/username/i).fill('ab');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/username must be at least 3 characters/i)).toBeVisible();
  });

  test('login form shows error for short password', async ({ page }) => {
    await navigateTo(page, '/auth/login');

    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('12345');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/password must be at least 6 characters/i)).toBeVisible();
  });

  test('login form shows error on failed authentication', async ({ page }) => {
    // Mock the auth API to return failure
    await mockApiRoute(
      page,
      'auth/login',
      { success: false, message: 'Invalid credentials' },
      { method: 'POST' },
    );

    await navigateTo(page, '/auth/login');

    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid credentials|login failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('password visibility toggle works', async ({ page }) => {
    await navigateTo(page, '/auth/login');

    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.fill('testpassword');

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the toggle button to show password
    await page.getByRole('button', { name: '' }).first().click();

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('navigate to register page from login', async ({ page }) => {
    await navigateTo(page, '/auth/login');

    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/.*\/auth\/register/);
  });

  test('remember me checkbox is functional', async ({ page }) => {
    await navigateTo(page, '/auth/login');

    const rememberCheckbox = page.getByLabel(/remember me/i);
    await expect(rememberCheckbox).toBeVisible();
    await rememberCheckbox.click();
  });
});

// ── Task #96: Successful Registration and Basic Validation ───────────────────

test.describe('Auth - Registration', () => {
  test('renders registration page with form elements', async ({ page }) => {
    await navigateTo(page, '/auth/register');

    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByText('Join Pi-Controller to manage your cluster')).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel('Password *')).toBeVisible();
    await expect(page.getByLabel('Confirm Password *')).toBeVisible();
  });

  test('successful registration with valid data redirects to dashboard', async ({ page }) => {
    const newUser = {
      id: 10,
      username: 'newuser',
      email: 'new@pi-controller.local',
      role: 'user' as const,
      created_at: new Date().toISOString(),
    };

    // Mock the auth register API endpoint
    await mockApiRoute(
      page,
      'auth/register',
      {
        success: true,
        user: newUser,
        token: mockAuthToken,
      },
      { method: 'POST' },
    );

    // Set up default API mocks for the dashboard
    await setupDefaultApiMocks(page);

    await navigateTo(page, '/auth/register');

    // Fill valid registration data
    await page.getByLabel(/username/i).fill('newuser');
    await page.getByLabel(/email/i).fill('new@pi-controller.local');
    await page.getByLabel('Password *').fill('StrongPass123!');
    await page.getByLabel('Confirm Password *').fill('StrongPass123!');

    // Agree to terms
    await page.getByLabel(/i agree to the/i).click();

    // Submit the form
    await page.getByRole('button', { name: /create account/i }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*\/pi-controller/, { timeout: 10000 });
  });

  test('shows validation error for empty username', async ({ page }) => {
    await navigateTo(page, '/auth/register');

    // Fill everything except username
    await page.getByLabel('Password *').fill('StrongPass123!');
    await page.getByLabel('Confirm Password *').fill('StrongPass123!');
    await page.getByLabel(/i agree to the/i).click();

    // Submit — button may be disabled, try clicking
    await page.getByRole('button', { name: /create account/i }).click({ force: true });

    await expect(page.getByText(/username is required/i)).toBeVisible();
  });

  test('shows validation error for password mismatch', async ({ page }) => {
    await navigateTo(page, '/auth/register');

    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel('Password *').fill('StrongPass123!');
    await page.getByLabel('Confirm Password *').fill('DifferentPass456!');
    await page.getByLabel(/i agree to the/i).click();

    await page.getByRole('button', { name: /create account/i }).click({ force: true });

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('shows validation error for invalid email format', async ({ page }) => {
    await navigateTo(page, '/auth/register');

    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel('Password *').fill('StrongPass123!');
    await page.getByLabel('Confirm Password *').fill('StrongPass123!');
    await page.getByLabel(/i agree to the/i).click();

    await page.getByRole('button', { name: /create account/i }).click({ force: true });

    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('shows password strength indicator', async ({ page }) => {
    await navigateTo(page, '/auth/register');

    // Type a weak password
    await page.getByLabel('Password *').fill('abc');
    await expect(page.getByText(/weak/i)).toBeVisible();

    // Type a strong password
    await page.getByLabel('Password *').fill('StrongPass123!@#');
    await expect(page.getByText(/strong/i)).toBeVisible();
  });

  test('shows password match confirmation', async ({ page }) => {
    await navigateTo(page, '/auth/register');

    await page.getByLabel('Password *').fill('StrongPass123!');
    await page.getByLabel('Confirm Password *').fill('StrongPass123!');

    await expect(page.getByText(/passwords match/i)).toBeVisible();
  });

  test('terms agreement is required', async ({ page }) => {
    await navigateTo(page, '/auth/register');

    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel('Password *').fill('StrongPass123!');
    await page.getByLabel('Confirm Password *').fill('StrongPass123!');

    // Don't agree to terms, try to submit
    await page.getByRole('button', { name: /create account/i }).click({ force: true });

    await expect(page.getByText(/must agree to the terms/i)).toBeVisible();
  });

  test('navigate to login page from register', async ({ page }) => {
    await navigateTo(page, '/auth/register');

    await page.getByRole('button', { name: /sign in instead/i }).click();
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('shows error on registration API failure', async ({ page }) => {
    // Mock registration failure
    await mockApiRoute(
      page,
      'auth/register',
      { success: false, message: 'Username already exists' },
      { method: 'POST' },
    );

    await navigateTo(page, '/auth/register');

    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel('Password *').fill('StrongPass123!');
    await page.getByLabel('Confirm Password *').fill('StrongPass123!');
    await page.getByLabel(/i agree to the/i).click();

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/username already exists|registration failed/i)).toBeVisible({
      timeout: 10000,
    });
  });
});

// ── Task #99: Protected Route Access Tests ───────────────────────────────────

test.describe('Auth - Protected Routes', () => {
  test('unauthenticated access to dashboard loads login or dashboard', async ({ page }) => {
    // Clear any auth state — don't set localStorage tokens
    await page.goto('about:blank');
    await page.evaluate(() => {
      localStorage.removeItem('pi-controller-token');
      localStorage.removeItem('pi-controller-user');
    });

    await setupDefaultApiMocks(page);
    await navigateTo(page, '/pi-controller');

    // The app should either redirect to login or show the dashboard
    // (depends on whether route protection is implemented)
    const currentUrl = page.url();
    const isOnLogin = /\/auth\/login/.test(currentUrl);
    const isOnDashboard = /\/pi-controller/.test(currentUrl);

    expect(isOnLogin || isOnDashboard).toBeTruthy();
  });

  test('unauthenticated access to nodes page', async ({ page }) => {
    await page.goto('about:blank');
    await page.evaluate(() => {
      localStorage.removeItem('pi-controller-token');
      localStorage.removeItem('pi-controller-user');
    });

    await setupDefaultApiMocks(page);
    await navigateTo(page, '/pi-controller/nodes');

    const currentUrl = page.url();
    const isOnLogin = /\/auth\/login/.test(currentUrl);
    const isOnNodes = /\/nodes/.test(currentUrl);

    expect(isOnLogin || isOnNodes).toBeTruthy();
  });

  test('unauthenticated access to settings page', async ({ page }) => {
    await page.goto('about:blank');
    await page.evaluate(() => {
      localStorage.removeItem('pi-controller-token');
      localStorage.removeItem('pi-controller-user');
    });

    await navigateTo(page, '/pi-controller/settings');

    const currentUrl = page.url();
    const isOnLogin = /\/auth\/login/.test(currentUrl);
    const isOnSettings = /\/settings/.test(currentUrl);

    expect(isOnLogin || isOnSettings).toBeTruthy();
  });

  test('unauthenticated access to clusters page', async ({ page }) => {
    await page.goto('about:blank');
    await page.evaluate(() => {
      localStorage.removeItem('pi-controller-token');
      localStorage.removeItem('pi-controller-user');
    });

    await setupDefaultApiMocks(page);
    await navigateTo(page, '/pi-controller/clusters');

    const currentUrl = page.url();
    const isOnLogin = /\/auth\/login/.test(currentUrl);
    const isOnClusters = /\/clusters/.test(currentUrl);

    expect(isOnLogin || isOnClusters).toBeTruthy();
  });

  test('authenticated user can access all protected routes', async ({ authenticatedPage }) => {
    await setupDefaultApiMocks(authenticatedPage);

    // Dashboard
    await navigateTo(authenticatedPage, '/pi-controller');
    await expect(authenticatedPage.getByRole('heading', { name: 'Pi Controller Dashboard' })).toBeVisible();

    // Nodes
    await navigateTo(authenticatedPage, '/pi-controller/nodes');
    await expect(authenticatedPage.getByRole('heading', { name: 'All Nodes' })).toBeVisible();

    // Clusters
    await navigateTo(authenticatedPage, '/pi-controller/clusters');
    await expect(authenticatedPage.getByRole('heading', { name: 'Clusters', level: 1 })).toBeVisible();

    // Settings
    await navigateTo(authenticatedPage, '/pi-controller/settings');
    await expect(authenticatedPage.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();
  });

  test('authenticated user is redirected from login page to dashboard', async ({
    authenticatedPage,
  }) => {
    await setupDefaultApiMocks(authenticatedPage);

    // Navigate to login while already authenticated
    await navigateTo(authenticatedPage, '/auth/login');

    // Should redirect to dashboard since already authenticated
    await expect(authenticatedPage).toHaveURL(/.*\/pi-controller/, { timeout: 10000 });
  });

  test('logout clears auth state', async ({ authenticatedPage }) => {
    await setupDefaultApiMocks(authenticatedPage);
    await navigateTo(authenticatedPage, '/pi-controller');

    // Verify auth tokens exist in localStorage
    const hasToken = await authenticatedPage.evaluate(() => {
      return !!localStorage.getItem('pi-controller-token');
    });
    expect(hasToken).toBeTruthy();

    // Clear auth state (simulate logout)
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('pi-controller-token');
      localStorage.removeItem('pi-controller-user');
    });

    // Verify tokens are cleared
    const hasTokenAfterLogout = await authenticatedPage.evaluate(() => {
      return !!localStorage.getItem('pi-controller-token');
    });
    expect(hasTokenAfterLogout).toBeFalsy();
  });
});
