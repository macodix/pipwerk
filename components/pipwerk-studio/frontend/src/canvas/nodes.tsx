import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { createContext, Fragment, useContext, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { outPort, type Dir } from '../arrange/scene';
import { Icon } from '../ui/Icon';
import type { BandData, CardData, FrameData, SectionNodeData, StepData } from './flowModel';

/** What the nodes of the drawing area can do; the drawing area provides it (the nodes only show and report clicks). */
export type CanvasActions = {
  selectElement: (id: string) => void;
  selectFrame: (owner: string) => void;
  selectSection: (id: string) => void;
  /** A step was clicked: it selects, or it becomes the successor of the armed output. */
  clickStep: (id: string) => void;
  armOutput: (from: string, output: string) => void;
  toggleFrame: (owner: string) => void;
  setSectionCollapsed: (id: string, collapsed: boolean) => void;
  renameSection: (id: string, name: string) => void;
  toggleCard: (id: string) => void;
};

export const CanvasActionsContext = createContext<CanvasActions | null>(null);

function useActions(): CanvasActions {
  const actions = useContext(CanvasActionsContext);
  if (actions === null) {
    throw new Error('The nodes of the drawing area are used outside of the drawing area');
  }
  return actions;
}

const sides = (dir: Dir) =>
  dir === 'v'
    ? { input: Position.Top, output: Position.Bottom, data: Position.Left }
    : { input: Position.Left, output: Position.Right, data: Position.Top };

/** A step of the flow: a trigger, an element of the flow, or an element of an unknown type. */
export function StepNode({ data }: NodeProps<Node<StepData, 'step'>>) {
  const { t } = useTranslation();
  const actions = useActions();
  const place = sides(data.dir);
  const box = { x: 0, y: 0, w: data.width, h: data.height };
  const state = data.level === 'error' ? ' err' : data.level === 'hint' ? ' hint' : '';
  const outputCount = data.outputs.length;
  return (
    <div
      className={`node k-${data.cls}${data.selected ? ' selected' : ''}${state}${data.armed !== null ? ' armed' : ''}${data.armable ? ' armable' : ''}${data.unknown ? ' unknown' : ''}`}
      data-testid="node"
      data-node-id={data.element}
      data-node-name={data.name}
      data-type-name={data.typeName}
      tabIndex={0}
      aria-label={`${data.typeName}: ${data.name}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          actions.clickStep(data.element);
        }
      }}
    >
      {!data.trigger ? (
        <Handle
          type="target"
          position={place.input}
          id="in"
          className="port in"
          data-testid="port-in"
          isConnectableStart={false}
        />
      ) : null}
      <Handle
        type="target"
        position={place.data}
        id="data"
        className={`port data${data.wireCount > 0 ? '' : ' idle'}`}
        data-tip={data.wireCount > 0 ? t('canvas.wiresArrive', { count: data.wireCount }) : undefined}
        isConnectableStart={false}
      />
      <div className="node-head">
        <span className={`badge sm b-${data.cls}`}>
          <Icon name={data.icon} size={16} />
        </span>
        <span className="node-name" title={data.name}>
          {data.name}
        </span>
        {data.level !== null ? (
          <Icon name={data.level === 'error' ? 'warn' : 'info'} size={16} className={`node-flag ${data.level}`} />
        ) : null}
      </div>
      <div className="node-type">{data.typeName}</div>
      <div className="node-sum">{data.summary}</div>
      {data.outputs.map((output, index) => {
        const point = outPort(box, index, outputCount, data.dir);
        const style: CSSProperties = data.dir === 'v' ? { left: point.x } : { top: point.y };
        return (
          <Fragment key={output.id}>
            <Handle
              type="source"
              position={place.output}
              id={output.id}
              className={`port out${output.used ? ' used' : ''}${data.armed === output.id ? ' armed' : ''}${output.management ? ' mgmt' : ''}`}
              style={style}
              data-testid={`port-out-${output.id}`}
              data-tip={
                output.management
                  ? t('canvas.portManagement')
                  : output.used
                    ? t('canvas.portReconnect')
                    : t('canvas.portConnect')
              }
              aria-label={output.label}
              isConnectableEnd={false}
              onClick={(event) => {
                event.stopPropagation();
                actions.armOutput(data.element, output.id);
              }}
            />
            {outputCount > 1 ? (
              <span
                className={`port-label ${data.dir}`}
                style={data.dir === 'v' ? { left: point.x, top: point.y + 5 } : { left: point.x + 8, top: point.y - 9 }}
              >
                {output.label}
              </span>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

/** An object on the drawing area: a card with a row per property and a connection point at each row. */
export function CardNode({ data }: NodeProps<Node<CardData, 'card'>>) {
  const { t } = useTranslation();
  const actions = useActions();
  const place = sides(data.dir);
  const state = data.level === 'error' ? ' err' : data.level === 'hint' ? ' hint' : '';
  return (
    <div
      className={`card k-${data.cls}${data.selected ? ' selected' : ''}${state}`}
      style={{ ['--wire' as string]: data.color }}
      data-testid="card"
      data-node-id={data.element}
      data-node-name={data.name}
      tabIndex={0}
      aria-label={`${data.typeName}: ${data.name}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          actions.selectElement(data.element);
        }
      }}
    >
      <Handle
        type="target"
        position={place.data}
        id="data"
        className={`port data${data.wireCount > 0 ? '' : ' idle'}`}
        isConnectableStart={false}
      />
      <div className="card-head">
        <span className={`badge sm b-${data.cls}`}>
          <Icon name={data.icon} size={16} />
        </span>
        <div className="card-title">
          <span className="node-name" title={data.name}>
            {data.name}
          </span>
          <span className="card-sub">{data.subtitle}</span>
        </div>
        {data.level !== null ? (
          <Icon name={data.level === 'error' ? 'warn' : 'info'} size={16} className={`node-flag ${data.level}`} />
        ) : null}
      </div>
      <ul className="card-rows">
        {data.rows.map((row) => (
          <li
            key={row.id}
            className={`card-row${row.used ? ' used' : ''}`}
            data-tip={row.explanation === '' ? undefined : row.explanation}
            data-testid="card-row"
            data-prop={row.id}
          >
            <span className="row-name">{row.label}</span>
            <span className="row-type">{row.datatype}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={`prop:${row.id}`}
              className="port prop"
              data-testid={`port-prop-${row.id}`}
              data-tip={t('canvas.portValue')}
              isConnectableEnd={false}
            />
          </li>
        ))}
      </ul>
      {data.total > 3 && (data.rows.length < data.total || data.open) ? (
        <button
          type="button"
          className="card-more nodrag nopan"
          data-testid="card-more"
          onClick={(event) => {
            event.stopPropagation();
            actions.toggleCard(data.element);
          }}
        >
          <Icon name={data.open ? 'up' : 'down'} size={13} />
          {data.open ? t('canvas.fewerProperties') : t('canvas.allProperties', { count: data.total })}
        </button>
      ) : null}
    </div>
  );
}

