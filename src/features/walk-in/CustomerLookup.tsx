import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { lookupParent } from '../../api/entryExit.api';
import { getApiErrorMessage } from '../../api/httpClient';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Toast } from '../../components/Toast';
import type { ChildProfile } from '../../models/child';
import { useWalkInStore } from './walkIn.store';

export function CustomerLookup() {
  const { phone, updateDraft } = useWalkInStore();
  const [localPhone, setLocalPhone] = useState(phone);

  const mutation = useMutation({
    mutationFn: () => lookupParent(localPhone),
    onSuccess: (data) => {
      const parent = data.parent ?? null;
      const children = data.children ?? parent?.children ?? [];
      updateDraft({
        phone: localPhone,
        parent,
        selectedChildren: [],
        customerName: parent?.name ?? '',
        newChildNames: children.length ? [''] : ['']
      });
    }
  });

  const submit = () => {
    if (/^\d{10}$/.test(localPhone)) mutation.mutate();
  };

  const parent = useWalkInStore((state) => state.parent);
  const children = parent?.children ?? [];
  const activeIds = new Set((parent?.active_sessions ?? []).map((session) => session.child_id).filter(Boolean));

  return (
    <section className="panel">
      <div className="inline-form">
        <Input
          label="Parent phone"
          value={localPhone}
          onChange={(event) => setLocalPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
          inputMode="numeric"
          placeholder="10 digit mobile"
        />
        <Button type="button" onClick={submit} disabled={mutation.isPending || !/^\d{10}$/.test(localPhone)}>
          {mutation.isPending ? 'Looking...' : 'Lookup'}
        </Button>
      </div>
      {mutation.isError ? <Toast tone="error">{getApiErrorMessage(mutation.error)}</Toast> : null}
      {mutation.isSuccess && parent ? (
        <div className="result-box">
          <strong>{parent.name || 'Existing parent'}</strong>
          <span>{parent.phone}</span>
          {children.length ? (
            <div className="chip-grid">
              {children.map((child: ChildProfile) => (
                <span className={activeIds.has(child.id) || child.active_session ? 'chip disabled' : 'chip'} key={child.id}>
                  {child.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {mutation.isSuccess && !parent ? <Toast>No parent found. Add the customer and children below.</Toast> : null}
    </section>
  );
}
