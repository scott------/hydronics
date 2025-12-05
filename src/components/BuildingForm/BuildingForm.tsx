// ─────────────────────────────────────────────────────────────────────────────
// BuildingForm – collapsible sections for climate, envelope, windows, infiltration
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useStore } from '../../store';
import type { BuildingConfig, FoundationType, ConstructionEra } from '../../types';
import styles from './BuildingForm.module.css';

export const BuildingForm: React.FC = () => {
  const building = useStore((s) => s.building);
  const setBuilding = useStore((s) => s.setBuilding);

  const update = <K extends keyof BuildingConfig>(key: K, value: BuildingConfig[K]) => {
    setBuilding({ [key]: value });
  };

  const updateClimate = (field: string, value: number) => {
    setBuilding({ climate: { ...building.climate, [field]: value } });
  };
  const updateInsulation = (field: string, value: number) => {
    setBuilding({ insulation: { ...building.insulation, [field]: value } });
  };
  const updateWindowDoor = (field: string, value: number) => {
    setBuilding({ windowDoor: { ...building.windowDoor, [field]: value } });
  };
  const updateInfiltration = (field: string, value: number | null) => {
    setBuilding({ infiltration: { ...building.infiltration, [field]: value } });
  };

  return (
    <div className={styles.form}>
      {/* Climate */}
      <details open>
        <summary>Location &amp; Climate</summary>
        <label>
          Design Outdoor Temp (°F)
          <input
            type="number"
            value={building.climate.designOutdoorTemp}
            onChange={(e) => updateClimate('designOutdoorTemp', +e.target.value)}
          />
        </label>
        <label>
          Indoor Design Temp (°F)
          <input
            type="number"
            value={building.climate.indoorDesignTemp}
            onChange={(e) => updateClimate('indoorDesignTemp', +e.target.value)}
          />
        </label>
        <label>
          Heating Degree Days
          <input
            type="number"
            value={building.climate.heatingDegreeDays}
            onChange={(e) => updateClimate('heatingDegreeDays', +e.target.value)}
          />
        </label>
        <label>
          Climate Zone (1-8)
          <input
            type="number"
            min={1}
            max={8}
            value={building.climate.climateZone}
            onChange={(e) => updateClimate('climateZone', +e.target.value)}
          />
        </label>
      </details>

      {/* Building Envelope */}
      <details open>
        <summary>Building Envelope</summary>
        <label>
          Total Heated Sq Ft
          <input
            type="number"
            value={building.totalSqFt}
            onChange={(e) => update('totalSqFt', +e.target.value)}
          />
        </label>
        <label>
          Floors
          <input
            type="number"
            min={1}
            value={building.floors}
            onChange={(e) => update('floors', +e.target.value)}
          />
        </label>
        <label>
          Ceiling Height (ft)
          <input
            type="number"
            step={0.5}
            value={building.ceilingHeight}
            onChange={(e) => update('ceilingHeight', +e.target.value)}
          />
        </label>
        <label>
          Foundation
          <select
            value={building.foundationType}
            onChange={(e) => update('foundationType', e.target.value as FoundationType)}
          >
            <option value="slab">Slab</option>
            <option value="crawlspace">Crawlspace</option>
            <option value="basement">Basement</option>
          </select>
        </label>
        <label>
          Construction Era
          <select
            value={building.constructionEra}
            onChange={(e) => update('constructionEra', e.target.value as ConstructionEra)}
          >
            <option value="pre-1950">Pre-1950</option>
            <option value="1950-1980">1950-1980</option>
            <option value="1980-2000">1980-2000</option>
            <option value="2000+">2000+</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </details>

      {/* Insulation */}
      <details>
        <summary>Insulation (R-values)</summary>
        <label>
          Walls
          <input
            type="number"
            value={building.insulation.walls}
            onChange={(e) => updateInsulation('walls', +e.target.value)}
          />
        </label>
        <label>
          Ceiling/Attic
          <input
            type="number"
            value={building.insulation.ceiling}
            onChange={(e) => updateInsulation('ceiling', +e.target.value)}
          />
        </label>
        <label>
          Floor/Foundation
          <input
            type="number"
            value={building.insulation.floor}
            onChange={(e) => updateInsulation('floor', +e.target.value)}
          />
        </label>
        <label>
          Basement Walls
          <input
            type="number"
            value={building.insulation.basementWalls}
            onChange={(e) => updateInsulation('basementWalls', +e.target.value)}
          />
        </label>
      </details>

      {/* Windows & Doors */}
      <details>
        <summary>Windows &amp; Doors</summary>
        <label>
          Total Window Area (sq ft)
          <input
            type="number"
            value={building.windowDoor.totalWindowArea}
            onChange={(e) => updateWindowDoor('totalWindowArea', +e.target.value)}
          />
        </label>
        <label>
          Window U-value
          <input
            type="number"
            step={0.01}
            value={building.windowDoor.windowUValue}
            onChange={(e) => updateWindowDoor('windowUValue', +e.target.value)}
          />
        </label>
        <label>
          Exterior Doors
          <input
            type="number"
            value={building.windowDoor.exteriorDoorCount}
            onChange={(e) => updateWindowDoor('exteriorDoorCount', +e.target.value)}
          />
        </label>
        <label>
          Door U-value
          <input
            type="number"
            step={0.01}
            value={building.windowDoor.doorUValue}
            onChange={(e) => updateWindowDoor('doorUValue', +e.target.value)}
          />
        </label>
        <label>
          Door Area (sq ft each)
          <input
            type="number"
            value={building.windowDoor.doorArea}
            onChange={(e) => updateWindowDoor('doorArea', +e.target.value)}
          />
        </label>
      </details>

      {/* Infiltration */}
      <details>
        <summary>Infiltration</summary>
        <label>
          ACH (air changes/hr)
          <input
            type="number"
            step={0.05}
            value={building.infiltration.ach}
            onChange={(e) => updateInfiltration('ach', +e.target.value)}
          />
        </label>
        <label>
          Blower Door CFM50
          <input
            type="number"
            value={building.infiltration.blowerDoorCFM50 ?? ''}
            placeholder="optional"
            onChange={(e) =>
              updateInfiltration('blowerDoorCFM50', e.target.value ? +e.target.value : null)
            }
          />
        </label>
      </details>
    </div>
  );
};
