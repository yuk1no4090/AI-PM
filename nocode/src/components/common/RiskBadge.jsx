import { AlertTriangleIcon, ShieldCheckIcon, AlertCircleIcon } from "lucide-react";

const riskConfig = {
  low: { label: "低风险", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheckIcon },
  medium: { label: "中风险", className: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircleIcon },
  high: { label: "高风险", className: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangleIcon },
};

const RiskBadge = ({ level }) => {
  const config = riskConfig[level] || riskConfig.medium;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

export default RiskBadge;
