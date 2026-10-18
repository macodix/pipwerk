import { Handle, Position, type NodeProps } from '@xyflow/react';
import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import type { FrameFlowNode } from './flowModel';

/** What the nodes of the drawing area can ask of it. */
export type CanvasActions = {
  toggleCollapse: (ownerId: string) => void;
};

export const CanvasActionsContext = createContext<CanvasActions>({ toggleCollapse: () => undefined });

/**
 * The frame of a management (specification 5.3). It can be collapsed; the
 * elements inside it are then hidden and stay in the document. Only the header
 * takes the mouse, so the rest of the frame lets clicks through to the drawing area.
 */
export function ManagementNode({ data }: NodeProps<FrameFlowNode>) {
  const { t } = useTranslation();
  const { toggleCollapse } = useContext(CanvasActionsContext);
  const label = t('canvas.management', { title: data.title });
  return (
    <div className={`management-frame${data.collapsed ? ' is-collapsed' : ''}`} data-owner={data.ownerId}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="management-header">
        <button
          type="button"
          className="management-toggle nodrag"
          aria-expanded={!data.collapsed}
          aria-label={data.collapsed ? t('canvas.expand', { title: data.title }) : t('canvas.collapse', { title: data.title })}
          onClick={() => {
            toggleCollapse(data.ownerId);
          }}
        >
          <span aria-hidden="true">{data.collapsed ? '▸' : '▾'}</span>
        </button>
        <span className="management-title" title={label}>
          {label}
        </span>
      </div>
    </div>
  );
}
