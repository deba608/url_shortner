import { useState, useEffect } from "react";
import { getUrlQrCode } from "@/api/urls";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

export default function QrModal({ urlId, shortCode, open, onClose }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    getUrlQrCode(urlId)
      .then((data) => active && setQr(data))
      .catch((err) => active && setError(err.message || "Failed to load QR code"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, urlId]);

  return (
    <Modal open={open} onClose={onClose} title={`QR Code · /${shortCode}`}>
      <div className="flex flex-col items-center gap-4">
        {loading && <Skeleton className="h-52 w-52" />}
        {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
        {qr && !loading && (
          <>
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-3 bg-white">
              <img
                src={qr.qrCode}
                alt={`QR code for ${qr.shortUrl}`}
                className="h-48 w-48 rounded-xl"
              />
            </div>
            <p className="text-xs text-gray-400 text-center max-w-[200px] truncate">{qr.shortUrl}</p>
            <a href={qr.qrCode} download={`qr-${shortCode}.png`} className="w-full">
              <Button variant="secondary" className="w-full" size="md">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </Button>
            </a>
          </>
        )}
      </div>
    </Modal>
  );
}
