import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface Props {
  url: string;
  size?: number;
}

export default function ReferralQRCode({ url, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: { dark: '#0B1426', light: '#FFFFFF' },
    });
  }, [url, size]);

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-lg shadow-sm border border-border" />
      <p className="text-xs text-muted-foreground">Scan to refer a friend</p>
    </div>
  );
}
