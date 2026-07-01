import { useState, useEffect } from "react";
import { getUrlQrCode, getUrlQrCodeBlob } from "@/api/urls";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";

const FORMATS = ["png", "svg", "json"];

export default function QrModal({ urlId, shortCode, open, onClose }) {
  const [format, setFormat] = useState("png");
  const [size, setSize] = useState(300);
  const [color, setColor] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [margin, setMargin] = useState(2);
  const [logo, setLogo] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [shortUrl, setShortUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    setImgSrc(null);

    const params = {};
    if (format !== "json") params.format = format;
    if (size !== 300) params.size = size;
    if (color !== "#000000") params.color = color;
    if (bg !== "#ffffff") params.bg = bg;
    if (margin !== 2) params.margin = margin;
    if (logo) params.logo = "true";

    if (format === "json") {
      getUrlQrCode(urlId, params)
        .then((data) => {
          if (!active) return;
          setImgSrc(data.qrCode);
          setShortUrl(data.shortUrl);
        })
        .catch((err) => active && setError(err.message || "Failed to load QR code"))
        .finally(() => active && setLoading(false));
    } else {
      getUrlQrCodeBlob(urlId, params)
        .then((blob) => {
          if (!active) return;
          setImgSrc(URL.createObjectURL(blob));
          setShortUrl(`${window.location.origin}/${shortCode}`);
        })
        .catch((err) => active && setError(err.message || "Failed to load QR code"))
        .finally(() => active && setLoading(false));
    }

    return () => { active = false; };
  }, [open, urlId, shortCode, format, size, color, bg, margin, logo]);

  // Revoke object URLs on unmount / re-render to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imgSrc && imgSrc.startsWith("blob:")) URL.revokeObjectURL(imgSrc);
    };
  }, [imgSrc]);

  const handleDownload = () => {
    if (format === "json") {
      const a = document.createElement("a");
      a.href = imgSrc;
      a.download = `qr-${shortCode}.png`;
      a.click();
    } else {
      getUrlQrCodeBlob(urlId, { format, size, color, bg, margin, logo }).then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `qr-${shortCode}.${format}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`QR Code · /${shortCode}`} size="md">
      <div className="flex flex-col items-center gap-5">
        <div className="w-full grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Format</label>
            <div className="flex gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all uppercase ${
                    format === f
                      ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-300"
                      : "border-white/10 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Size: {size}px</label>
            <input
              type="range"
              min="100"
              max="1000"
              step="10"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-full rounded-lg border border-white/10 bg-transparent cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Background</label>
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-8 w-full rounded-lg border border-white/10 bg-transparent cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Margin: {margin}</label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={logo}
                onChange={(e) => setLogo(e.target.checked)}
                className="rounded border-white/20 bg-white/5 accent-indigo-500"
              />
              <span className="text-xs text-gray-400">Overlay avatar</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 p-3 bg-white">
          {loading && <Skeleton className="h-48 w-48" />}
          {!loading && error && (
            <p className="text-sm text-red-400 text-center h-48 flex items-center justify-center">{error}</p>
          )}
          {!loading && !error && imgSrc && (
            <img src={imgSrc} alt={`QR code for ${shortCode}`} className="h-48 w-48 rounded-xl" />
          )}
        </div>

        {imgSrc && (
          <>
            <p className="text-xs text-gray-400 text-center max-w-[200px] truncate">
              {shortUrl || `${window.location.origin}/${shortCode}`}
            </p>
            <button
              onClick={handleDownload}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/30 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {format.toUpperCase()}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
