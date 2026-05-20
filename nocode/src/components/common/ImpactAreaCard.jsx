import { FileCodeIcon } from "lucide-react";
import RiskBadge from "./RiskBadge";
import CitationChip from "./CitationChip";

const ImpactAreaCard = ({ title, risk, files, reason }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
        <RiskBadge level={risk} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
      <div className="flex flex-wrap gap-2">
        {files.map((f) => <CitationChip key={f} path={f} />)}
      </div>
    </div>
  );
};

export default ImpactAreaCard;
