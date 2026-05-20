import { LightbulbIcon, FileTextIcon, HelpCircleIcon } from "lucide-react";
import CitationChip from "./CitationChip";
import FeedbackButtons from "./FeedbackButtons";

const AnswerCard = ({ answer, points, files, uncertainty, suggestions }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="text-sm leading-relaxed text-card-foreground">{answer}</div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <LightbulbIcon className="h-3 w-3" /> 关键要点
        </p>
        <ul className="ml-4 list-disc text-xs text-muted-foreground space-y-1">
          {points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <FileTextIcon className="h-3 w-3" /> 相关文件
        </p>
        <div className="flex flex-wrap gap-2">
          {files.map((f) => <CitationChip key={f} path={f} />)}
        </div>
      </div>

      {uncertainty && (
        <div className="rounded-md bg-amber-50 border border-amber-100 p-2.5 flex gap-2 items-start">
          <HelpCircleIcon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">{uncertainty}</p>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">建议后续问题</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} className="text-xs rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground hover:bg-secondary/80 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <FeedbackButtons />
      </div>
    </div>
  );
};

export default AnswerCard;
