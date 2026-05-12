import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { recordPrint } from '../../api/entryExit.api';
import { getApiErrorMessage } from '../../api/httpClient';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import type { EntryPass } from '../../models/entryPass';
import pageTwoArt from '../../../hhh.png';
import { useWalkInStore } from './walkIn.store';

const shortId = (value: string) => value.replace(/-/g, '').slice(0, 8).toUpperCase();
const minutesFromPackage = (value?: { duration_minutes?: number; name?: string; label?: string }) =>
  value?.duration_minutes ?? (Number.parseInt(value?.name ?? value?.label ?? '0', 10) || 0);

export function PrintPassPage() {
  const navigate = useNavigate();
  const { passIds, passes, phone, selectedChildren, newChildNames, durationPackage, location, resetDraft } = useWalkInStore();
  const autoPrintStarted = useRef(false);
  const mutation = useMutation({
    mutationFn: () => recordPrint(passIds),
    onSuccess: () => window.print()
  });

  useEffect(() => {
    if (!passIds.length || autoPrintStarted.current) return;
    autoPrintStarted.current = true;
    mutation.mutate();
  }, [mutation, passIds.length]);

  if (!passIds.length) return <Navigate to="/walk-in" replace />;

  const ticketPasses = passes.length ? passes : passIds.map((id): EntryPass => ({ id }));
  const childNames = [
    ...selectedChildren.map((child) => child.name),
    ...newChildNames.map((name) => name.trim()).filter(Boolean)
  ];
  const durationMinutes = minutesFromPackage(durationPackage);
  const packagePrice = durationPackage?.price ?? durationPackage?.amount ?? 0;

  const startNewPass = () => {
    resetDraft();
    navigate('/walk-in', { replace: true });
  };

  return (
    <main className="kiosk-stage">
      <section className="kiosk-device ticket-device">
        <div className="payment-hero ticket-print-hero no-print">
          <img src={pageTwoArt} alt="" />
        </div>

        <section className="ticket-sheet thermal-preview-sheet">
          <section className="thermal-preview-header no-print">
            <div className="kiosk-section-title compact-title">
              <span className="section-icon ticket-icon">✓</span>
              <div>
                <h3>Pass ready</h3>
            
              </div>
            </div>
            {mutation.isError ? <Toast tone="error">{getApiErrorMessage(mutation.error)}</Toast> : null}
          </section>

          <section className="thermal-print-area">
            {ticketPasses.map((pass, index) => {
              const qrValue = pass.qr_token ?? pass.id;
              const ref = pass.pass_number ?? shortId(pass.id);
              const childName = pass.child_name ?? childNames[index] ?? childNames[0] ?? 'JUSTWAVE';
              const amount = pass.amount ?? packagePrice;

              return (
                <article className="thermal-label" key={pass.id}>
                  <div className="thermal-label-info">
                    <h2>{childName}</h2>
                    <dl>
                      <div>
                        <dt>Ref:</dt>
                        <dd>{ref}</dd>
                      </div>
                      <div>
                        <dt>Phone:</dt>
                        <dd>{phone}</dd>
                      </div>
                      <div>
                        <dt>Branch:</dt>
                        <dd>{location?.name ?? 'JustWave'}</dd>
                      </div>
                      <div>
                        <dt>Stay:</dt>
                        <dd>
                          {durationMinutes || '-'}m | Rs.{Number(amount).toFixed(2)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="thermal-label-qr">
                    <QRCodeSVG value={qrValue} size={78} level="H" includeMargin={false} />
                    <strong>{ref}</strong>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="thermal-actions no-print">
            <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Recording print...' : 'Print Pass'}
            </Button>
            <Button type="button" variant="secondary" onClick={startNewPass}>
              New Pass
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}
