import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const axeCheck = async (page: import('@playwright/test').Page, name: string) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations, `${name}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.help })), null, 2)}`).toEqual([]);
};

test.describe('landing', () => {
  test('hero CTAs work and the page passes axe in dark and light themes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agents do the work. You hold the gates.');
    await expect(page.getByTestId('cta-start')).toHaveAttribute('href', '/docs/getting-started/');
    await expect(page.getByRole('link', { name: /Star on GitHub/ })).toHaveAttribute('href', 'https://github.com/zheref/hatsu');
    await axeCheck(page, 'landing dark');
    await page.locator('button[aria-label="Switch to light mode"]:visible').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await axeCheck(page, 'landing light');
    await page.getByTestId('cta-start').click();
    await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
  });
  test('quick start tabs switch by click and by keyboard', async ({ page }) => {
    await page.goto('/#quickstart');
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(4);
    await tabs.nth(1).click();
    await expect(page.getByRole('tabpanel')).toContainText('--surface codex');
    await tabs.nth(1).press('ArrowRight');
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('cursor');
  });
  test('sponsors and services sections render from config', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('sponsor-button')).toHaveAttribute('href', 'https://github.com/sponsors/zheref');
    await expect(page.getByTestId('sponsor-wall')).toContainText('No sponsors yet');
    await expect(page.locator('#services')).toContainText('From');
    await expect(page.locator('#services [data-tbd="true"]').first()).toBeVisible();
    await expect(page.getByTestId('services-contact')).toBeVisible();
  });
  test('architecture layers and gates are selectable by keyboard', async ({ page }) => {
    await page.goto('/#architecture');
    await page.getByRole('button', { name: /^G3/ }).click();
    await expect(page.locator('#architecture [aria-live="polite"]')).toContainText('G3');
    await page.getByRole('button', { name: /Nen/ }).first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#architecture [aria-live="polite"]')).toContainText('One deterministic CLI binary');
  });
  test('no horizontal scroll at the viewport width', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('docs', () => {
  test('docs nav reaches every page and the hatsu guide renders code name plus alias', async ({ page }) => {
    await page.goto('/docs/');
    const nav = page.getByTestId('docs-nav');
    await expect(nav.getByRole('link')).toHaveCount(9);
    await nav.getByRole('link', { name: 'Hatsu guide' }).click();
    await expect(page).toHaveURL(/\/docs\/hatsu-guide\/$/);
    const aka = page.locator('[data-skill="aka"]');
    await expect(aka).toContainText('aka');
    await expect(aka).toContainText('push');
    await expect(page.locator('[data-agent="nobunaga"]')).toContainText('Code Reviewer');
    await axeCheck(page, 'hatsu guide');
  });
  test('services page renders its h1 and passes axe', async ({ page }) => {
    await page.goto('/services/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Governed AI delivery setup');
    await axeCheck(page, 'services');
  });
});
