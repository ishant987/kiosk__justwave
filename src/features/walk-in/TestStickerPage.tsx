import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import pageTwoArt from '../../public/hhh.webp';

const AUTO_PRINT_DELAY_MS = 300;
const TEST_QR_VALUE = 'JUSTWAVE-TEST-STICKER';
const TEST_QR_SIZE_PX = 150;

const printTicket = () => {
  window.requestAnimationFrame(() => {
    window.setTimeout(() => window.print(), AUTO_PRINT_DELAY_MS);
  });
};

export function TestStickerPage() {
  const navigate = useNavigate();
  const autoPrintStarted = useRef(false);

  useEffect(() => {
    if (!autoPrintStarted.current) {
      autoPrintStarted.current = true;
      printTicket();
    }
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
                <p>The PDF preview uses the exact `75mm x 50mm` full-bleed ticket size.</p>
              </div>
            </div>
          </section>

          <section className="thermal-print-area">
            <article className="thermal-label test-thermal-label">
              <div className="thermal-label-info">
                <div className="thermal-label-copy">
                  <p className="thermal-brand">JUSTWAVE</p>
                  <p className="thermal-pass-type">Printer Test</p>
                </div>
                <h2>QR Check</h2>
                <dl>
                  <div>
                    <dt>Type:</dt>
                    <dd>Printer Test</dd>
                  </div>
                  <div>
                    <dt>Sheet:</dt>
                    <dd>75mm x 50mm</dd>
                  </div>
                  <div>
                    <dt>Area:</dt>
                    <dd>Full bleed</dd>
                  </div>
                  <div>
                    <dt>Check:</dt>
                    <dd>QR and margins</dd>
                  </div>
                </dl>
              </div>
              <div className="thermal-label-qr test-thermal-mark">
                <span className="thermal-print-badge">TEST</span>
                <QRCodeSVG value={TEST_QR_VALUE} size={TEST_QR_SIZE_PX} level="H" includeMargin={false} />
                <strong>DEMO</strong>
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
