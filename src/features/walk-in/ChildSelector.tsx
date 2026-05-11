import type { ChildProfile } from '../../models/child';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useWalkInStore } from './walkIn.store';

export function ChildSelector() {
  const { parent, selectedChildren, newChildNames, customerName, updateDraft } = useWalkInStore();
  const children = parent?.children ?? [];
  const activeIds = new Set((parent?.active_sessions ?? []).map((session) => session.child_id).filter(Boolean));

  const toggleChild = (child: ChildProfile) => {
    const exists = selectedChildren.some((selected) => selected.id === child.id);
    updateDraft({
      selectedChildren: exists
        ? selectedChildren.filter((selected) => selected.id !== child.id)
        : [...selectedChildren, child]
    });
  };

  const updateChildName = (index: number, value: string) => {
    updateDraft({ newChildNames: newChildNames.map((name, childIndex) => (childIndex === index ? value : name)) });
  };

  return (
    <section className="panel form-stack">
      {!parent ? (
        <Input label="Parent name" value={customerName} onChange={(event) => updateDraft({ customerName: event.target.value })} />
      ) : null}
      {children.length ? (
        <div>
          <h2 className="section-title">Existing children</h2>
          <div className="choice-grid">
            {children.map((child) => {
              const disabled = activeIds.has(child.id) || Boolean(child.active_session);
              const selected = selectedChildren.some((item) => item.id === child.id);
              return (
                <button
                  type="button"
                  key={child.id}
                  className={selected ? 'choice selected' : 'choice'}
                  disabled={disabled}
                  onClick={() => toggleChild(child)}
                >
                  <strong>{child.name}</strong>
                  <span>{disabled ? 'Inside already' : selected ? 'Selected' : 'Available'}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div>
        <h2 className="section-title">New child names</h2>
        <div className="form-stack">
          {newChildNames.map((name, index) => (
            <Input
              key={index}
              label={`Child ${index + 1}`}
              value={name}
              onChange={(event) => updateChildName(index, event.target.value)}
            />
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={() => updateDraft({ newChildNames: [...newChildNames, ''] })}>
          Add child
        </Button>
      </div>
    </section>
  );
}
