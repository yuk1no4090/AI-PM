import { HardDriveIcon, MessageSquareIcon, FileIcon } from "lucide-react";

const LeftSidebar = () => {
  const questions = [
    "解释用户认证流程。",
    "核心业务模块有哪些？",
    "订单创建逻辑在哪里？",
  ];

  const rules = [
    "基于仓库上下文回答",
    "为论断引用文件路径",
    "证据不足时标注不确定性",
  ];

  const files = [
    "src/services/orderService.ts",
    "src/routes/order.ts",
    "src/models/order.ts",
    "tests/order.test.ts",
  ];

  return (
    <aside className="w-64 border-r border-border bg-muted/30 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HardDriveIcon className="h-4 w-4" />
          当前工作空间
        </div>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Sample Commerce API — 电商后端 API，包含用户、订单、支付、优惠券等核心模块。
        </p>
        <div className="mt-3 flex gap-3 text-[11px] text-muted-foreground">
          <span>文件: 142</span>
          <span>片段: 2,860</span>
        </div>
      </div>

      <div className="p-4 border-b border-border space-y-3">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <MessageSquareIcon className="h-3 w-3" /> 推荐问题
        </p>
        {questions.map((q) => (
          <button key={q} className="block w-full text-left text-xs text-foreground hover:text-primary transition-colors leading-relaxed">
            {q}
          </button>
        ))}
      </div>

      <div className="p-4 border-b border-border space-y-2">
        <p className="text-xs font-medium text-muted-foreground">质量规则</p>
        {rules.map((r) => (
          <div key={r} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
            <span className="text-xs text-muted-foreground">{r}</span>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <FileIcon className="h-3 w-3" /> 文件列表
        </p>
        {files.map((f) => (
          <div key={f} className="text-xs font-mono text-muted-foreground truncate hover:text-foreground cursor-pointer transition-colors">
            {f}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default LeftSidebar;
