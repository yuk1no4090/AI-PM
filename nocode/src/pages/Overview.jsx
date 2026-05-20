import { FileCodeIcon, FolderTreeIcon, BookOpenIcon, CompassIcon, DatabaseIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Overview = () => {
  const techStack = ["Node.js", "TypeScript", "React", "Express", "PostgreSQL"];
  const modules = ["认证", "用户", "订单", "支付", "退款", "优惠券", "测试"];
  const reads = ["README.md", "src/routes/auth.ts", "src/routes/order.ts", "src/services/orderService.ts", "src/services/paymentService.ts"];
  const actions = ["解释架构", "查找订单逻辑", "生成入职计划"];
  const evidence = [
    { label: "可检索片段", value: "2,860" },
    { label: "文档", value: "12" },
    { label: "源文件", value: "142" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">仓库概览</p>
            <h1 className="text-2xl font-bold tracking-tight">Sample Commerce API</h1>
          </div>
          <Button size="sm" asChild>
            <Link to="/workspace">进入工作台</Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">项目摘要</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                一个完整的电商后端 API 项目，涵盖用户认证、商品订单、支付结算、优惠券与退款管理。采用分层架构，路由-服务-模型分离，包含完整的单元测试与集成测试。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {techStack.map((t) => (
                <span key={t} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <span key={m} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{m}</span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <DatabaseIcon className="h-4 w-4" /> 证据索引
            </h3>
            {evidence.map((e) => (
              <div key={e.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{e.label}</span>
                <span className="font-medium text-foreground">{e.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FolderTreeIcon className="h-4 w-4" /> 目录树
            </h3>
            <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
              <div>src/</div>
              <div className="pl-3">routes/</div>
              <div className="pl-3">services/</div>
              <div className="pl-3">models/</div>
              <div className="pl-3">middleware/</div>
              <div>tests/</div>
              <div>docs/</div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4" /> 推荐阅读
            </h3>
            <div className="space-y-2">
              {reads.map((r) => (
                <div key={r} className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <FileCodeIcon className="h-3 w-3" />
                  {r}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CompassIcon className="h-4 w-4" /> 下一步操作
            </h3>
            <div className="space-y-2">
              {actions.map((a) => (
                <Link key={a} to="/workspace" className="block rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                  {a}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
