import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from '@xyflow/react';
import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import type { FlowEdgeData, WireEdgeData } from './flowModel';

export type EdgeActions = { deleteConnection: (connectionId: string) => void };

export const EdgeActionsContext = createContext<EdgeActions | null>(null);

/** A line of the flow: continuous with an arrow, green and dotted for a management. A selected line can be deleted. */
export function FlowEdge({ data }: EdgeProps<Edge<FlowEdgeData, 'flow'>>) {
  const { t } = useTranslation();
  const actions = useContext(EdgeActionsContext);
  if (data === undefined) {
    return null;
  }
  return (
    <g
      className={`flow-edge${data.kind === 'management' ? ' mgmt' : ''}${data.selected ? ' on' : ''}`}
      data-testid="flow-edge"
      data-kind={data.kind}
      data-connection={data.connection ?? ''}
    >
      <BaseEdge
        path={data.path}
        className="edge-line"
        markerEnd={data.selected ? 'url(#arrow-sel)' : 'url(#arrow)'}
        interactionWidth={data.connection === null ? 0 : 18}
      />
      {data.deletable && data.connection !== null ? (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="edge-del nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${data.midpoint.x}px, ${data.midpoint.y}px)` }}
            aria-label={t('canvas.deleteConnection')}
            data-testid="edge-delete"
            onClick={(event) => {
              event.stopPropagation();
              if (data.connection !== null) {
                actions?.deleteConnection(data.connection);
              }
            }}
          >
            ×
          </button>
        </EdgeLabelRenderer>
      ) : null}
    </g>
  );
}

/** The line of a value: from the row of an object to an element, dashed in the colour of the object; several values of one object are one line with their number. */
export function WireEdge({ data }: EdgeProps<Edge<WireEdgeData, 'wire'>>) {
  if (data === undefined) {
    return null;
  }
  const stubs = data.stubs;
  const firstStub = stubs[0];
  const lastStub = stubs[stubs.length - 1];
  return (
    <g
      className={`wire${data.solid ? ' solid' : ' name'}${data.related ? ' on' : ''}${data.dimmed ? ' dim' : ''}`}
      style={{ color: data.color }}
      data-testid="wire"
      data-solid={data.solid ? '1' : '0'}
      data-count={data.count}
    >
      {stubs.map((stub, index) =>
        stub[0] !== undefined && stub[1] !== undefined ? (
          <path key={index} d={`M ${stub[0].x} ${stub[0].y} L ${stub[1].x} ${stub[1].y}`} className="wire-stub" />
        ) : null,
      )}
      {firstStub?.[1] !== undefined && lastStub?.[1] !== undefined && stubs.length > 1 ? (
        <path
          d={`M ${firstStub[1].x} ${firstStub[1].y} L ${lastStub[1].x} ${lastStub[1].y}`}
          className="wire-stub"
        />
      ) : null}
      <path d={data.path} className="wire-line" />
      <path d={data.path} className="wire-hit" data-tip={data.label} />
      <circle cx={data.end.x} cy={data.end.y} r="4" className="wire-end" />
      {data.count > 1 ? (
        <g transform={`translate(${data.midpoint.x} ${data.midpoint.y})`} className="wire-badge">
          <rect x="-13" y="-9" width="26" height="18" rx="9" />
          <text textAnchor="middle" dy="4">
            {data.count}
          </text>
        </g>
      ) : null}
    </g>
  );
}
