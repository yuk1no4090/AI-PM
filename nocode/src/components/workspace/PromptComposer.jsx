import { useState } from "react";
import { SendIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const PromptComposer = () => {
  const [text, setText] = useState("");

  return (
    <div className="sticky bottom-0 border-t border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2">
        {["基于仓库上下文", "优先匹配片段", "强制引用来源"].map((chip) => (
          <span key={chip} className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {chip}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          placeholder="向 Copilot 提问..."
          className="min-h-[64px] resize-none text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button size="icon" className="shrink-0 h-auto bg-primary hover:bg-primary/90">
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PromptComposer;
