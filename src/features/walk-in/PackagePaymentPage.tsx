import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { createPasses, getDurationPrices, markEntryPassesPaid } from '../../api/entryExit.api';
import { getApiErrorMessage, isConflictError, isDuplicateParentPhoneError } from '../../api/httpClient';
import { createEntryPassRazorpayOrder, verifyEntryPassRazorpayPayment } from '../../api/payments.api';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import type { DurationPackage } from '../../models/durationPackage';
import type { EntryPass } from '../../models/entryPass';
import pageTwoArt from '../../public/hhh.webp';
import { openRazorpayCheckout } from './razorpay';
import { useWalkInStore } from './walkIn.store';

const paymentMethods = [
  { id: 'upi', label: 'UPI', detail: 'Pay using any UPI App' },
  { id: 'card', label: 'Card', detail: 'Debit / Credit Card' }
] as const;

const packageMinutes = (item: DurationPackage) => item.duration_minutes ?? (Number.parseInt(item.name ?? item.label ?? '0', 10) || 0);
const packagePrice = (item?: DurationPackage) => item?.price ?? item?.amount ?? 0;
type PaymentMethodId = (typeof paymentMethods)[number]['id'] | 'cash';

const toPassArray = (value: unknown): EntryPass[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is EntryPass => Boolean(item && typeof item === 'object' && typeof (item as EntryPass).id === 'string')
    );
  }
  if (!value || typeof value !== 'object') return [];

  const payload = value as {
    data?: unknown;
    passes?: unknown;
    pass?: unknown;
    payment?: { data?: unknown; passes?: unknown; pass?: unknown; ids?: string[] };
  };

  const candidates = [
    payload.passes,
    payload.data,
    payload.payment?.passes,
    payload.payment?.data
  ];

  for (const candidate of candidates) {
    const normalized = toPassArray(candidate);
    if (normalized.length) return normalized;
  }

  if (payload.pass && typeof payload.pass === 'object') return [payload.pass as EntryPass];
  if (payload.payment?.pass && typeof payload.payment.pass === 'object') return [payload.payment.pass as EntryPass];

  return [];
};

const normalizePasses = (result: unknown) => toPassArray(result);

const toIdArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
};

const normalizePassIds = (result: unknown, passes: EntryPass[]): string[] => {
  if (result && typeof result === 'object') {
    const payload = result as {
      data?: unknown;
      ids?: unknown;
      pass_ids?: unknown;
      payment?: { ids?: unknown; pass_ids?: unknown };
    };
    const candidates = [payload.payment?.ids, payload.payment?.pass_ids, payload.ids, payload.pass_ids];

    for (const candidate of candidates) {
      const ids = toIdArray(candidate);
      if (ids.length) return ids;
    }

    if (payload.data && payload.data !== result) {
      const nestedIds: string[] = normalizePassIds(payload.data, []);
      if (nestedIds.length) return nestedIds;
    }
  }

  return passes.map((pass) => pass.id).filter(Boolean);
};

const getRazorpayCheckoutConfig = (order: unknown) => {
  if (order && typeof order === 'object' && 'data' in order) {
    return (order as { data?: unknown }).data;
  }
  return order;
};

const razorpayMethodFor = (methodId: PaymentMethodId) => ({
  upi: methodId === 'upi',
  card: methodId === 'card'
});

const paymentActionLabel = (methodId: PaymentMethodId, total: number) => {
  if (methodId === 'cash') return `Print Sticker Rs. ${total.toFixed(2)}`;
  return `Pay Now Rs. ${total.toFixed(2)}`;
};

const paymentPendingLabel = (methodId: PaymentMethodId) => {
  if (methodId === 'cash') return 'Printing sticker...';
  return 'Opening Razorpay...';
};