/** The frame of a management: it hangs at the output of its element and folds in and out. */
export function FrameNode({ data }: NodeProps<Node<FrameData, 'frame'>>) {
  const { t } = useTranslation();
  const actions = useActions();
  const place = sides(data.dir);
  return (
    <div
      className={`frame${data.selected ? ' selected' : ''}${data.collapsed ? ' collapsed' : ''}`}
      data-testid="frame"
      data-frame-id={data.owner}
    >
      <Handle type="target" position={place.input} id="in" className="port in frame-port" isConnectable={false} />
      <div className="frame-head">
        <button
          type="button"
          className="band-toggle nodrag nopan"
          aria-label={data.collapsed ? t('canvas.expandManagement') : t('canvas.collapseManagement')}
          data-testid="frame-toggle"
          onClick={(event) => {
            event.stopPropagation();
            actions.toggleFrame(data.owner);
          }}
        >
          <Icon name={data.collapsed ? 'right' : 'down'} size={14} />
        </button>
        <Icon name="layers" size={15} />
        <span className="frame-title">{t('canvas.management', { name: data.title })}</span>
        {data.collapsed ? <span className="chip">{t('canvas.steps', { count: data.count })}</span> : null}
      </div>
    </div>
  );
}

/** The box around the steps of an open section with its name and the button that folds it in. */
export function BandNode({ data }: NodeProps<Node<BandData, 'band'>>) {
  const { t } = useTranslation();
  const actions = useActions();
  return (
    <div className={`band${data.selected ? ' selected' : ''}`} data-testid="band" data-section={data.name}>
      <div className="band-label">
        <button
          type="button"
          className="band-toggle nodrag nopan"
          aria-label={t('canvas.collapseSection')}
          data-testid="section-collapse"
          onClick={() => {
            actions.setSectionCollapsed(data.section, true);
          }}
        >
          <Icon name="down" size={14} />
        </button>
        <input
          className="band-name nodrag nopan"
          style={{ width: `${Math.max(6, data.name.length + 1)}ch` }}
          value={data.name}
          aria-label={t('canvas.sectionName')}
          onFocus={() => {
            actions.selectSection(data.section);
          }}
          onChange={(event) => {
            actions.renameSection(data.section, event.target.value);
          }}
        />
      </div>
    </div>
  );
}

/** A section that is folded in: one box with its name and the number of its steps; the lines stay. */
export function SectionNode({ data }: NodeProps<Node<SectionNodeData, 'section'>>) {
  const { t } = useTranslation();
  const actions = useActions();
  const place = sides(data.dir);
  const box = { x: 0, y: 0, w: 236, h: 58 };
  const out = outPort(box, 0, 1, data.dir);
  const state = data.level === 'error' ? ' err' : data.level === 'hint' ? ' hint' : '';
  return (
    <div
      className={`node sec-node k-calc${data.selected ? ' selected' : ''}${state}`}
      data-testid="section-node"
      data-section={data.name}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          actions.selectSection(data.section);
        }
      }}
    >
      <Handle type="target" position={place.input} id="in" className="port in" isConnectable={false} />
      <Handle type="target" position={place.data} id="data" className="port data idle" isConnectable={false} />
      <button
        type="button"
        className="band-toggle nodrag nopan"
        aria-label={t('canvas.expandSection')}
        data-testid="section-expand"
        onClick={(event) => {
          event.stopPropagation();
          actions.setSectionCollapsed(data.section, false);
        }}
      >
        <Icon name="right" size={14} />
      </button>
      <div className="sec-text">
        <strong>{data.name}</strong>
        <span>{t('canvas.steps', { count: data.count })}</span>
      </div>
      <Handle
        type="source"
        position={place.output}
        id="out"
        className="port out used"
        style={data.dir === 'v' ? { left: out.x } : { top: out.y }}
        isConnectable={false}
      />
    </div>
  );
}

/**
 * The area "Objekte und ihre Werte" behind the cards. It carries no hint: the drawing area shows none (specification
 * 5.3). The area gives way to the placement of the objects at the element of their first use (order 12).
 */
export function LaneNode({ data }: NodeProps<Node<{ empty?: boolean }, 'lane'>>) {
  const { t } = useTranslation();
  return (
    <div className={data.empty === true ? 'lane-empty' : 'lane'} data-testid={data.empty === true ? 'lane-empty' : 'lane'}>
      <span className="lane-title">
        <Icon name="layers" size={14} />
        {t('canvas.lane')}
      </span>
    </div>
  );
}
