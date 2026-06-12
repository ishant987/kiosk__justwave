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
const QR_PRINT_SIZE_PX = 190;

const formatDuration = (minutes: number) => {
  if (!minutes) return '-';
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes} mins`;
};

const formatAmount = (amount: number) =>
  `Rs.${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount)}`;

const printTicket = () => {
  window.requestAnimationFrame(() => {
    window.setTimeout(() => window.print(), AUTO_PRINT_DELAY_MS);
  });
};

export function PrintPassPage() {
  const navigate = useNavigate();
  const {
    passIds,
    passes,
    phone,
    parent,
    customerName,
    selectedChildren,
    newChildNames,
    durationPackage,
    resetDraft
  } = useWalkInStore();
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
              const guardianName = pass.parent_name ?? pass.customer_name ?? parent?.name ?? customerName ?? 'Walk-in Guest';
              const printCount = (pass.print_count ?? 0) + 1;

              return (
                <article className="thermal-label pass-ticket" key={pass.id}>
                  <section className="pass-ticket-main">
                    <div className="pass-ticket-heading">
                      <p className="pass-ticket-brand">JUSTWAVE</p>
                      <p className="pass-ticket-badge">CHILD PASS</p>
                    </div>
                    <div className="pass-ticket-admission">
                      <p>ADMIT ONE</p>
                      <h2>{childName}</h2>
                    </div>
                    <dl className="pass-ticket-details">
                      <div>
                        <dt>TIME / DURATION</dt>
                        <dd>{formatDuration(duration)}</dd>
                      </div>
                      <div>
                        <dt>AMOUNT</dt>
                        <dd>{formatAmount(Number(amount))}</dd>
                      </div>
                      <div>
                        <dt>GUARDIAN</dt>
                        <dd>{guardianName}</dd>
                      </div>
                      <div>
                        <dt>PHONE</dt>
                        <dd>{phone}</dd>
                      </div>
                    </dl>
                  </section>
                  <section className="pass-ticket-stub">
                    <p className="pass-ticket-print-count">PRINTED {printCount}X</p>
                    <div className="pass-ticket-qr-group">
                      <div className="pass-ticket-qr-frame">
                        <QRCodeSVG value={qrValue} size={QR_PRINT_SIZE_PX} level="H" includeMargin={false} />
                      </div>
                      <strong className="pass-ticket-code">{ref.split('').join(' ')}</strong>
                    </div>
                  </section>
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
