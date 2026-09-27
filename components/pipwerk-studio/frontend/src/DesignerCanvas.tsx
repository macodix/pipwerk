import { Background, ReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';

export function DesignerCanvas() {
  const { t } = useTranslation();

  return (
    <section className="designer-canvas" aria-label={t('canvas.label')}>
      <ReactFlow nodes={[]} edges={[]} fitView>
        <Background />
      </ReactFlow>
      <p className="designer-canvas-hint">{t('canvas.empty')}</p>
    </section>
  );
}
