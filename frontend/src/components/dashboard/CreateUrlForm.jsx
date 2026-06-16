import { useState } from "react";
import { createShortUrl } from "@/api/urls";
import { useToast } from "@/hooks/useToast";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// Create-URL form. On success it calls onCreated() so the parent can refetch the
// list and stats, then surfaces the freshly minted short URL inline.
export default function CreateUrlForm({ onCreated }) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      const payload = { url: url.trim() };
      if (customAlias.trim()) payload.customAlias = customAlias.trim();
      const created = await createShortUrl(payload);
      setResult(created);
      setUrl("");
      setCustomAlias("");
      toast("Short URL created", "success");
      onCreated?.(); // refresh list + stats in the parent
    } catch (err) {
      // Backend returns alias suggestions on a 409 conflict.
      const suggestions = err.raw?.response?.data?.suggestions;
      setError(
        suggestions?.length
          ? `${err.message}. Try: ${suggestions.join(", ")}`
          : err.message || "Could not shorten URL"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold">Shorten a URL</h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            id="url"
            type="url"
            placeholder="https://example.com/very/long/link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="sm:w-40">
          <Input
            id="customAlias"
            placeholder="custom-alias (optional)"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
          />
        </div>
        <Button type="submit" loading={loading} className="sm:mt-0">
          Shorten
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm dark:bg-indigo-950/40">
          <span className="text-gray-500">Short URL: </span>
          <a
            href={result.shortUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {result.shortUrl}
          </a>
        </div>
      )}
    </Card>
  );
}
