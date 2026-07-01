import { useState } from "react";
import { Link } from "react-router-dom";
import { deleteUrl as deleteUrlRequest, updateOriginalUrl } from "@/api/urls";
import { useClipboard } from "@/hooks/useClipboard";
import { useToast } from "@/hooks/useToast";
import { formatDate, truncate } from "@/utils/format";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import QrModal from "@/components/url/QrModal";

const AVATARS = [
  "bg-indigo-500/10 text-indigo-400",
  "bg-emerald-500/10 text-emerald-400",
  "bg-amber-500/10 text-amber-400",
  "bg-pink-500/10 text-pink-400",
  "bg-sky-500/10 text-sky-400",
  "bg-lime-500/10 text-lime-400",
];
const avatarStyle = (code = "") =>
  AVATARS[code.charCodeAt(0) % AVATARS.length];

export default function UrlCard({ url, onDeleted }) {
  const { copied, copy } = useClipboard();
  const { toast } = useToast();
  const [showQr, setShowQr] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUrl, setEditUrl] = useState(url.originalUrl);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleCopy = async () => {
    const ok = await copy(url.shortUrl);
    toast(ok ? "Copied to clipboard!" : "Copy failed", ok ? "success" : "error");
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteUrlRequest(url.id);
      setConfirmOpen(false);
      toast(`/${url.shortCode} deleted`, "success");
      onDeleted?.(url.id);
    } catch (err) {
      setError(err.message || "Delete failed");
      toast("Failed to delete URL", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="group rounded-xl border border-white/10 bg-slate-900 p-4 sm:p-5 transition-all">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${avatarStyle(url.shortCode)} flex items-center justify-center font-black text-sm`}>
            {url.shortCode?.charAt(0)?.toUpperCase() || "S"}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <a
                  href={url.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-indigo-400 hover:underline text-sm truncate block"
                >
                  {url.shortUrl}
                </a>
                <p className="text-xs text-gray-400 mt-0.5 truncate" title={url.originalUrl}>
                  {truncate(url.originalUrl, 72)}
                </p>
              </div>
              {/* Stats */}
              <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0.5">
                <span className="text-sm font-black text-white">{url.clicks}</span>
                <span className="text-xs text-gray-400 sm:mt-0 ml-1 sm:ml-0">
                  {url.clicks === 1 ? "click" : "clicks"}
                </span>
                <span className="hidden sm:block text-xs text-gray-400">{formatDate(url.createdAt)}</span>
              </div>
            </div>

            {/* Created date — mobile */}
            <p className="sm:hidden text-xs text-gray-400 mt-1">{formatDate(url.createdAt)}</p>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  copied
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>

              <button
                onClick={() => setShowQr(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR Code
              </button>

              <button
                onClick={() => { setEditUrl(url.originalUrl); setEditOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>

              <Link
                to={`/urls/${url.id}/analytics`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Link>

              <button
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <QrModal urlId={url.id} shortCode={url.shortCode} open={showQr} onClose={() => setShowQr(false)} />

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete this link?">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">/{url.shortCode}</span> and its
          click history will be permanently removed. This action cannot be undone.
        </p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
