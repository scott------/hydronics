// ─────────────────────────────────────────────────────────────────────────────
// Canvas Component Tests
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Canvas } from './Canvas';
import { useStore } from '../../store';

describe('Canvas', () => {
  beforeEach(() => {
    useStore.getState().clearState();
  });

  describe('rendering', () => {
    it('renders SVG element', () => {
      render(<Canvas />);
      const svg = document.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('renders grid when showGrid is true', () => {
      useStore.setState({ ui: { ...useStore.getState().ui, showGrid: true } });
      render(<Canvas />);
      
      const pattern = document.querySelector('pattern#grid');
      expect(pattern).not.toBeNull();
    });

    it('does not render grid when showGrid is false', () => {
      useStore.setState({ ui: { ...useStore.getState().ui, showGrid: false } });
      render(<Canvas />);
      
      const pattern = document.querySelector('pattern#grid');
      expect(pattern).toBeNull();
    });

    it('renders components from store', () => {
      useStore.getState().addComponent({
        type: 'boiler_gas',
        name: 'Boiler 1',
        position: { x: 100, y: 100 },
        rotation: 0,
        flippedH: false,
        flippedV: false,
        ports: [],
        props: {},
      } as any);
      
      render(<Canvas />);
      
      // Should have component group
      const component = document.querySelector('g.component');
      expect(component).not.toBeNull();
    });

    it('renders pipes from store', () => {
      useStore.getState().addPipe({
        material: 'copper',
        size: '3/4',
        lengthFt: 10,
        pipeType: 'supply',
        insulation: 'none',
        fittings: { elbows90: 0, elbows45: 0, teesThrough: 0, teesBranch: 0, couplings: 0 },
        waypoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
        startPortId: null,
        endPortId: null,
      });
      
      render(<Canvas />);
      
      // Should have pipe path
      const pipePath = document.querySelector('g.pipe path');
      expect(pipePath).not.toBeNull();
    });
  });

  describe('pending connection preview', () => {
    it('renders preview line when connection is pending', () => {
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 100, y: 100 });
      useStore.getState().updatePipeConnectionMouse({ x: 200, y: 150 });
      
      render(<Canvas />);
      
      // Should have pending connection preview
      const preview = document.querySelector('g.pending-connection path');
      expect(preview).not.toBeNull();
      expect(preview?.getAttribute('stroke')).toBe('#ff9800');
    });

    it('does not render preview when no pending connection', () => {
      render(<Canvas />);
      
      const preview = document.querySelector('g.pending-connection');
      expect(preview).toBeNull();
    });

    it('renders end cursor indicator', () => {
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 100, y: 100 });
      useStore.getState().updatePipeConnectionMouse({ x: 200, y: 150 });
      
      render(<Canvas />);
      
      // Should have cursor circle at mouse position
      const cursor = document.querySelector('g.pending-connection circle');
      expect(cursor).not.toBeNull();
      expect(cursor?.getAttribute('cx')).toBe('200');
      expect(cursor?.getAttribute('cy')).toBe('150');
    });
  });

  describe('zoom', () => {
    it('applies zoom transform', () => {
      useStore.getState().setZoom(1.5);
      render(<Canvas />);
      
      const svg = document.querySelector('svg');
      expect(svg?.style.transform).toContain('scale(1.5)');
    });
  });

  describe('pan', () => {
    it('applies pan offset transform', () => {
      useStore.getState().setPan({ x: 50, y: -30 });
      render(<Canvas />);
      
      const svg = document.querySelector('svg');
      expect(svg?.style.transform).toContain('translate(50px, -30px)');
    });
  });

  describe('selection', () => {
    it('clears selection when clicking on canvas background', () => {
      useStore.getState().setSelection(['item1', 'item2']);
      expect(useStore.getState().ui.selectedIds.length).toBe(2);
      
      render(<Canvas />);
      
      // Click on SVG background
      const svg = document.querySelector('svg');
      fireEvent.click(svg!);
      
      expect(useStore.getState().ui.selectedIds.length).toBe(0);
    });

    it('cancels pending connection when clicking background', () => {
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 100, y: 100 });
      expect(useStore.getState().ui.pendingConnection).not.toBeNull();
      
      render(<Canvas />);
      
      const svg = document.querySelector('svg');
      fireEvent.click(svg!);
      
      expect(useStore.getState().ui.pendingConnection).toBeNull();
    });
  });

  describe('keyboard shortcuts', () => {
    it('Escape cancels pending connection', () => {
      useStore.getState().startPipeConnection('comp1', 'supply', { x: 100, y: 100 });
      expect(useStore.getState().ui.pendingConnection).not.toBeNull();
      
      render(<Canvas />);
      
      fireEvent.keyDown(window, { key: 'Escape' });
      
      expect(useStore.getState().ui.pendingConnection).toBeNull();
    });

    it('Escape clears selection when no pending connection', () => {
      useStore.getState().setSelection(['item1']);
      
      render(<Canvas />);
      
      fireEvent.keyDown(window, { key: 'Escape' });
      
      expect(useStore.getState().ui.selectedIds.length).toBe(0);
    });

    it('Delete removes selected components', () => {
      const id = useStore.getState().addComponent({
        type: 'boiler_gas',
        name: 'Test',
        position: { x: 100, y: 100 },
        rotation: 0,
        flippedH: false,
        flippedV: false,
        ports: [],
        props: {},
      } as any);
      
      useStore.getState().setSelection([id]);
      
      render(<Canvas />);
      
      fireEvent.keyDown(window, { key: 'Delete' });
      
      expect(useStore.getState().components[id]).toBeUndefined();
    });
  });

  describe('component ordering', () => {
    it('renders components sorted by zIndex', () => {
      const id1 = useStore.getState().addComponent({
        type: 'boiler_gas',
        name: 'Boiler 1',
        position: { x: 100, y: 100 },
        rotation: 0,
        flippedH: false,
        flippedV: false,
        ports: [],
        props: {},
      } as any);
      
      const id2 = useStore.getState().addComponent({
        type: 'pump_fixed',
        name: 'Pump 1',
        position: { x: 200, y: 100 },
        rotation: 0,
        flippedH: false,
        flippedV: false,
        ports: [],
        props: {},
      } as any);
      
      // Second component should have higher zIndex and render last
      expect(useStore.getState().components[id2].zIndex).toBeGreaterThan(
        useStore.getState().components[id1].zIndex
      );
      
      render(<Canvas />);
      
      const components = document.querySelectorAll('g.component');
      expect(components.length).toBe(2);
    });
  });
});
