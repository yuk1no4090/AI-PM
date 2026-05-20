import { BarChart3Icon, CheckCircleIcon, FileSearchIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const RightInspector = () => {
  return (
    <aside className="w-72 border-l border-border bg-muted/30 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileSearchIcon className="h-4 w-4" /> 证据面板
        </h3>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">检索来源</span>
            <span className="text-foreground font-medium">12 个片段</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">来源文档</span>
            <span className="text-foreground font-medium">3 个文件</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">回答合约</h3>
        {["直接回答", "关键要点", "相关文件", "不确定性声明", "反馈收集"].map((item, i) => (
          <div key={item} className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircleIcon className={`h-3.5 w-3.5 ${i < 4 ? "text-primary" : "text-muted-foreground"}`} />
            {item}
          </div>
        ))}
      </div>

      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3Icon className="h-4 w-4" /> 质量快照
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">引用覆盖率</span>
            <span className="text-foreground font-medium">94%</span>
          </div>
          <Progress value={94} className="h-1.5" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">好评率</span>
            <span className="text-foreground font-medium">87%</span>
          </div>
          <Progress value={87} className="h-1.5" />
        </div>
      </div>
    </aside>
  );
};

export default RightInspector;