export function PackagePaymentPage() {
  const navigate = useNavigate();
  const draft = useWalkInStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('upi');
  const [message, setMessage] = useState<string | null>(null);
  const durationQuery = useQuery({ queryKey: ['duration-prices'], queryFn: getDurationPrices });

  useEffect(() => {
    if (!draft.durationPackage && durationQuery.data?.length) {
      const popular = durationQuery.data.find((item) => packageMinutes(item) === 60) ?? durationQuery.data[0];
      draft.updateDraft({ durationPackage: popular });
    }
  }, [draft, durationQuery.data]);

  const payMutation = useMutation({
    mutationFn: async (methodId: PaymentMethodId) => {
      if (!draft.location || !draft.durationPackage) throw new Error('Branch and package are required.');

      let passes = draft.passes;
      let ids = draft.passIds;

      if (!ids.length) {
        const newNames = draft.newChildNames.map((name) => name.trim()).filter(Boolean);
        const passPayload = {
          location_id: draft.location.id,
          phone: draft.phone,
          duration_price_id: draft.durationPackage.id,
          parent_id: draft.parent?.id,
          child_ids: draft.selectedChildren.map((child) => child.id),
          customer_name: draft.parent ? undefined : draft.customerName,
          child_count: draft.parent ? undefined : newNames.length,
          child_names: newNames.length ? newNames : undefined
        };

        if (methodId === 'cash') {
          const result = await createPasses({ ...passPayload, payment_mode: 'cash' });
          passes = normalizePasses(result);
          ids = normalizePassIds(result, passes);
          if (!ids.length) throw new Error('No pass ids returned by backend.');

          draft.updateDraft({ passes, passIds: ids });
          return { passes, ids };
        }

        const order = await createPasses({ ...passPayload, payment_mode: 'razorpay' });
        const razorpayPayload = await openRazorpayCheckout({
          ...(getRazorpayCheckoutConfig(order) ?? {}),
          description: `${methodId.toUpperCase()} walk-in pass payment`,
          prefill: { contact: draft.phone, name: draft.customerName || draft.parent?.name },
          method: razorpayMethodFor(methodId)
        });
        const verificationResult = await verifyEntryPassRazorpayPayment(razorpayPayload);
        passes = normalizePasses(verificationResult);
        ids = normalizePassIds(verificationResult, passes);
        if (!ids.length) throw new Error('Payment succeeded, but no pass ids were returned by backend.');

        draft.updateDraft({ passes, passIds: ids });
        return { passes, ids };
      }

      if (!ids.length) throw new Error('No pass ids returned by backend.');

      if (methodId === 'cash') {
        const paymentResult = await markEntryPassesPaid(ids, methodId);
        const paidPasses = normalizePasses(paymentResult);
        if (paidPasses.length) {
          passes = paidPasses;
        }
        ids = normalizePassIds(paymentResult, passes);
        draft.updateDraft({ passes, passIds: ids });
        return { passes, ids };
      }

      const order = await createEntryPassRazorpayOrder(ids);
      const razorpayPayload = await openRazorpayCheckout({
        ...(getRazorpayCheckoutConfig(order) ?? {}),
        description: `${methodId.toUpperCase()} walk-in pass payment`,
        prefill: { contact: draft.phone, name: draft.customerName || draft.parent?.name },
        method: razorpayMethodFor(methodId)
      });
      const verificationResult = await verifyEntryPassRazorpayPayment({ ...razorpayPayload, ids });
      const paidPasses = normalizePasses(verificationResult);
      if (paidPasses.length) {
        passes = paidPasses;
      }
      ids = normalizePassIds(verificationResult, passes);

      return { passes, ids };
    },
    onSuccess: ({ passes, ids }) => {
      draft.updateDraft({ passes, passIds: ids });
      navigate('/walk-in/print', { replace: true });
    },
    onError: async (error) => {
      if (isDuplicateParentPhoneError(error)) {
        setMessage('This mobile number already exists. Go back and select the existing child, then continue again.');
        return;
      }

      if (isConflictError(error)) {
        setMessage('This child already has an active pass or inside session. Go back and select another available child.');
        return;
      }

      setMessage(getApiErrorMessage(error));
    }
  });

  const startPayment = (methodId: PaymentMethodId) => {
    if (!selectedPackage || payMutation.isPending) return;
    setSelectedMethod(methodId);
    setMessage(null);
    payMutation.mutate(methodId);
  };

  if (!draft.location || !draft.phone || (!draft.parent && !draft.customerName)) {
    return <Navigate to="/walk-in" replace />;
  }

  const children = [
    ...draft.selectedChildren.map((child) => child.name),
    ...draft.newChildNames.map((name) => name.trim()).filter(Boolean)
  ];
  const selectedPackage = draft.durationPackage;
  const total = packagePrice(selectedPackage) * Math.max(children.length, 1);

  return (
    <main className="kiosk-stage">
      <section className="kiosk-device">
        <div className="payment-hero">
          <img src={pageTwoArt} alt="" />
        </div>

        <section className="payment-sheet">
          {message ? <Toast tone="error">{message}</Toast> : null}
          {durationQuery.isError ? <Toast tone="error">{getApiErrorMessage(durationQuery.error)}</Toast> : null}

          <div className="kiosk-section-title">
            <span className="section-icon clock-icon">1</span>
            <div>
              <h3>Choose your package</h3>
              <p>Select the duration for your walk-in pass</p>
            </div>
          </div>

          <div className="package-grid">
            {(durationQuery.data ?? []).map((item) => {
              const selected = selectedPackage?.id === item.id;
              const minutes = packageMinutes(item);
              return (
                <button
                  type="button"
                  className={selected ? 'package-card selected' : 'package-card'}
                  key={item.id}
                  onClick={() => draft.updateDraft({ durationPackage: item, passes: [], passIds: [] })}
                >
                  {minutes === 60 ? <span className="popular-pill">Popular</span> : null}
                  <span className="package-clock">◷</span>
                  <strong>{minutes || item.name || item.label} mins</strong>
                  <small>Rs. {packagePrice(item).toFixed(2)}</small>
                  {selected ? <b>✓</b> : null}
                </button>
              );
            })}
          </div>

          <section className="summary-card">
            <div className="kiosk-section-title compact-title">
              <span className="section-icon ticket-icon">2</span>
              <div>
                <h3>Pass summary</h3>
                <p>Review your selection</p>
              </div>
            </div>
            <div className="summary-row">
              <span>Children</span>
              <strong>{children.length}</strong>
            </div>
            <div className="summary-row">
              <span>Duration</span>
              <strong>{selectedPackage ? `${packageMinutes(selectedPackage)} mins` : '-'}</strong>
            </div>
            <div className="summary-total">
              <span>Total Amount</span>
              <strong>Rs. {total.toFixed(2)}</strong>
            </div>
          </section>

          <section className="summary-card">
            <div className="kiosk-section-title compact-title">
              <span className="section-icon wallet-icon">3</span>
              <div>
                <h3>Choose payment method</h3>
                <p>Pay securely using UPI or card</p>
              </div>
            </div>
            <div className="pay-method-grid">
              {paymentMethods.map((method) => (
                <button
                  type="button"
                  className={selectedMethod === method.id ? 'pay-method selected' : 'pay-method'}
                  key={method.id}
                  disabled={!selectedPackage || payMutation.isPending}
                  onClick={() => startPayment(method.id)}
                >
                  <strong>{method.label}</strong>
                  <span>
                    {payMutation.isPending && selectedMethod === method.id
                      ? 'Opening test checkout...'
                      : method.detail}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="payment-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/walk-in')}>
              Back
            </Button>
            <Button
              className="kiosk-primary"
              type="button"
              disabled={!selectedPackage || payMutation.isPending}
              onClick={() => startPayment(selectedMethod)}
            >
              {payMutation.isPending ? paymentPendingLabel(selectedMethod) : paymentActionLabel(selectedMethod, total)}
            </Button>
          </div>
          <p className="kiosk-footnote">100% secure payments | UPI and card supported</p>
        </section>
      </section>
    </main>
  );
}
