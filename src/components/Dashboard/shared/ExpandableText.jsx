import React, { useState } from 'react';

const ExpandableText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return <span>-</span>;

    // If text is short, just show it
    if (text.length <= 80 && !text.includes('\n')) {
        return <span className="break-words whitespace-pre-wrap">{text}</span>;
    }

    return (
        <div className="space-y-1">
            <div
                className={`break-words whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""}`}
                style={!isExpanded ? {
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                } : {}}
            >
                {text}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 focus:outline-none hover:underline"
            >
                {isExpanded ? "Show less" : "Read more"}
            </button>
        </div>
    );
};

export default ExpandableText;
