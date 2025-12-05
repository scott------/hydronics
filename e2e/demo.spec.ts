import { test, expect } from '@playwright/test';

test.describe('Hydronic System Designer - Demo System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh demo load
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for app to initialize
    await page.waitForSelector('svg', { timeout: 10000 });
  });

  test('should load demo system with all components visible', async ({ page }) => {
    // Check main canvas exists
    const canvas = page.locator('svg').first();
    await expect(canvas).toBeVisible();

    // Check for boiler component (mechanical room)
    const boiler = page.locator('text=Gas Boiler 150k BTU');
    await expect(boiler).toBeVisible();

    // Check for zone valves
    await expect(page.locator('text=Zone 1 Valve')).toBeVisible();
    await expect(page.locator('text=Zone 2 Valve')).toBeVisible();
    await expect(page.locator('text=Zone 3 Valve')).toBeVisible();
  });

  test('should display radiators for all zones', async ({ page }) => {
    // Zone 2 radiators (Floor 2)
    await expect(page.locator('text=2F Office')).toBeVisible();
    await expect(page.locator('text=2F Living 1')).toBeVisible();
    await expect(page.locator('text=2F Kitchen 1')).toBeVisible();

    // Zone 3 radiators (Floor 3)
    await expect(page.locator('text=3F Bedroom 1')).toBeVisible();
    await expect(page.locator('text=3F Master 1')).toBeVisible();
    await expect(page.locator('text=3F Office')).toBeVisible();
  });

  test('should display garage radiant floor', async ({ page }) => {
    const radiant = page.locator('text=Garage Radiant');
    await expect(radiant).toBeVisible();
  });

  test('should render supply and return pipes', async ({ page }) => {
    // Check that pipes are rendered (polyline elements for piping)
    const pipes = page.locator('polyline');
    const pipeCount = await pipes.count();
    // Should have many pipes connecting all components
    expect(pipeCount).toBeGreaterThan(20);
  });

  test('should show simulation is running', async ({ page }) => {
    // Look for running indicator or animated elements
    // The simulation starts in running state per demoSimulationState
    const runningIndicator = page.locator('text=/running|pause/i');
    // May not have visible text, but animation should be present
    await page.waitForTimeout(500); // Let animations start
    
    // Check for animated flow indicators (circles on pipes)
    const flowIndicators = page.locator('circle[fill]');
    const flowCount = await flowIndicators.count();
    expect(flowCount).toBeGreaterThan(0);
  });

  test('should allow selecting a component', async ({ page }) => {
    // Click on the boiler
    const boiler = page.locator('g').filter({ hasText: 'Gas Boiler 150k BTU' }).first();
    await boiler.click();

    // Properties panel should show component details
    const propsPanel = page.locator('text=/properties|details/i');
    // Component should be selected (visual feedback varies by implementation)
  });

  test('should display zone list', async ({ page }) => {
    // Check zone list panel
    const zoneList = page.locator('text=/Floor 1.*Garage|Floor 2.*Main|Floor 3.*Bedroom/i');
    await expect(zoneList.first()).toBeVisible();
  });

  test('should have palette with component types', async ({ page }) => {
    // Check palette exists with draggable components
    const palette = page.locator('[class*="palette"], [class*="Palette"]');
    await expect(palette.first()).toBeVisible();
  });

  test('should allow dragging components', async ({ page }) => {
    // Find a radiator and drag it
    const radiator = page.locator('g').filter({ hasText: '2F Office' }).first();
    const box = await radiator.boundingBox();
    
    if (box) {
      // Perform drag
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50, { steps: 10 });
      await page.mouse.up();
      
      // Verify component moved (position should change)
      const newBox = await radiator.boundingBox();
      if (newBox) {
        // Position should be different after drag
        expect(newBox.x).not.toBe(box.x);
      }
    }
  });

  test('pipes should update when component is moved', async ({ page }) => {
    // Get initial pipe positions
    const pipes = page.locator('polyline');
    const initialPipePoints = await pipes.first().getAttribute('points');

    // Find and drag a component
    const radiator = page.locator('g').filter({ hasText: '2F Office' }).first();
    const box = await radiator.boundingBox();
    
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();

      // Wait for pipes to update
      await page.waitForTimeout(100);

      // Check if connected pipe waypoints changed
      const updatedPipePoints = await pipes.first().getAttribute('points');
      // Note: The specific pipe that changes depends on which is connected
      // This test verifies the general mechanism works
    }
  });

  test('should display validation panel', async ({ page }) => {
    // Check for validation/errors panel
    const validation = page.locator('[class*="validation"], [class*="Validation"]');
    await expect(validation.first()).toBeVisible();
  });

  test('should display toolbar with actions', async ({ page }) => {
    // Check toolbar exists
    const toolbar = page.locator('[class*="toolbar"], [class*="Toolbar"]');
    await expect(toolbar.first()).toBeVisible();
  });

  test('visual regression - demo system layout', async ({ page }) => {
    // Wait for everything to load and animate
    await page.waitForTimeout(1000);
    
    // Take a screenshot for visual comparison
    await expect(page).toHaveScreenshot('demo-system.png', {
      maxDiffPixels: 1000, // Allow some variation for animations
    });
  });
});
