import { useState } from "react";
import { Link } from "react-router-dom";
import { deleteUrl as deleteUrlRequest } from "@/api/urls";
import { useClipboard } from "@/hooks/useClipboard";
import { formatDate, truncate } from "@/utils/format";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import QrModal from "@/components/url/QrModal";

// Reusable URL row with copy / QR / analytics / delete actions. Owns its own
// modal + delete state; notifies the parent via onDeleted() so the list refetches.
export default function UrlCard({ url, onDeleted }) {
  const { copied, copy } = useClipboard();
  const [showQr, setShowQr] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteUrlRequest(url.id);
      setConfirmOpen(false);
      onDeleted?.(url.id);
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <a
            href={url.shortUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {url.shortUrl}
          </a>
          <p className="truncate text-sm text-gray-500" title={url.originalUrl}>
            {truncate(url.originalUrl, 64)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">{url.clicks} clicks</p>
          <p className="text-xs text-gray-400">{formatDate(url.createdAt)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => copy(url.shortUrl)}>
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setShowQr(true)}>
          QR Code
        </Button>
        <Link to={`/urls/${url.id}/analytics`}>
          <Button variant="secondary" className="px-3 py-1.5 text-xs">
            Analytics
          </Button>
        </Link>
        <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </div>

      <QrModal urlId={url.id} shortCode={url.shortCode} open={showQr} onClose={() => setShowQr(false)} />

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete this URL?">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-800 dark:text-gray-200">/{url.shortCode}</span> and
          its click history will be permanently removed. This cannot be undone.
        </p>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
