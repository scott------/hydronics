// ─────────────────────────────────────────────────────────────────────────────
// Auto Layout Engine using dagre.js for hierarchical graph layout
// Implements professional P&ID-style layout with:
//   - Left-to-right flow (mechanical room → zones)
//   - Orthogonal pipe routing
//   - Zone grouping with visual bounding boxes
//   - Incremental mode (preserves user-moved components)
// ─────────────────────────────────────────────────────────────────────────────
import dagre from '@dagrejs/dagre';
import type {
  HydronicComponent,
  Pipe,
  Connection,
  Zone,
  Position,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ZoneBounds {
  zoneId: string;
  zoneName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface LayoutOptions {
  /** Layout direction: 'LR' (left-to-right) or 'TB' (top-to-bottom) */
  direction: 'LR' | 'TB';
  /** Spacing between nodes */
  nodeSep: number;
  /** Spacing between ranks (levels) */
  rankSep: number;
  /** Spacing between edges */
  edgeSep: number;
  /** Grid size for snapping */
  gridSize: number;
  /** Padding around zone bounding boxes */
  zonePadding: number;
  /** Set of component IDs that should NOT be moved (user has positioned them) */
  lockedComponentIds?: Set<string>;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'LR',
  nodeSep: 80,
  rankSep: 150,
  edgeSep: 30,
  gridSize: 20,
  zonePadding: 40,
};

// ─────────────────────────────────────────────────────────────────────────────
// Component Dimensions (for layout node sizing)
// ─────────────────────────────────────────────────────────────────────────────

interface ComponentDimensions {
  width: number;
  height: number;
}

function getComponentDimensions(component: HydronicComponent): ComponentDimensions {
  // Default dimensions based on component type
  const dims: Record<string, ComponentDimensions> = {
    boiler_gas: { width: 80, height: 60 },
    boiler_oil: { width: 80, height: 60 },
    boiler_electric: { width: 80, height: 60 },
    pump_fixed: { width: 60, height: 60 },
    pump_variable: { width: 60, height: 60 },
    zone_pump: { width: 60, height: 60 },
    air_separator: { width: 60, height: 60 },
    expansion_tank: { width: 60, height: 70 },
    zone_valve_2way: { width: 60, height: 60 },
    zone_valve_3way: { width: 60, height: 60 },
    mixing_valve: { width: 60, height: 60 },
    radiant_floor: { width: 80, height: 70 },
    baseboard: { width: 100, height: 60 },
    panel_radiator: { width: 80, height: 60 },
  };

  // Special case for baseboards - size based on length
  if (component.type === 'baseboard') {
    const props = component.props as { lengthFt?: number };
    const length = props?.lengthFt ?? 4;
    return { width: Math.min(200, Math.max(60, length * 15)), height: 60 };
  }

  return dims[component.type] || { width: 60, height: 60 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Assignment Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a map of component ID → zone ID based on connection analysis
 * Components in mechanical room (boiler, pump, air separator, expansion tank)
 * are assigned to a special 'mechanical' zone
 */
export function buildComponentZoneMap(
  components: Record<string, HydronicComponent>,
  connections: Connection[],
  zones: Zone[]
): Map<string, string> {
  const componentZoneMap = new Map<string, string>();

  // Mechanical room component types
  const mechanicalTypes = new Set([
    'boiler_gas',
    'boiler_oil',
    'boiler_electric',
    'heat_pump_a2w',
    'pump_fixed',
    'pump_variable',
    'air_separator',
    'expansion_tank',
    'buffer_tank',
    'hydraulic_separator',
    'pressure_relief',
    'fill_valve',
    'air_vent',
  ]);

  // First pass: assign by component type
  for (const [id, comp] of Object.entries(components)) {
    if (mechanicalTypes.has(comp.type)) {
      componentZoneMap.set(id, 'mechanical');
    }
  }

  // Build adjacency from connections
  const adjacency = new Map<string, Set<string>>();
  for (const conn of connections) {
    if (!adjacency.has(conn.fromComponentId)) {
      adjacency.set(conn.fromComponentId, new Set());
    }
    if (!adjacency.has(conn.toComponentId)) {
      adjacency.set(conn.toComponentId, new Set());
    }
    adjacency.get(conn.fromComponentId)!.add(conn.toComponentId);
    adjacency.get(conn.toComponentId)!.add(conn.fromComponentId);
  }

  // Emitter types that belong to heating zones
  const emitterTypes = new Set([
    'baseboard',
    'panel_radiator',
    'cast_iron_radiator',
    'radiant_floor',
    'fan_coil',
    'towel_warmer',
  ]);

  // Second pass: assign emitters and zone valves to zones
  // This is a heuristic - in practice, would use component.name or explicit zone assignment
  for (const [id, comp] of Object.entries(components)) {
    if (componentZoneMap.has(id)) continue;

    // Check if component name contains zone indicator
    const name = comp.name.toLowerCase();
    for (const zone of zones) {
      const zoneName = zone.name.toLowerCase();
      // Match by floor number or zone name keywords
      if (
        name.includes(zone.id) ||
        (zoneName.includes('floor 1') && (name.includes('1f') || name.includes('garage'))) ||
        (zoneName.includes('floor 2') && (name.includes('2f') || name.includes('floor 2'))) ||
        (zoneName.includes('floor 3') && (name.includes('3f') || name.includes('floor 3'))) ||
        (zoneName.includes('garage') && name.includes('garage')) ||
        name.includes(zone.name.split(' ')[0].toLowerCase())
      ) {
        componentZoneMap.set(id, zone.id);
        break;
      }
    }

    // Zone valves - determine zone by what they connect to
    if (comp.type === 'zone_valve_2way' || comp.type === 'zone_valve_3way') {
      const neighbors = adjacency.get(id) || new Set();
      for (const neighborId of neighbors) {
        const neighborZone = componentZoneMap.get(neighborId);
        if (neighborZone && neighborZone !== 'mechanical') {
          componentZoneMap.set(id, neighborZone);
          break;
        }
      }
    }

    // Fallback: assign emitters to first available zone if not matched
    if (!componentZoneMap.has(id) && emitterTypes.has(comp.type)) {
      if (zones.length > 0) {
        componentZoneMap.set(id, zones[0].id);
      }
    }
  }

  // Third pass: assign remaining unassigned components
  for (const [id] of Object.entries(components)) {
    if (!componentZoneMap.has(id)) {
      // Try to inherit zone from neighbors
      const neighbors = adjacency.get(id) || new Set();
      for (const neighborId of neighbors) {
        const neighborZone = componentZoneMap.get(neighborId);
        if (neighborZone) {
          componentZoneMap.set(id, neighborZone);
          break;
        }
      }
    }
    // Final fallback: mechanical zone
    if (!componentZoneMap.has(id)) {
      componentZoneMap.set(id, 'mechanical');
    }
  }

  return componentZoneMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Layout Algorithm
// ─────────────────────────────────────────────────────────────────────────────

export interface LayoutResult {
  /** New positions for components */
  componentPositions: Map<string, Position>;
  /** Calculated zone bounding boxes */
  zoneBounds: ZoneBounds[];
}

/**
 * Run dagre-based hierarchical layout on the system
 */
export function autoLayoutSystem(
  components: Record<string, HydronicComponent>,
  _pipes: Record<string, Pipe>,
  connections: Connection[],
  zones: Zone[],
  options: Partial<LayoutOptions> = {}
): LayoutResult {
  const opts: LayoutOptions = { ...DEFAULT_OPTIONS, ...options };
  const lockedIds = opts.lockedComponentIds || new Set();

  // Create dagre graph
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSep,
    ranksep: opts.rankSep,
    edgesep: opts.edgeSep,
    marginx: 60,
    marginy: 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Build component→zone map
  const componentZoneMap = buildComponentZoneMap(components, connections, zones);

  // Create zone groups (compound nodes)
  const zoneGroups = new Set<string>();
  for (const zoneId of componentZoneMap.values()) {
    zoneGroups.add(zoneId);
  }

  // Add zone group nodes
  for (const zoneId of zoneGroups) {
    g.setNode(zoneId, { label: zoneId, clusterLabelPos: 'top' });
  }

  // Add component nodes
  for (const [id, comp] of Object.entries(components)) {
    const dims = getComponentDimensions(comp);
    g.setNode(id, {
      width: dims.width,
      height: dims.height,
      label: comp.name,
    });

    // Set parent (zone group) for compound layout
    const zoneId = componentZoneMap.get(id);
    if (zoneId) {
      g.setParent(id, zoneId);
    }
  }

  // Add edges from connections
  for (const conn of connections) {
    if (
      components[conn.fromComponentId] &&
      components[conn.toComponentId]
    ) {
      g.setEdge(conn.fromComponentId, conn.toComponentId, {
        minlen: 1,
        weight: 1,
      });
    }
  }

  // Run dagre layout
  dagre.layout(g);

  // Extract positions
  const componentPositions = new Map<string, Position>();
  for (const [id, comp] of Object.entries(components)) {
    // Skip locked components
    if (lockedIds.has(id)) {
      componentPositions.set(id, comp.position);
      continue;
    }

    const node = g.node(id);
    if (node) {
      // dagre returns center coordinates, convert to top-left
      const dims = getComponentDimensions(comp);
      const x = Math.round((node.x - dims.width / 2) / opts.gridSize) * opts.gridSize;
      const y = Math.round((node.y - dims.height / 2) / opts.gridSize) * opts.gridSize;
      componentPositions.set(id, { x, y });
    } else {
      componentPositions.set(id, comp.position);
    }
  }

  // Calculate zone bounding boxes
  const zoneBounds = calculateZoneBounds(
    components,
    componentPositions,
    componentZoneMap,
    zones,
    opts.zonePadding
  );

  return { componentPositions, zoneBounds };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Bounding Box Calculation
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_COLORS = [
  'rgba(66, 133, 244, 0.15)', // Blue
  'rgba(52, 168, 83, 0.15)', // Green
  'rgba(251, 188, 4, 0.15)', // Yellow
  'rgba(234, 67, 53, 0.15)', // Red
  'rgba(154, 66, 244, 0.15)', // Purple
  'rgba(244, 66, 179, 0.15)', // Pink
];

export function calculateZoneBounds(
  components: Record<string, HydronicComponent>,
  positions: Map<string, Position>,
  componentZoneMap: Map<string, string>,
  zones: Zone[],
  padding: number = 40
): ZoneBounds[] {
  // Group components by zone
  const zoneComponents = new Map<string, string[]>();
  for (const [compId, zoneId] of componentZoneMap) {
    if (!zoneComponents.has(zoneId)) {
      zoneComponents.set(zoneId, []);
    }
    zoneComponents.get(zoneId)!.push(compId);
  }

  const bounds: ZoneBounds[] = [];
  let colorIndex = 0;

  // Create bounds for each zone
  for (const zone of zones) {
    const compIds = zoneComponents.get(zone.id) || [];
    if (compIds.length === 0) continue;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const compId of compIds) {
      const pos = positions.get(compId);
      const comp = components[compId];
      if (!pos || !comp) continue;

      const dims = getComponentDimensions(comp);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + dims.width);
      maxY = Math.max(maxY, pos.y + dims.height);
    }

    if (minX !== Infinity) {
      bounds.push({
        zoneId: zone.id,
        zoneName: zone.name,
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
        color: ZONE_COLORS[colorIndex % ZONE_COLORS.length],
      });
      colorIndex++;
    }
  }

  // Add mechanical room bounds
  const mechCompIds = zoneComponents.get('mechanical') || [];
  if (mechCompIds.length > 0) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const compId of mechCompIds) {
      const pos = positions.get(compId);
      const comp = components[compId];
      if (!pos || !comp) continue;

      const dims = getComponentDimensions(comp);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + dims.width);
      maxY = Math.max(maxY, pos.y + dims.height);
    }

    if (minX !== Infinity) {
      bounds.push({
        zoneId: 'mechanical',
        zoneName: 'Mechanical Room',
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
        color: 'rgba(100, 100, 100, 0.12)',
      });
    }
  }

  return bounds;
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Orthogonal Pipe Routing
// ─────────────────────────────────────────────────────────────────────────────

interface PortOffset {
  x: number;
  y: number;
}

function getPortOffset(component: HydronicComponent, portId: string): PortOffset {
  const portOffsets: Record<string, Record<string, PortOffset>> = {
    boiler_gas: { supply: { x: 15, y: 0 }, return: { x: 65, y: 0 } },
    boiler_oil: { supply: { x: 15, y: 0 }, return: { x: 65, y: 0 } },
    boiler_electric: { supply: { x: 15, y: 0 }, return: { x: 65, y: 0 } },
    pump_fixed: { inlet: { x: 0, y: 30 }, outlet: { x: 60, y: 30 } },
    pump_variable: { inlet: { x: 0, y: 30 }, outlet: { x: 60, y: 30 } },
    zone_pump: { inlet: { x: 0, y: 30 }, outlet: { x: 60, y: 30 } },
    air_separator: { left: { x: 0, y: 30 }, right: { x: 60, y: 30 } },
    expansion_tank: { connection: { x: 30, y: 60 } },
    zone_valve_2way: { inlet: { x: 0, y: 30 }, outlet: { x: 60, y: 30 } },
    zone_valve_3way: { inlet: { x: 0, y: 30 }, outlet: { x: 60, y: 30 } },
    radiant_floor: { supply: { x: 10, y: 0 }, return: { x: 70, y: 60 } },
  };

  // Baseboard with dynamic width
  if (component.type === 'baseboard') {
    const props = component.props as { lengthFt?: number };
    const width = Math.min(200, Math.max(60, (props?.lengthFt ?? 4) * 15));
    if (portId === 'supply') return { x: 0, y: 30 };
    if (portId === 'return') return { x: width, y: 30 };
  }

  const typeOffsets = portOffsets[component.type];
  if (typeOffsets && typeOffsets[portId]) {
    return typeOffsets[portId];
  }

  // Fallback
  if (portId === 'supply' || portId === 'left' || portId === 'inlet') {
    return { x: 0, y: 30 };
  }
  return { x: 60, y: 30 };
}

function getAbsolutePortPosition(
  component: HydronicComponent,
  portId: string,
  position?: Position
): Position {
  const offset = getPortOffset(component, portId);
  const pos = position || component.position;
  let { x: cx, y: cy } = offset;

  // Apply transforms
  if (component.flippedH) cx = -cx;
  if (component.flippedV) cy = -cy;

  const rad = (component.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = cx * cos - cy * sin;
  const ry = cx * sin + cy * cos;

  return {
    x: pos.x + rx,
    y: pos.y + ry,
  };
}

/**
 * Generate smart orthogonal path between two ports
 * Uses header-style routing for cleaner layouts
 */
export function generateSmartOrthogonalPath(
  from: Position,
  to: Position,
  pipeType: 'supply' | 'return',
  gridSize: number = 20
): Position[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Snap to grid helper
  const snap = (v: number) => Math.round(v / gridSize) * gridSize;

  // For supply pipes, prefer horizontal-first routing (left-to-right flow)
  // For return pipes, use return header pattern (drop down, horizontal, up)
  if (pipeType === 'supply') {
    // Simple L or Z routing for supply
    if (Math.abs(dx) >= Math.abs(dy)) {
      const midX = snap(from.x + dx / 2);
      return [
        { x: from.x, y: from.y },
        { x: midX, y: from.y },
        { x: midX, y: to.y },
        { x: to.x, y: to.y },
      ];
    } else {
      const midY = snap(from.y + dy / 2);
      return [
        { x: from.x, y: from.y },
        { x: from.x, y: midY },
        { x: to.x, y: midY },
        { x: to.x, y: to.y },
      ];
    }
  } else {
    // Return pipe: route via return header (below components)
    const headerY = snap(Math.max(from.y, to.y) + 60);
    return [
      { x: from.x, y: from.y },
      { x: from.x, y: headerY },
      { x: to.x, y: headerY },
      { x: to.x, y: to.y },
    ];
  }
}

/**
 * Recalculate all pipe waypoints after layout
 */
export function recalculatePipeWaypoints(
  components: Record<string, HydronicComponent>,
  pipes: Record<string, Pipe>,
  connections: Connection[],
  newPositions: Map<string, Position>,
  gridSize: number = 20
): Map<string, Position[]> {
  const newWaypoints = new Map<string, Position[]>();

  for (const conn of connections) {
    const pipe = pipes[conn.pipeId];
    if (!pipe) continue;

    const fromComp = components[conn.fromComponentId];
    const toComp = components[conn.toComponentId];
    if (!fromComp || !toComp) continue;

    const fromPos = newPositions.get(conn.fromComponentId) || fromComp.position;
    const toPos = newPositions.get(conn.toComponentId) || toComp.position;

    const fromPort = getAbsolutePortPosition(fromComp, conn.fromPortId, fromPos);
    const toPort = getAbsolutePortPosition(toComp, conn.toPortId, toPos);

    const waypoints = generateSmartOrthogonalPath(
      fromPort,
      toPort,
      pipe.pipeType,
      gridSize
    );

    newWaypoints.set(pipe.id, waypoints);
  }

  return newWaypoints;
}
