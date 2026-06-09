import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { recordPrint } from '../../api/entryExit.api';
import { getApiErrorMessage } from '../../api/httpClient';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import type { EntryPass } from '../../models/entryPass';
import pageTwoArt from '../../public/hhh.webp';
import { useWalkInStore } from './walkIn.store';

const shortId = (value: string) => value.replace(/-/g, '').slice(0, 8).toUpperCase();
const minutesFromPackage = (value?: { duration_minutes?: number; name?: string; label?: string }) =>
  value?.duration_minutes ?? (Number.parseInt(value?.name ?? value?.label ?? '0', 10) || 0);
const AUTO_PRINT_DELAY_MS = 300;
const QR_PRINT_SIZE_PX = 173;

const formatIssuedAt = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const printTicket = () => {
  window.requestAnimationFrame(() => {
    window.setTimeout(() => window.print(), AUTO_PRINT_DELAY_MS);
  });
};

export function PrintPassPage() {
  const navigate = useNavigate();
  const { passIds, passes, phone, selectedChildren, newChildNames, durationPackage, location, resetDraft } = useWalkInStore();
  const autoPrintStarted = useRef(false);
  const mutation = useMutation({
    mutationFn: () => recordPrint(passIds)
  });

  useEffect(() => {
    if (!passIds.length || autoPrintStarted.current) return;
    autoPrintStarted.current = true;
    printTicket();
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
                <p>The sticker is ready to print.</p>
              </div>
            </div>
            {mutation.isError ? <Toast tone="error">{getApiErrorMessage(mutation.error)}</Toast> : null}
          </section>

          <section className="thermal-print-area">
            {ticketPasses.map((pass, index) => {
              const qrValue = pass.qr_token ?? pass.id;
              const ref = pass.pass_number ?? shortId(pass.id);
              const childName = pass.child_name ?? childNames[index] ?? childNames[0] ?? 'JUSTWAVE';
              const amount = pass.bill_total_amount ?? pass.amount ?? pass.pass_price ?? packagePrice;
              const duration = pass.expected_duration_minutes ?? durationMinutes;
              const issuedAt = formatIssuedAt(pass.issued_at ?? pass.paid_at);
              const hostName = pass.parent_name ?? pass.customer_name ?? 'Walk-in Guest';
              const branchName = pass.location_name ?? location?.name ?? 'JustWave';
              const passType = pass.entry_type?.replaceAll('_', ' ') ?? 'Walk-in Pass';
              const printCount = pass.print_count ?? 0;

              return (
                <article className="thermal-label" key={pass.id}>
                  <div className="thermal-label-info">
                    <div className="thermal-label-copy">
                      <p className="thermal-brand">JUSTWAVE</p>
                      <p className="thermal-pass-type">{passType}</p>
                    </div>
                    <h2>{childName}</h2>
                    <dl>
                      <div>
                        <dt>Issued</dt>
                        <dd>{issuedAt ?? 'Ready now'}</dd>
                      </div>
                      <div>
                        <dt>Duration</dt>
                        <dd>{duration ? `${duration} mins` : '-'}</dd>
                      </div>
                      <div>
                        <dt>Amount</dt>
                        <dd>Rs. {Number(amount).toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt>Guest</dt>
                        <dd>{hostName}</dd>
                      </div>
                      <div>
                        <dt>Branch</dt>
                        <dd>{branchName}</dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>{phone}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="thermal-label-qr">
                    <span className="thermal-print-badge">Print {printCount}</span>
                    <QRCodeSVG value={qrValue} size={QR_PRINT_SIZE_PX} level="H" includeMargin={false} />
                    <strong>{ref}</strong>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="thermal-actions no-print">
            <Button type="button" variant="secondary" onClick={startNewPass}>
              New Pass
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}
