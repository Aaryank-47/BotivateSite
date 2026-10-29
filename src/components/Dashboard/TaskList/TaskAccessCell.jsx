import React, { useState } from "react";
import { ExternalLink, GitBranch, Copy, Check, Eye, EyeOff } from "lucide-react";

export function CopyButton({ text, label = "" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : `Copy ${label}`}
      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition shrink-0"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600" />
      ) : (
        <Copy className="w-3 h-3 text-slate-500" />
      )}
    </button>
  );
}

export function TaskAccessCell({ task }) {
  const appLink = task.linkOfSystem || "";
  const gitLink = task.githubLink || "";
  const loginId = task.systemLoginId || "";
  const password = task.systemPassword || "";
  const [showPassword, setShowPassword] = useState(false);

  const hasCredentials = Boolean(loginId || password);
  const hasLinks = Boolean(appLink || gitLink);

  if (!hasLinks && !hasCredentials) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1.5 py-1 text-xs w-full min-w-[190px] max-w-[240px] mx-auto">
      {hasLinks && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {appLink ? (
            <a
              href={appLink}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open App: ${appLink}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 rounded-md border border-blue-200 shadow-2xs transition"
            >
              <ExternalLink className="w-3 h-3 text-blue-600 shrink-0" />
              <span>App Link</span>
            </a>
          ) : null}

          {gitLink ? (
            <a
              href={gitLink}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open Git: ${gitLink}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-md border border-slate-300 shadow-2xs transition"
            >
              <GitBranch className="w-3 h-3 text-slate-600 shrink-0" />
              <span>Git Link</span>
            </a>
          ) : null}
        </div>
      )}

      {hasCredentials && (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-left font-mono space-y-1 shadow-2xs">
          {loginId && (
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                ID:
              </span>
              <span
                className="font-semibold text-slate-900 truncate select-all mx-1"
                title={loginId}
              >
                {loginId}
              </span>
              <CopyButton text={loginId} label="ID" />
            </div>
          )}
          {password && (
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                Pass:
              </span>
              <span
                className="font-semibold text-slate-900 truncate select-all mx-1"
                title={password}
              >
                {showPassword ? password : "••••••••"}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-3 h-3 text-slate-600" />
                  ) : (
                    <Eye className="w-3 h-3 text-slate-500" />
                  )}
                </button>
                <CopyButton text={password} label="Password" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default TaskAccessCell;

