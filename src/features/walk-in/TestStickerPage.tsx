import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import pageTwoArt from '../../public/hhh.webp';

const TEST_QR_VALUE = 'JUSTWAVE-TEST-STICKER';
const TEST_QR_SIZE_PX = 150;

export function TestStickerPage() {
  const navigate = useNavigate();
  const ticketRef = useRef<HTMLElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const openExactPdf = async () => {
    if (!ticketRef.current || isGeneratingPdf) return;

    const pdfWindow = window.open('', '_blank');
    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#ffffff',
        scale: 4,
        logging: false,
        useCORS: true
      });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [75, 50],
        compress: true
      });

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 75, 50, undefined, 'FAST');
      const pdfUrl = URL.createObjectURL(pdf.output('blob'));

      if (pdfWindow) {
        pdfWindow.location.replace(pdfUrl);
      } else {
        window.location.assign(pdfUrl);
      }

      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
    } catch {
      pdfWindow?.close();
      setPdfError('Unable to create the PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <main className="kiosk-stage test-sticker-page">
      <section className="kiosk-device ticket-device">
        <div className="payment-hero ticket-print-hero no-print">
          <img src={pageTwoArt} alt="" />
        </div>

        <section className="ticket-sheet thermal-preview-sheet">
          {pdfError ? <Toast tone="error">{pdfError}</Toast> : null}
          <section className="thermal-preview-header no-print">
              <div className="kiosk-section-title compact-title">
              <span className="section-icon ticket-icon">T</span>
              <div>
                <h3>Test sticker ready</h3>
                <p>The PDF opens at the exact `75mm x 50mm` size without A4 whitespace or rotation.</p>
              </div>
            </div>
          </section>

          <section className="thermal-print-area">
            <article className="thermal-label test-thermal-label" ref={ticketRef}>
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
            <Button type="button" className="kiosk-primary" disabled={isGeneratingPdf} onClick={openExactPdf}>
              {isGeneratingPdf ? 'Creating PDF...' : 'Open Exact PDF'}
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}
