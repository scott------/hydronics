# Residential Hydronic Heating System Designer & Simulator

[![Live Demo](https://img.shields.io/badge/demo-localhost:5173-blue)](http://localhost:5173)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff)](https://vite.dev/)

Interactive React + TypeScript + SVG application for designing, configuring, and simulating residential hydronic heating systems with real-time calculations and visualization.

## ✨ Features (MVP)

- **SVG Canvas** – Pan/zoom, snap-to-grid, drag-and-drop components
- **Component Palette** – Boilers, pumps, baseboards, radiant floors, valves, expansion tanks, and more
- **Building Configuration** – Climate, envelope, insulation, windows/doors, infiltration inputs
- **Heat-Loss Calculations** – Manual J–style breakdown (walls, windows, doors, ceiling, floor, infiltration)
- **Zone Management** – Create multiple heating zones with individual load overrides
- **Properties Panel** – Edit component properties; view system summary with recommended boiler size
- **Validation** – Warnings for missing safety items, unconnected components
- **Persistence** – Save/load designs to JSON (localStorage + file export/import)

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/scott------/hydronics.git
cd hydronics

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## 🛠 Tech Stack

- **React 19** + **TypeScript 5.9** on **Vite 7**
- **Zustand** + **Immer** for state management
- **SVG** for all component rendering and piping
- **CSS Modules** for scoped styling
- **localStorage** persistence with JSON export/import

## 🏗 Project Structure

```
src/
├── calc/           # Heat-loss & piping calculation modules
├── components/     # React components
│   ├── BuildingForm/
│   ├── Canvas/
│   ├── ComponentSVG/
│   ├── Palette/
│   ├── PipeSVG/
│   ├── PropertiesPanel/
│   ├── Toolbar/
│   ├── ValidationPanel/
│   └── ZoneList/
├── store/          # Zustand store
└── types/          # TypeScript domain types
```

## 🎯 MVP Scope (Complete)

- [x] Building model with climate, envelope, windows/doors, infiltration
- [x] Zone creation with heat-loss override
- [x] Manual J–style heat-loss breakdown with total BTU/hr
- [x] GPM calculation from BTU and delta-T
- [x] Pipe equivalent length and velocity warnings
- [x] SVG canvas with pan/zoom, snap-to-grid, drag/drop
- [x] Component palette with drag-and-drop
- [x] Properties panel with system summary
- [x] Save/load JSON persistence
- [x] Design-time validation warnings

## 🗺 Roadmap (Feature Sprints)

### Sprint 1: Data & Heat-Loss Core ✅
- [x] Define domain types (building, zones, components, ports, pipes, simulation state)
- [x] Building + zone forms with validation
- [x] ACCA-style heat-loss engine and breakdown UI
- [x] Persist drafts to localStorage
- [ ] Undo/redo scaffolding

### Sprint 2: Canvas & Palette Fundamentals ✅
- [x] SVG canvas with pan/zoom, grid, snap, layers
- [x] Palette with draggable components
- [x] Selection, rotate/flip actions
- [x] Component SVGs (boiler, pump, zone valve, baseboard, radiant zone, expansion tank)
- [ ] Marquee selection
- [ ] Context menu
- [ ] Piping tool with orthogonal routing

### Sprint 3: Hydronic Calculations & Validation
- [x] Flow/head calcs per circuit
- [x] Equivalent lengths and fittings
- [x] Pipe velocity warnings
- [ ] Pump sizing check vs curve
- [ ] System curve plotting
- [ ] Dead leg detection
- [ ] Condensing return temp warnings

### Sprint 4: Simulation Mode
- [ ] Time-step loop (dt slider)
- [ ] Thermostat calls, outdoor reset, boiler firing rate
- [ ] Thermal mass approximation
- [ ] Supply/return temp overlays
- [ ] Flow animation
- [ ] Metrics dashboard

### Sprint 5: Templates, Exports, Polish
- [ ] Prebuilt templates (single zone, multi-zone, radiant, primary/secondary)
- [ ] Export to PNG/SVG
- [ ] CSV equipment list
- [ ] PDF report
- [ ] Keyboard shortcuts
- [ ] Onboarding help

## 📐 Architecture

```
SystemState
├── building        # Climate, envelope, insulation config
├── zones[]         # Heating zone definitions
├── components{}    # Map of placed equipment
├── pipes{}         # Map of pipe segments
├── connections[]   # Port-to-port links
├── simulation      # Runtime state (temps, flows, statuses)
└── ui              # Tool, selection, zoom, pan
```

- **Rendering**: SVG layer groups (equipment → piping → overlays); React.memo for performance
- **Interaction**: Snap + constraints from port metadata; command pattern for undo/redo
- **Calculations**: Pure modules (`calc/heatLoss.ts`, `calc/piping.ts`); optionally offload to Web Worker
- **Persistence**: JSON schema versioning with migration hooks

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © 2024
