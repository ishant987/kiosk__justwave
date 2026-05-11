import type { RazorpayOrderConfig, RazorpaySuccessPayload } from '../../models/payment';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const loadScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
    document.body.appendChild(script);
  });

export const openRazorpayCheckout = async (config: RazorpayOrderConfig) => {
  await loadScript();

  return new Promise<RazorpaySuccessPayload>((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay checkout is unavailable.'));
      return;
    }

    const key = config.key || import.meta.env.VITE_RAZORPAY_KEY_ID;
    const orderId = config.order_id ?? config.id;

    if (!key) {
      reject(new Error('Razorpay Key ID is missing.'));
      return;
    }

    if (!config.amount || !orderId) {
      reject(new Error('Razorpay order response is missing amount or order id.'));
      return;
    }

    try {
      const checkout = new window.Razorpay({
        key,
        amount: config.amount,
        currency: config.currency ?? 'INR',
        name: config.name ?? 'JustWave',
        description: config.description ?? 'Entry pass payment',
        order_id: orderId,
        prefill: config.prefill,
        method: config.method,
        handler: resolve,
        modal: {
          ondismiss: () => reject(new Error('Payment was cancelled.'))
        }
      });
      checkout.open();
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unable to open Razorpay Checkout.'));
    }
  });
};
