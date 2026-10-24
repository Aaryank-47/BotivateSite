"use client";

import { AlertCircle } from "lucide-react";

export const LoadingIndicator = ({ message }) => (
  <div className="space-y-4 animate-in fade-in duration-300">
    {message && (
      <p className="text-sm text-gray-500 font-medium px-1">{message}</p>
    )}
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-50 flex gap-3">
        <div className="h-9 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-9 flex-1 max-w-xs bg-gray-50 rounded-lg animate-pulse ml-auto" />
      </div>
      <div className="divide-y divide-gray-50">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3.5">
            <div className="h-4 w-4 bg-gray-100 rounded animate-pulse shrink-0" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse hidden sm:block" />
            <div className="h-4 flex-1 max-w-[140px] bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse hidden md:block" />
            <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-8 w-24 bg-gray-50 rounded-lg animate-pulse hidden lg:block" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ErrorMessage = ({ error }) => (
  <div className="p-4 border border-red-200 rounded-xl bg-red-50">
    <div className="flex items-center space-x-2">
      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
      <span className="text-red-800 text-sm font-medium">Error: {error}</span>
    </div>
  </div>
);
