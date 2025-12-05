// ─────────────────────────────────────────────────────────────────────────────
// ZoneBounds - SVG visual representation of heating zone bounding boxes
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { ZoneBounds as ZoneBoundsType } from '../../calc/autoLayout';
import styles from './ZoneBounds.module.css';

interface ZoneBoundsProps {
  bounds: ZoneBoundsType[];
}

export const ZoneBounds: React.FC<ZoneBoundsProps> = ({ bounds }) => {
  if (!bounds || bounds.length === 0) return null;

  return (
    <g className={styles.zoneBoundsLayer}>
      {bounds.map((zone) => (
        <g key={zone.zoneId} className={styles.zoneGroup}>
          {/* Background fill */}
          <rect
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            fill={zone.color}
            stroke={zone.color.replace('0.15', '0.4').replace('0.12', '0.35')}
            strokeWidth={2}
            strokeDasharray="8 4"
            rx={8}
            ry={8}
            className={styles.zoneBounds}
          />
          {/* Zone label */}
          <text
            x={zone.x + 12}
            y={zone.y + 20}
            className={styles.zoneLabel}
            fill={zone.color.replace('rgba', 'rgb').replace(', 0.15)', ')').replace(', 0.12)', ')')}
          >
            {zone.zoneName}
          </text>
        </g>
      ))}
    </g>
  );
};
