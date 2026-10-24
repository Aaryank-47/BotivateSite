import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export const Button = ({ children, onClick, disabled, className, ...props }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
        {...props}
    >
        {children}
    </button>
);

export const getPriorityColor = (priority) => {
    switch (priority) {
        case "High":
            return "bg-red-100 text-red-800";
        case "Medium":
            return "bg-yellow-100 text-yellow-800";
        case "Low":
            return "bg-green-100 text-green-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

export const getStatusBadgeClass = (task) => {
    if (task.status1?.includes("completed by")) return "bg-green-100 text-green-800";
    if (task.status1?.includes("forward2")) return "bg-purple-100 text-purple-800";
    if (task.status1?.includes("forward1")) return "bg-blue-100 text-blue-800";
    if (task.status === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
};

export const getStatusText = (task) => {
    return task.status1 || task.status || "Not Started";
};

export const LoadingState = ({ masterSheetLoading }) => (
    <div className="py-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-1">
                <h3 className="text-base font-medium text-gray-900">
                    {masterSheetLoading ? "Loading..." : "Loading Tasks..."}
                </h3>
                <div className="w-32 h-1 overflow-hidden bg-gray-200 rounded-full">
                    <div className="w-full h-full bg-blue-600 rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    </div>
);

export const ErrorState = ({ error }) => (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-red-800">Error: {error}</span>
        </div>
    </div>
);
