import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import pageTwoArt from '../../public/hhh.webp';

const AUTO_PRINT_DELAY_MS = 300;
const TEST_STICKER_PRINT_STYLE_ID = 'test-sticker-print-style';

const printTicket = () => {
  window.requestAnimationFrame(() => {
    window.setTimeout(() => window.print(), AUTO_PRINT_DELAY_MS);
  });
};

export function TestStickerPage() {
  const navigate = useNavigate();
  const autoPrintStarted = useRef(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = TEST_STICKER_PRINT_STYLE_ID;
    style.textContent = `
      @page {
        size: 75mm 50mm;
        margin: 0;
      }

      @media print {
        html,
        body,
        #root {
          width: 75mm;
          min-width: 75mm;
        }

        .test-sticker-page,
        .test-sticker-page .ticket-device,
        .test-sticker-page .ticket-sheet,
        .test-sticker-page .thermal-preview-sheet,
        .test-sticker-page .thermal-print-area {
          width: 75mm;
        }

        .test-sticker-page .test-thermal-label {
          width: 70mm;
          height: 45mm;
          min-height: 45mm;
          margin: 2.5mm;
          page-break-after: auto;
          break-after: auto;
        }
      }
    `;
    document.head.appendChild(style);

    if (!autoPrintStarted.current) {
      autoPrintStarted.current = true;
      printTicket();
    }

    return () => {
      style.remove();
    };
  }, []);

  return (
    <main className="kiosk-stage test-sticker-page">
      <section className="kiosk-device ticket-device">
        <div className="payment-hero ticket-print-hero no-print">
          <img src={pageTwoArt} alt="" />
        </div>

        <section className="ticket-sheet thermal-preview-sheet">
          <section className="thermal-preview-header no-print">
            <div className="kiosk-section-title compact-title">
              <span className="section-icon ticket-icon">T</span>
              <div>
                <h3>Test sticker ready</h3>
                <p>The printer dialog will open with the same preview flow as the pass sticker.</p>
              </div>
            </div>
          </section>

          <section className="thermal-print-area">
            <article className="thermal-label test-thermal-label">
              <div className="thermal-label-info">
                <h2>JUSTWAVE</h2>
                <dl>
                  <div>
                    <dt>Type:</dt>
                    <dd>Printer Test</dd>
                  </div>
                  <div>
                    <dt>Sheet:</dt>
                    <dd>75 x 50 mm</dd>
                  </div>
                  <div>
                    <dt>Area:</dt>
                    <dd>70 x 45 mm</dd>
                  </div>
                  <div>
                    <dt>Check:</dt>
                    <dd>Alignment and margins</dd>
                  </div>
                </dl>
              </div>
              <div className="thermal-label-qr test-thermal-mark">
                <strong>TEST</strong>
                <span>PRINT</span>
              </div>
            </article>
          </section>

          <div className="thermal-actions no-print">
            <Button type="button" variant="secondary" onClick={() => navigate('/walk-in', { replace: true })}>
              Back
            </Button>
            <Button type="button" className="kiosk-primary" onClick={printTicket}>
              Print Again
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}
