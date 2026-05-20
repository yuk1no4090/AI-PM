import { FileCodeIcon } from "lucide-react";

const CitationChip = ({ path, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-mono text-foreground hover:bg-muted transition-colors"
    >
      <FileCodeIcon className="h-3 w-3 text-muted-foreground" />
      <span className="truncate max-w-[200px]">{path}</span>
    </button>
  );
};

export default CitationChip;
