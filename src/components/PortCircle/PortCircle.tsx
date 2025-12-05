// ─────────────────────────────────────────────────────────────────────────────
// PortCircle – Interactive connector port for pipe connections
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback } from 'react';
import { useStore } from '../../store';
import type { PortType, Position } from '../../types';

interface Props {
  componentId: string;
  portId: string;
  type: PortType;
  cx: number;
  cy: number;
  /** Absolute position in canvas coordinates (including component transform) */
  absolutePosition: Position;
}

const PORT_COLORS: Record<PortType, { fill: string; stroke: string }> = {
  supply: { fill: '#ef5350', stroke: '#b71c1c' },
  return: { fill: '#42a5f5', stroke: '#1565c0' },
  general: { fill: '#bdbdbd', stroke: '#757575' },
};

export const PortCircle: React.FC<Props> = ({
  componentId,
  portId,
  type,
  cx,
  cy,
  absolutePosition,
}) => {
  const pendingConnection = useStore((s) => s.ui.pendingConnection);
  const startPipeConnection = useStore((s) => s.startPipeConnection);
  const completePipeConnection = useStore((s) => s.completePipeConnection);
  const cancelPipeConnection = useStore((s) => s.cancelPipeConnection);
  const connections = useStore((s) => s.connections);

  // Check if this port is already connected
  const isConnected = connections.some(
    (c) =>
      (c.fromComponentId === componentId && c.fromPortId === portId) ||
      (c.toComponentId === componentId && c.toPortId === portId)
  );

  // Check if this port is the start of the pending connection
  const isStartPort =
    pendingConnection?.fromComponentId === componentId &&
    pendingConnection?.fromPortId === portId;

  // Determine if this port can be a valid target
  const canConnect =
    pendingConnection &&
    !isStartPort &&
    !isConnected &&
    pendingConnection.fromComponentId !== componentId;

  const colors = PORT_COLORS[type];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (isConnected) return; // Already connected

      if (pendingConnection) {
        // Complete the connection if clicking on a different component's port
        if (canConnect) {
          completePipeConnection(componentId, portId, absolutePosition);
        } else {
          // Clicked on same component or invalid target, cancel
          cancelPipeConnection();
        }
      } else {
        // Start a new connection
        startPipeConnection(componentId, portId, absolutePosition);
      }
    },
    [
      componentId,
      portId,
      absolutePosition,
      pendingConnection,
      isConnected,
      canConnect,
      startPipeConnection,
      completePipeConnection,
      cancelPipeConnection,
    ]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Handle drag-and-drop completion
      if (pendingConnection && canConnect) {
        completePipeConnection(componentId, portId, absolutePosition);
      }
    },
    [componentId, portId, absolutePosition, pendingConnection, canConnect, completePipeConnection]
  );

  return (
    <g className="port-circle">
      {/* Larger invisible hit area for easier clicking */}
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill="transparent"
        style={{ cursor: isConnected ? 'not-allowed' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      {/* Visible port */}
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={isConnected ? '#9e9e9e' : colors.fill}
        stroke={isConnected ? '#616161' : colors.stroke}
        strokeWidth={1}
        pointerEvents="none"
      />
      {/* Highlight ring when can connect */}
      {canConnect && (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="none"
          stroke="#4caf50"
          strokeWidth={2}
          opacity={0.8}
          pointerEvents="none"
        />
      )}
      {/* Starting port indicator */}
      {isStartPort && (
        <circle
          cx={cx}
          cy={cy}
          r={10}
          fill="none"
          stroke="#ff9800"
          strokeWidth={2}
          strokeDasharray="3 2"
          pointerEvents="none"
        >
          <animate
            attributeName="r"
            values="8;12;8"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
};
