// What an object delivers: every property and method with name, data type and a visible description (req-ui-016).
import { DTYPE_LABEL, membersOf, memberDesc, methodText, tx } from './catalog';
import type { El } from './model';
import { useApp } from './store';
import { Icon, useL } from './ui';

export function MemberList({ el, usage }: { el: Pick<El, 'type' | 'own' | 'name'>; usage?: Map<string, string[]> }) {
  const L = useL();
  const lang = useApp().settings.lang;
  const members = membersOf(el);
  return (
    <ul className="prop-list" data-testid="member-list">
      {members.map((p) => {
        const used = usage?.get(p.id);
        const desc = memberDesc(el, p.id, lang);
        return (
          <li key={p.id} className="prop-row prop-row-desc" data-tip={desc} data-testid="prop-row" data-member={p.id} data-method={p.method ? '1' : '0'}>
            <div className="prop-line">
              <span className="prop-name" data-testid="prop-name">{p.method ? methodText(p.method, undefined, lang) : tx(p, lang)}</span>
              {p.method
                ? <span className="dtype-chip method-chip" data-testid="prop-type">{L('Methode', 'Method')} · {p.method.args.map((a) => tx(a, lang)).join('; ')}</span>
                : <span className="dtype-chip" data-testid="prop-type">{tx(DTYPE_LABEL[p.dtype], lang)}</span>}
              {p.choices && <span className="prop-values">{p.choices.map((c) => tx(c, lang)).join(' · ')}</span>}
              {used && <span className="prop-used"><Icon name="link" size={12} />{used.join(', ')}</span>}
            </div>
            <p className="prop-desc" data-testid="prop-desc">{desc}</p>
          </li>
        );
      })}
    </ul>
  );
}
