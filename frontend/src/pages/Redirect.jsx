import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import Spinner from "@/components/ui/Spinner";

export default function Redirect() {
  const { shortCode } = useParams();
  const [error] = useState("");

  useEffect(() => {
    if (!shortCode) return;

    // Resolve backend API URL
    // In axiosClient.defaults.baseURL we have the absolute backend URL,
    // e.g. https://url-shortener-api.onrender.com or empty string.
    const apiBaseUrl = axiosClient.defaults.baseURL || "";
    
    // Construct target URL to backend's HTTP redirection endpoint.
    // In dev mode (Vite proxy): apiBaseUrl is empty, so we redirect to "/shortCode",
    // which triggers Vite dev server's proxy configuration.
    // In production (Vercel): apiBaseUrl is the absolute Render API URL,
    // so we redirect to "https://api.onrender.com/shortCode".
    const targetUrl = apiBaseUrl
      ? `${apiBaseUrl.replace(/\/+$/, "")}/${shortCode}`
      : `/${shortCode}`;

    // Perform browser-level navigation to the backend redirect route
    window.location.replace(targetUrl);
  }, [shortCode]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white px-4">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-2">Redirection failed</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center animate-pulse">
            <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <Spinner className="h-5 w-5 text-indigo-500" />
          <p className="text-sm text-gray-400">Redirecting you to your destination...</p>
        </div>
      )}
    </div>
  );
}
