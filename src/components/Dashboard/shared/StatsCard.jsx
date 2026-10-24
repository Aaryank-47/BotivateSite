"use client";

const StatsCard = ({ title, count, description, icon: Icon, color }) => (
  <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{count}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
      <div
        className={`w-12 h-12 bg-gradient-to-r ${color === "text-orange-600"
          ? "from-orange-500 to-red-600"
          : color === "text-purple-600"
            ? "from-purple-500 to-indigo-600"
            : "from-green-500 to-emerald-600"
          } rounded-lg flex items-center justify-center`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default StatsCard;
