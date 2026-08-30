import { expect, test } from '@playwright/test';

const accessToken = 'access-token';
const refreshToken = 'refresh-token';

const initialShop = {
  name: 'healthy-food',
  displayName: 'Healthy Food',
  availability: 'high',
  databaseType: 'standard',
  walletAddress: '0xabc123',
  ready: true,
  replicas: 3,
  url: 'https://healthy-food.example.com',
};

test.describe('ShopHub dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/auth-api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken, refreshToken }),
      });
    });

    await page.route('**/auth-api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ userId: 'user-1', email: 'owner@example.com' }),
      });
    });

    await page.route('**/shop-api/shops', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([initialShop]),
        });
        return;
      }

      expect(route.request().method()).toBe('POST');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...initialShop,
          name: 'new-shop',
          displayName: 'New Shop',
          availability: 'standard',
          replicas: 2,
          walletAddress: '0xnew-wallet',
        }),
      });
    });

    await page.route('**/shop-api/shops/*', async (route) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...initialShop,
            displayName: 'Healthy Food Updated',
            availability: 'standard',
            replicas: 2,
            walletAddress: '0xupdated',
          }),
        });
        return;
      }

      expect(method).toBe('DELETE');
      await route.fulfill({ status: 204, body: '' });
    });
  });

  test('logs in and manages a shop through the dashboard', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Email address').fill('owner@example.com');
    await page.getByLabel('Password').fill('S3curePass!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Your shops' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Healthy Food' })).toBeVisible();
    await expect(page.getByText('owner@example.com')).toBeVisible();

    await page.getByRole('button', { name: '+ New shop' }).click();
    await page.getByLabel('Shop name').fill('New Shop');
    await page.getByLabel('Wallet address').fill('0xnew-wallet');
    await page.getByLabel('Discord channel').fill('orders');
    await page.getByLabel('Discord server id').fill('999');
    await page.getByRole('button', { name: 'Create shop' }).click();
    await expect(page.getByRole('heading', { name: 'New Shop' })).toBeVisible();

    await page.getByRole('button', { name: 'Configure' }).last().click();
    await page.getByLabel('Shop name').fill('Healthy Food Updated');
    await page.getByLabel('Wallet address').fill('0xupdated');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
      page.getByRole('heading', { name: 'Healthy Food Updated' }),
    ).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).last().click();
    await expect(page.getByRole('heading', { name: 'New Shop' })).toHaveCount(0);
  });
});