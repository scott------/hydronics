# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hydronics is a React-based visual designer for hydronic heating systems (P&ID-style diagrams). Users can drag-and-drop heating components (boilers, pumps, radiators, valves, etc.) onto a canvas, connect them with pipes, and run thermal simulations.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server at localhost:5173

# Build
npm run build        # TypeScript check + Vite production build

# Testing
npm run test         # Run Vitest unit tests once
npm run test:watch   # Run Vitest in watch mode
npm run test:e2e     # Run Playwright E2E tests (starts dev server automatically)
npm run test:e2e:ui  # Playwright with UI mode
npm run test:all     # Run both unit and E2E tests

# Linting
npm run lint         # ESLint check
```

## Architecture

### State Management (`src/store/index.ts`)
- **Zustand** store with **immer** middleware for immutable updates
- Persisted to localStorage via `zustand/middleware/persist`
- Central `SystemState` containing: `building`, `zones`, `components`, `pipes`, `connections`, `simulation`, `ui`
- Undo/redo support with history snapshots

### Type System (`src/types/index.ts`)
- Comprehensive TypeScript types for 30+ hydronic component types (boilers, pumps, valves, emitters, controls)
- Each component type has specific props interfaces (e.g., `BoilerGasProps`, `PumpProps`, `RadiantFloorProps`)
- `HydronicComponent` is a discriminated union of all component types
- `Pipe` and `Connection` types for system topology

### Calculation Engine (`src/calc/`)
- `heatLoss.ts` - Building heat loss calculations based on envelope, insulation, infiltration
- `emitterOutput.ts` - BTU output calculations for radiators, baseboards, radiant floors
- `piping.ts` - Pipe pressure drop and flow calculations
- `autoLayout.ts` - Dagre-based automatic layout with zone grouping and orthogonal pipe routing

### Component Rendering
- SVG-based rendering in `src/components/ComponentSVG/` with shapes for each component type
- `Canvas.tsx` - Main SVG canvas with pan/zoom, grid, drag-drop handling
- `PipeSVG.tsx` - Orthogonal pipe path rendering with animations
- Zone bounds visualization with color-coded regions

### Key Patterns
- Components are placed on canvas with `position: {x, y}`, `rotation`, `flippedH/V`
- Pipes connect components via `Connection` objects referencing port IDs (e.g., `supply`, `return`, `inlet`, `outlet`)
- Auto-layout uses dagre.js to arrange components hierarchically (mechanical room → zones) with zone separation

## Testing

- Unit tests: Vitest with `@testing-library/react`, located alongside source as `*.test.ts(x)`
- E2E tests: Playwright in `e2e/` directory
- Test setup clears localStorage before each test (store persistence)
