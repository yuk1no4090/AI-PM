import { CalendarIcon, BookOpenIcon, CheckSquareIcon } from "lucide-react";

const OnboardingDayCard = ({ day, focus, files, tasks }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {day}
        </div>
        <h4 className="text-sm font-semibold text-card-foreground">{focus}</h4>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <BookOpenIcon className="h-3 w-3" /> 阅读文件
        </p>
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <span key={f} className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-mono text-foreground">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <CheckSquareIcon className="h-3 w-3" /> 任务
        </p>
        <ul className="ml-4 list-disc text-xs text-muted-foreground space-y-1">
          {tasks.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default OnboardingDayCard;
