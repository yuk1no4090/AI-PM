import { ThumbsUpIcon, ThumbsDownIcon, AlertOctagonIcon, QuoteIcon, MehIcon } from "lucide-react";

const FeedbackButtons = () => {
  const buttons = [
    { label: "有帮助", icon: ThumbsUpIcon },
    { label: "无帮助", icon: ThumbsDownIcon },
    { label: "不准确", icon: AlertOctagonIcon },
    { label: "缺少引用", icon: QuoteIcon },
    { label: "过于笼统", icon: MehIcon },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <btn.icon className="h-3 w-3" />
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default FeedbackButtons;
