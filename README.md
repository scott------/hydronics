# Residential Hydronic Heating System Designer & Simulator

Interactive React + TypeScript + SVG application for designing, configuring, and simulating residential hydronic heating systems with real-time calculations and visualization.

## Goals
- Let HVAC pros and homeowners lay out hydronic schematics quickly with an SVG canvas, palette, and piping tools.
- Provide reliable Manual J–style heat-loss, flow, head, and expansion sizing calculations in-product.
- Run a lightweight simulation loop with overlays for temperature, flow, and equipment status.
- Offer save/load (JSON), export (PNG/SVG/CSV/PDF report later), and prebuilt templates to speed workflows.

## Tech Stack
- React 19 + TypeScript on Vite.
- SVG-first rendering for all components and piping.
- Planned state: component graph + simulation state stored in a predictable store (e.g., Zustand with Immer), persisted to localStorage.
- Styling: CSS modules (or minimal utility classes) to keep SVG and UI cohesive.
- Optional: Web Workers for heavier calculations to keep UI responsive.

## Local Development
- Install deps: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`

## MVP Scope
- Building model: form for location/climate, envelope, windows/doors, infiltration; zone creation with heat-loss override.
- Calculations: Manual J–style breakdown (walls, windows, doors, ceiling, floor, infiltration) with total BTU/hr; GPM from BTU and delta-T; simple pipe equivalent length and velocity warnings.
- Canvas/UX: left palette (heat source, pump, pipe, baseboard, valve, expansion tank), SVG canvas with pan/zoom, snap-to-grid, drag/drop, select, delete, duplicate, rotate, flip, basic z-order.
- Piping: point-to-point with orthogonal routing and waypoints; ports color-coded; supply/return validation; flow direction arrows in sim mode.
- Properties panel: editable properties per component; system summary with total load, recommended boiler size, per-zone loads.
- Persistence: save/load design to JSON (localStorage) and import/export JSON.
- Validation: missing return path, unconnected ports, missing required safety items, undersized/oversized boiler, pipe velocity bounds.

## Feature Sprints
1) Data & Heat-Loss Core
- Define domain types (building, zones, components, ports, pipes, simulation state).
- Implement building + zone forms with validation and ACCA-style heat-loss engine and breakdown UI.
- Persist drafts to localStorage; basic undo/redo scaffolding.

2) Canvas & Palette Fundamentals
- SVG canvas with pan/zoom, grid, snap, layers; palette with draggable components; selection, marquee, context menu; rotate/flip.
- Component SVGs for core set (boiler, pump, zone valve, baseboard, radiant zone, expansion tank, mixing valve placeholder) with ports metadata.
- Piping tool with orthogonal routing, waypoints, snapping to ports, type supply/return styling.

3) Hydronic Calculations & Validation
- Flow/head calcs per circuit; equivalent lengths and fittings; pressure-drop aggregation; pipe velocity warnings.
- Pump sizing check vs curve (load sample curve JSON); system curve plotting groundwork.
- Design-time validation set (missing safety items, dead legs, condensing return temp warnings).

4) Simulation Mode (Base)
- Time-step loop (dt slider) for thermostat calls, outdoor reset, boiler firing rate, zone loads.
- Thermal mass approximation per component; supply/return temps; flow overlays; animated statuses; metrics dashboard time-series stubs.

5) Templates, Exports, Hardening
- Prebuilt templates (single zone, multi-zone baseboard, radiant with manifold, primary/secondary, heat pump + buffer, condensing + low-temp radiant).
- Export schematic to PNG/SVG; CSV equipment list; PDF report shell with schematic + schedules.
- Polish accessibility, keyboard shortcuts, tooltips, onboarding help, and documentation.

## Architecture Outline
- `SystemState`: building config, zones, components map, pipes map, connections, simulation state, UI state.
- Rendering: SVG layer groups (equipment, piping, overlays); React memoization for stable performance.
- Interaction: command pattern for undo/redo; snap + constraints driven by port metadata; context menu actions.
- Calculations: pure modules for heat loss, flow/head, expansion sizing, validation; optional offload to worker.
- Persistence: JSON schema versioning to avoid breaking older saves; migration hooks.

## Next Steps
- Choose state library (Zustand recommended) and add schema types.
- Stub core domain types and calculation modules.
- Build canvas shell (grid, pan/zoom) and palette with one working component and pipe to validate interaction model.
