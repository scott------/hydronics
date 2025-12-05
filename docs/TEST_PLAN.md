# Hydronic System Designer - Test Plan

## Overview

This document outlines the test strategy for the Hydronic System Designer application. The testing approach focuses on unit tests for business logic, integration tests for state management, and component tests for UI interactions.

## Test Categories

### 1. Unit Tests - Calculation Modules

#### Heat Loss Calculations (`src/calc/heatLoss.ts`)
| Test ID | Description | Priority |
|---------|-------------|----------|
| HL-001 | `rToU` correctly converts R-value to U-value | High |
| HL-002 | `rToU` handles edge cases (zero, negative) | High |
| HL-003 | `deltaT` calculates correct temperature difference | High |
| HL-004 | `estimateWallArea` calculates net wall area | Medium |
| HL-005 | `buildingVolume` calculates correct volume | Medium |
| HL-006 | `infiltrationCFM` converts ACH to CFM | Medium |
| HL-007 | `calculateHeatLoss` returns complete breakdown | High |
| HL-008 | `calculateHeatLoss` sums components correctly | High |
| HL-009 | `allocateZoneHeatLoss` distributes by sqFt | Medium |
| HL-010 | `allocateZoneHeatLoss` respects overrides | Medium |
| HL-011 | `requiredGPM` calculates flow from BTU load | High |
| HL-012 | `btuFromFlow` calculates BTU from GPM | High |

#### Piping Calculations (`src/calc/piping.ts`)
| Test ID | Description | Priority |
|---------|-------------|----------|
| PP-001 | `velocity` calculates correct fps from GPM | High |
| PP-002 | `frictionLossPer100Ft` uses Hazen-Williams correctly | High |
| PP-003 | `totalEquivalentLength` adds fitting lengths | Medium |
| PP-004 | `pipeHeadLoss` combines length and friction | High |
| PP-005 | `velocityWarning` returns correct status | Medium |
| PP-006 | Pipe ID lookup returns correct values | Low |

### 2. Integration Tests - State Management

#### Store Actions (`src/store/index.ts`)
| Test ID | Description | Priority |
|---------|-------------|----------|
| ST-001 | `addComponent` creates component with unique ID | High |
| ST-002 | `removeComponent` deletes component and connections | High |
| ST-003 | `moveComponent` updates position with snap | Medium |
| ST-004 | `rotateComponent` updates rotation correctly | Medium |
| ST-005 | `addPipe` creates pipe with waypoints | High |
| ST-006 | `removePipe` cleans up connections | High |
| ST-007 | `startPipeConnection` sets pending state | High |
| ST-008 | `completePipeConnection` creates pipe and connection | High |
| ST-009 | `completePipeConnection` prevents self-connection | Medium |
| ST-010 | `cancelPipeConnection` clears pending state | Medium |
| ST-011 | `addZone` creates zone with ID | Medium |
| ST-012 | `updateZone` modifies zone properties | Medium |
| ST-013 | Selection actions work correctly | Medium |
| ST-014 | `resetState` clears all data | Low |

### 3. Component Tests - UI

#### Canvas Component (`src/components/Canvas/Canvas.tsx`)
| Test ID | Description | Priority |
|---------|-------------|----------|
| CV-001 | Renders grid when showGrid is true | Medium |
| CV-002 | Renders components from store | High |
| CV-003 | Renders pipes from store | High |
| CV-004 | Pending connection preview displays | High |
| CV-005 | Wheel zoom changes zoom level | Low |
| CV-006 | Click on background clears selection | Medium |
| CV-007 | Escape key cancels pending connection | Medium |

#### PortCircle Component (`src/components/PortCircle/PortCircle.tsx`)
| Test ID | Description | Priority |
|---------|-------------|----------|
| PC-001 | Renders port with correct color by type | Medium |
| PC-002 | Click starts pipe connection | High |
| PC-003 | Click on target completes connection | High |
| PC-004 | Shows highlight when can connect | Medium |
| PC-005 | Shows connected state (grayed) | Medium |

#### ComponentSVG (`src/components/ComponentSVG/ComponentSVG.tsx`)
| Test ID | Description | Priority |
|---------|-------------|----------|
| CS-001 | Renders correct shape for component type | High |
| CS-002 | Applies transform correctly | Medium |
| CS-003 | Shows selection indicator when selected | Medium |
| CS-004 | Renders port circles | High |

### 4. Helper Function Tests

#### Orthogonal Path Generation
| Test ID | Description | Priority |
|---------|-------------|----------|
| OP-001 | Generates valid L-shaped path | High |
| OP-002 | Horizontal-dominant routing | Medium |
| OP-003 | Vertical-dominant routing | Medium |
| OP-004 | Same point returns minimal path | Low |

## Test Coverage Goals

| Category | Target Coverage |
|----------|-----------------|
| Calculation modules | 90%+ |
| Store actions | 85%+ |
| Components | 70%+ |
| Overall | 80%+ |

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/calc/heatLoss.test.ts
```

## Test File Locations

```
src/
├── calc/
│   ├── heatLoss.test.ts
│   └── piping.test.ts
├── store/
│   └── index.test.ts
├── components/
│   ├── Canvas/
│   │   └── Canvas.test.tsx
│   ├── PortCircle/
│   │   └── PortCircle.test.tsx
│   └── ComponentSVG/
│       └── ComponentSVG.test.tsx
└── test/
    └── setup.ts
```

## Mocking Strategy

- **Store**: Use `useStore.setState()` for direct state manipulation in tests
- **localStorage**: Cleared before each test via setup file
- **SVG events**: Use `@testing-library/user-event` for interactions
- **Component props**: Provide minimal valid props for each test

## Continuous Integration

Tests should run on:
- Every pull request
- Every push to main branch
- Before deployment

Failure on any test should block merges/deployments.
