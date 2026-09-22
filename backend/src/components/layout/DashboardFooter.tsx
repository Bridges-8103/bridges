'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Copy, Check, Key, ChevronDown, ChevronUp, RefreshCw, Terminal } from 'lucide-react';

export default function DashboardFooter() {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <DevTokenFooterContent />;
}

function DevTokenFooterContent() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'raw' | 'header' | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchToken = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const cToken = await getToken();
      setToken(cToken);
    } catch (err) {
      console.error('[DashboardFooter] Failed to fetch Clerk token:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    let isCancelled = false;

    if (isSignedIn && isLoaded) {
      getToken()
        .then((cToken) => {
          if (!isCancelled) {
            setToken(cToken);
          }
        })
        .catch((err) => {
          console.error('[DashboardFooter] Failed to fetch Clerk token:', err);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [isSignedIn, isLoaded, getToken]);

  const handleCopy = async (type: 'raw' | 'header') => {
    if (!token) return;
    const textToCopy = type === 'header' ? `Bearer ${token}` : token;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <footer className="border-t border-amber-200 bg-amber-50/95 text-slate-800 text-xs px-6 py-3 shrink-0 transition-all">
      {/* Dev Mode Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono">
          <span className="bg-amber-500 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
            DEV ONLY
          </span>
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-700" />
            Clerk Bearer Token
          </span>
          {user && (
            <span className="text-slate-500 hidden md:inline">
              ({user.primaryEmailAddress?.emailAddress || user.id})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchToken}
            disabled={isLoading}
            title="Refresh Token"
            className="p-1 text-slate-600 hover:text-slate-900 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300/70 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Quick Copy Button */}
          <button
            type="button"
            onClick={() => handleCopy('raw')}
            disabled={!token}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition disabled:opacity-50 cursor-pointer"
          >
            {copiedType === 'raw' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Token</span>
              </>
            )}
          </button>

          {/* Copy 'Bearer <token>' Button */}
          <button
            type="button"
            onClick={() => handleCopy('header')}
            disabled={!token}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition disabled:opacity-50 cursor-pointer"
          >
            {copiedType === 'header' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Copied Header!</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5" />
                <span>Copy &quot;Bearer ...&quot;</span>
              </>
            )}
          </button>

          {/* Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? 'Collapse token box' : 'Expand token box'}
            className="p-1 text-slate-600 hover:text-slate-900 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300/70 transition cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Token Display Area */}
      {isExpanded && (
        <div className="mt-2.5">
          {isLoading ? (
            <div className="py-2 text-slate-500 italic">Fetching bearer token...</div>
          ) : token ? (
            <div className="relative group">
              <div className="p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] leading-relaxed break-all select-all border border-slate-700 max-h-24 overflow-y-auto">
                <span className="text-amber-400 select-none">Bearer </span>
                <span>{token}</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                <span>
                  Clerk session Bearer JWT — ready for mobile app, Postman, or /api requests
                </span>
                <span>{token.length} chars</span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-rose-600 italic">
              No token available. Ensure you are signed in.
            </div>
          )}
        </div>
      )}
    </footer>
  );
}
