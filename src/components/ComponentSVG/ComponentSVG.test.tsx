// ─────────────────────────────────────────────────────────────────────────────
// ComponentSVG Component Tests
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ComponentSVG } from './ComponentSVG';
import { useStore } from '../../store';
import type { HydronicComponent } from '../../types';

// Helper to render inside an SVG context
function renderInSvg(component: React.ReactElement) {
  return render(<svg>{component}</svg>);
}

// Mock component factory
function createMockComponent(type: string, overrides: Partial<HydronicComponent> = {}): HydronicComponent {
  return {
    id: 'test-component',
    type: type as any,
    name: 'Test Component',
    position: { x: 100, y: 100 },
    rotation: 0,
    flippedH: false,
    flippedV: false,
    ports: [],
    zIndex: 1,
    props: {},
    ...overrides,
  } as HydronicComponent;
}

describe('ComponentSVG', () => {
  beforeEach(() => {
    useStore.getState().resetState();
  });

  describe('rendering shapes', () => {
    it('renders boiler shape for boiler_gas type', () => {
      const component = createMockComponent('boiler_gas', { name: 'My Boiler' });
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      // Boiler should have a rect body with red/pink fill
      const rect = document.querySelector('rect[fill="#e57373"]');
      expect(rect).not.toBeNull();
    });

    it('renders pump shape for pump_fixed type', () => {
      const component = createMockComponent('pump_fixed');
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      // Pump has a circle body
      const circle = document.querySelector('circle[fill="#90caf9"]');
      expect(circle).not.toBeNull();
    });

    it('renders baseboard shape', () => {
      const component = createMockComponent('baseboard', {
        props: { lengthFt: 4 },
      });
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      // Baseboard has brown housing
      const rect = document.querySelector('rect[fill="#bcaaa4"]');
      expect(rect).not.toBeNull();
    });

    it('renders expansion tank shape', () => {
      const component = createMockComponent('expansion_tank');
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      // Expansion tank has ellipse
      const ellipse = document.querySelector('ellipse');
      expect(ellipse).not.toBeNull();
    });

    it('renders zone valve shape', () => {
      const component = createMockComponent('zone_valve_2way');
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      // Zone valve has gray body
      const rect = document.querySelector('rect[fill="#b0bec5"]');
      expect(rect).not.toBeNull();
    });

    it('renders radiant floor shape', () => {
      const component = createMockComponent('radiant_floor');
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      // Radiant floor has green floor area
      const rect = document.querySelector('rect[fill="#e8f5e9"]');
      expect(rect).not.toBeNull();
    });

    it('renders generic shape for unknown types', () => {
      const component = createMockComponent('unknown_type' as any);
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      // Generic has gray rect
      const rect = document.querySelector('rect[fill="#e0e0e0"]');
      expect(rect).not.toBeNull();
    });
  });

  describe('transform', () => {
    it('applies position transform', () => {
      const component = createMockComponent('boiler_gas', {
        position: { x: 200, y: 150 },
      });
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      const g = document.querySelector('g.component');
      expect(g?.getAttribute('transform')).toContain('translate(200, 150)');
    });

    it('applies rotation transform', () => {
      const component = createMockComponent('boiler_gas', {
        rotation: 90,
      });
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      const g = document.querySelector('g.component');
      expect(g?.getAttribute('transform')).toContain('rotate(90)');
    });

    it('applies horizontal flip', () => {
      const component = createMockComponent('boiler_gas', {
        flippedH: true,
      });
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      const g = document.querySelector('g.component');
      expect(g?.getAttribute('transform')).toContain('scale(-1,1)');
    });

    it('applies vertical flip', () => {
      const component = createMockComponent('boiler_gas', {
        flippedV: true,
      });
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      const g = document.querySelector('g.component');
      expect(g?.getAttribute('transform')).toContain('scale(1,-1)');
    });
  });

  describe('selection', () => {
    it('shows selection indicator when selected', () => {
      const component = createMockComponent('boiler_gas');
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={true} onMouseDown={onMouseDown} />
      );
      
      // Selection indicator has dashed blue stroke
      const selectionRect = document.querySelector('rect[stroke="#2196f3"][stroke-dasharray="4 2"]');
      expect(selectionRect).not.toBeNull();
    });

    it('does not show selection indicator when not selected', () => {
      const component = createMockComponent('boiler_gas');
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      const selectionRect = document.querySelector('rect[stroke="#2196f3"][stroke-dasharray="4 2"]');
      expect(selectionRect).toBeNull();
    });
  });

  describe('name label', () => {
    it('displays component name', () => {
      const component = createMockComponent('boiler_gas', { name: 'Main Boiler' });
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      const text = document.querySelector('text');
      expect(text?.textContent).toBe('Main Boiler');
    });
  });

  describe('port circles', () => {
    it('renders port circles for boiler', () => {
      const component = createMockComponent('boiler_gas');
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      // Should have port circles (hit area + visible for each port)
      const portGroups = document.querySelectorAll('.port-circle');
      expect(portGroups.length).toBe(2); // Supply and return ports
    });
  });

  describe('mouse events', () => {
    it('calls onMouseDown when component is clicked', () => {
      const component = createMockComponent('boiler_gas');
      const onMouseDown = vi.fn();
      
      renderInSvg(
        <ComponentSVG component={component} selected={false} onMouseDown={onMouseDown} />
      );
      
      const g = document.querySelector('g.component');
      fireEvent.mouseDown(g!);
      
      expect(onMouseDown).toHaveBeenCalled();
    });
  });
});
