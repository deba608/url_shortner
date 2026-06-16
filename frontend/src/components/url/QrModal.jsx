import { useState, useEffect } from "react";
import { getUrlQrCode } from "@/api/urls";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Fetches the QR code lazily — only when opened — so we never request images for
// links the user never inspects. The backend returns a base64 data URL we can
// drop straight into <img> and an <a download>.
export default function QrModal({ urlId, shortCode, open, onClose }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    getUrlQrCode(urlId)
      .then((data) => active && setQr(data))
      .catch((err) => active && setError(err.message || "Failed to load QR code"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, urlId]);

  return (
    <Modal open={open} onClose={onClose} title={`QR · /${shortCode}`}>
      <div className="flex flex-col items-center gap-4">
        {loading && <div className="h-48 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {qr && !loading && (
          <>
            <img src={qr.qrCode} alt={`QR code for ${qr.shortUrl}`} className="h-48 w-48 rounded-lg" />
            <a href={qr.qrCode} download={`qr-${shortCode}.png`} className="w-full">
              <Button variant="secondary" className="w-full">
                Download PNG
              </Button>
            </a>
          </>
        )}
      </div>
    </Modal>
  );
}
