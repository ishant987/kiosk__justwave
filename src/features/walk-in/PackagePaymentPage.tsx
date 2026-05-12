import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { createPasses, getDurationPrices } from '../../api/entryExit.api';
import { getApiErrorMessage, isConflictError, isDuplicateParentPhoneError } from '../../api/httpClient';
import { createEntryPassRazorpayOrder, verifyEntryPassRazorpayPayment } from '../../api/payments.api';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import type { DurationPackage } from '../../models/durationPackage';
import type { EntryPass } from '../../models/entryPass';
import pageTwoArt from '../../../hhh.png';
import { openRazorpayCheckout } from './razorpay';
import { useWalkInStore } from './walkIn.store';

const paymentMethods = [
  { id: 'upi', label: 'UPI', detail: 'Pay using any UPI App' },
  { id: 'card', label: 'Card', detail: 'Debit / Credit Card' }
];

const packageMinutes = (item: DurationPackage) => item.duration_minutes ?? (Number.parseInt(item.name ?? item.label ?? '0', 10) || 0);
const packagePrice = (item?: DurationPackage) => item?.price ?? item?.amount ?? 0;
type PaymentMethodId = (typeof paymentMethods)[number]['id'];

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

export function PackagePaymentPage() {
  const navigate = useNavigate();
  const draft = useWalkInStore();
  const [selectedMethod, setSelectedMethod] = useState('upi');
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
        const result = await createPasses({
          location_id: draft.location.id,
          phone: draft.phone,
          duration_price_id: draft.durationPackage.id,
          parent_id: draft.parent?.id,
          child_ids: draft.selectedChildren.map((child) => child.id),
          customer_name: draft.parent ? undefined : draft.customerName,
          child_count: draft.parent ? undefined : newNames.length,
          child_names: newNames.length ? newNames : undefined
        });

        passes = result.passes ?? result.data ?? (result.pass ? [result.pass] : []);
        ids = result.payment?.ids ?? result.ids ?? passes.map((pass: EntryPass) => pass.id);
        draft.updateDraft({ passes, passIds: ids });
      }

      if (!ids.length) throw new Error('No pass ids returned by backend.');

      const order = await createEntryPassRazorpayOrder(ids);
      const razorpayPayload = await openRazorpayCheckout({
        ...(getRazorpayCheckoutConfig(order) ?? {}),
        description: `${methodId.toUpperCase()} walk-in pass payment`,
        prefill: { contact: draft.phone, name: draft.customerName || draft.parent?.name },
        method: razorpayMethodFor(methodId)
      });
      await verifyEntryPassRazorpayPayment({ ...razorpayPayload, ids });

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
                <p>All options open Razorpay Checkout</p>
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
                  <span>{payMutation.isPending && selectedMethod === method.id ? 'Opening test checkout...' : method.detail}</span>
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
              {payMutation.isPending ? 'Opening Razorpay...' : `Pay Now Rs. ${total.toFixed(2)}`}
            </Button>
          </div>
          <p className="kiosk-footnote">100% secure payments | Instant pass</p>
        </section>
      </section>
    </main>
  );
}
