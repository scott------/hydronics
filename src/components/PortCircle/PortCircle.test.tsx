// ─────────────────────────────────────────────────────────────────────────────
// PortCircle Component Tests
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PortCircle } from './PortCircle';
import { useStore } from '../../store';

// Helper to render inside an SVG context
function renderInSvg(component: React.ReactElement) {
  return render(<svg>{component}</svg>);
}

describe('PortCircle', () => {
  beforeEach(() => {
    useStore.getState().clearState();
  });

  describe('rendering', () => {
    it('renders port circle element', () => {
      renderInSvg(
        <PortCircle
          componentId="comp1"
          portId="supply"
          type="supply"
          cx={15}
          cy={0}
          absolutePosition={{ x: 115, y: 100 }}
        />
      );
      
      // Should render circles (hit area + visible port)
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });

    it('renders supply port with red color', () => {
      renderInSvg(
        <PortCircle
          componentId="comp1"
          portId="supply"
          type="supply"
          cx={15}
          cy={0}
          absolutePosition={{ x: 115, y: 100 }}
        />
      );
      
      // The visible port circle (smaller radius, not transparent)
      const circles = document.querySelectorAll('circle');
      const visibleCircle = Array.from(circles).find(c => c.getAttribute('r') === '5');
      expect(visibleCircle?.getAttribute('fill')).toBe('#ef5350');
    });

    it('renders return port with blue color', () => {
      renderInSvg(
        <PortCircle
          componentId="comp1"
          portId="return"
          type="return"
          cx={65}
          cy={0}
          absolutePosition={{ x: 165, y: 100 }}
        />
      );
      
      const circles = document.querySelectorAll('circle');
      const visibleCircle = Array.from(circles).find(c => c.getAttribute('r') === '5');
      expect(visibleCircle?.getAttribute('fill')).toBe('#42a5f5');
    });

    it('renders general port with gray color', () => {
      renderInSvg(
        <PortCircle
          componentId="comp1"
          portId="connection"
          type="general"
          cx={30}
          cy={60}
          absolutePosition={{ x: 130, y: 160 }}
        />
      );
      
      const circles = document.querySelectorAll('circle');
      const visibleCircle = Array.from(circles).find(c => c.getAttribute('r') === '5');
      expect(visibleCircle?.getAttribute('fill')).toBe('#bdbdbd');
    });
  });

  describe('interaction - starting connection', () => {
    it('starts pipe connection on mousedown', () => {
      renderInSvg(
        <PortCircle
          componentId="comp1"
          portId="supply"
          type="supply"
          cx={15}
          cy={0}
          absolutePosition={{ x: 115, y: 100 }}
        />
      );
      
      // Find the hit area circle (larger radius, transparent fill)
      const hitArea = document.querySelector('circle[r="12"]');
      expect(hitArea).not.toBeNull();
      
      fireEvent.mouseDown(hitArea!);
      
      const pending = useStore.getState().ui.pendingConnection;
      expect(pending).not.toBeNull();
      expect(pending?.fromComponentId).toBe('comp1');
      expect(pending?.fromPortId).toBe('supply');
    });
  });

  describe('interaction - completing connection', () => {
    it('completes connection when clicking target port', () => {
      // Add two components
      const id1 = useStore.getState().addComponent({
        type: 'boiler_gas',
        name: 'Boiler',
        position: { x: 100, y: 100 },
        rotation: 0,
        flippedH: false,
        flippedV: false,
        ports: [{ id: 'supply', type: 'supply', x: 15, y: 0 }],
        props: {},
      } as any);
      
      const id2 = useStore.getState().addComponent({
        type: 'baseboard',
        name: 'Radiator',
        position: { x: 300, y: 100 },
        rotation: 0,
        flippedH: false,
        flippedV: false,
        ports: [{ id: 'return', type: 'return', x: 0, y: 30 }],
        props: {},
      } as any);
      
      // Start connection from first component
      useStore.getState().startPipeConnection(id1, 'supply', { x: 115, y: 100 });
      
      // Render target port
      renderInSvg(
        <PortCircle
          componentId={id2}
          portId="return"
          type="return"
          cx={0}
          cy={30}
          absolutePosition={{ x: 300, y: 130 }}
        />
      );
      
      // Click on target port
      const hitArea = document.querySelector('circle[r="12"]');
      fireEvent.mouseDown(hitArea!);
      
      // Should have created a connection
      expect(useStore.getState().connections.length).toBe(1);
      expect(Object.keys(useStore.getState().pipes).length).toBe(1);
    });

    it('shows highlight when can connect', () => {
      // Set up pending connection from a different component
      useStore.getState().startPipeConnection('other-comp', 'supply', { x: 50, y: 50 });
      
      renderInSvg(
        <PortCircle
          componentId="comp1"
          portId="return"
          type="return"
          cx={65}
          cy={0}
          absolutePosition={{ x: 165, y: 100 }}
        />
      );
      
      // Should show highlight ring (green stroke)
      const highlightCircle = document.querySelector('circle[stroke="#4caf50"]');
      expect(highlightCircle).not.toBeNull();
    });
  });

  describe('connected port state', () => {
    it('shows grayed out when already connected', () => {
      // Create a connection involving this port
      useStore.setState((state) => ({
        connections: [
          ...state.connections,
          {
            id: 'conn1',
            pipeId: 'pipe1',
            fromComponentId: 'comp1',
            fromPortId: 'supply',
            toComponentId: 'comp2',
            toPortId: 'return',
          },
        ],
      }));
      
      renderInSvg(
        <PortCircle
          componentId="comp1"
          portId="supply"
          type="supply"
          cx={15}
          cy={0}
          absolutePosition={{ x: 115, y: 100 }}
        />
      );
      
      const circles = document.querySelectorAll('circle');
      const visibleCircle = Array.from(circles).find(c => c.getAttribute('r') === '5');
      // Should be grayed out
      expect(visibleCircle?.getAttribute('fill')).toBe('#9e9e9e');
    });
  });

  describe('start port indicator', () => {
    it('shows animated ring on starting port', () => {
      // Start a connection from this port
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 115, y: 100 });
      
      renderInSvg(
        <PortCircle
          componentId="comp1"
          portId="supply"
          type="supply"
          cx={15}
          cy={0}
          absolutePosition={{ x: 115, y: 100 }}
        />
      );
      
      // Should show animated indicator (orange stroke with animation)
      const animatedCircle = document.querySelector('circle[stroke="#ff9800"]');
      expect(animatedCircle).not.toBeNull();
      
      const animation = animatedCircle?.querySelector('animate');
      expect(animation).not.toBeNull();
    });
  });
});
