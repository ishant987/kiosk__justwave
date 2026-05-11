import { QRCodeSVG } from 'qrcode.react';

export function QRCode({ value, label }: { value: string; label?: string }) {
  return (
    <div className="qr-box">
      <QRCodeSVG value={value} size={220} level="H" includeMargin />
      {label ? <strong>{label}</strong> : null}
    </div>
  );
}
