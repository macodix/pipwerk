import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { MANAGEMENT_HANDLE, type ElementFlowNode } from './flowModel';
import { NODE_TOP, OUTPUT_ROW_HEIGHT } from './layout';

/**
 * An element on the drawing area: its title (or the name of its instance), the
 * type, the connectors (input on the left, outputs on the right, a connector
 * at the bottom if the element has a management) and the mark of a finding.
 * Objects have no connectors.
 */
export function ElementNode({ id, data }: NodeProps<ElementFlowNode>) {
  const { t } = useTranslation();
  const updateNodeInternals = useUpdateNodeInternals();
  const signature = `${data.hasInput}|${data.managementHandle ?? ''}|${data.outputs.map((output) => output.id).join('|')}`;

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, signature, updateNodeInternals]);

  const classes = ['element-node', `kind-${data.nodeKind}`];
  if (data.nodeKind === 'unknown') {
    classes.push('unknown-type');
  }
  if (data.severity !== null) {
    classes.push(`severity-${data.severity}`);
  }

  return (
    <div className={classes.join(' ')} data-severity={data.severity ?? undefined} data-node-kind={data.nodeKind}>
      {data.hasInput ? <Handle type="target" position={Position.Left} /> : null}
      <div className="element-node-title" title={data.title}>
        {data.title}
      </div>
      <div className="element-node-subtitle" title={data.subtitle}>
        {data.subtitle}
      </div>
      {data.severity !== null ? (
        <span className={`element-node-mark mark-${data.severity}`}>{t(`findings.level.${data.severity}`)}</span>
      ) : null}
      {data.outputs.map((output, index) => (
        // The row spans the whole width of the element, so that the connector sits at its edge.
        <div
          key={output.id}
          className={`element-node-output${output.stored ? ' stored-output' : ''}`}
          style={{ top: NODE_TOP + index * OUTPUT_ROW_HEIGHT, height: OUTPUT_ROW_HEIGHT }}
        >
          <span className="output-label">{output.label}</span>
          <Handle type="source" id={output.id} position={Position.Right} isConnectable={output.connectable} />
        </div>
      ))}
      {data.managementHandle === MANAGEMENT_HANDLE ? (
        <Handle type="source" id={MANAGEMENT_HANDLE} position={Position.Bottom} isConnectable={false} />
      ) : null}
    </div>
  );
}
