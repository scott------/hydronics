// ─────────────────────────────────────────────────────────────────────────────
// TemplateSelector - Modal for selecting system templates
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useStore } from '../../store';
import { systemTemplates } from '../../store/templates';
import styles from './TemplateSelector.module.css';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose }) => {
  const loadTemplate = useStore((s) => s.loadTemplate);
  const startSimulation = useStore((s) => s.startSimulation);

  if (!isOpen) return null;

  const handleSelect = (templateId: string) => {
    loadTemplate(templateId);
    if (templateId !== 'empty') {
      startSimulation();
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Choose a Template</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.description}>
          Select a starting configuration for your hydronic system
        </div>
        <div className={styles.templates}>
          {systemTemplates.map((template) => (
            <button
              key={template.id}
              className={styles.templateCard}
              onClick={() => handleSelect(template.id)}
            >
              <div className={styles.icon}>{template.icon}</div>
              <div className={styles.info}>
                <div className={styles.name}>{template.name}</div>
                <div className={styles.desc}>{template.description}</div>
                {template.id !== 'empty' && (
                  <div className={styles.stats}>
                    {template.zones.length} zone{template.zones.length !== 1 ? 's' : ''} ·
                    {Object.keys(template.components).length} components ·
                    {template.building.totalSqFt.toLocaleString()} sq ft
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
