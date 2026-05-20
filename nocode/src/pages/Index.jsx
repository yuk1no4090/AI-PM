import { ArrowRightIcon, GithubIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <ZapIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">AI Developer Onboarding Copilot</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link to="/workspace" className="hover:text-foreground transition-colors">工作台</Link>
          <Link to="/evaluation" className="hover:text-foreground transition-colors">评估指标</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">基于证据的仓库入职引导</h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground leading-relaxed">
            导入仓库，查看项目地图，提出基于事实的问题，分析变更影响，并衡量回答质量。
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild>
              <Link to="/workspace">
                启动示例工作空间 <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/import">
                <GithubIcon className="mr-1.5 h-4 w-4" /> 导入仓库
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-1 shadow-sm">
          <div className="flex h-[420px] rounded-lg border border-border overflow-hidden">
            <div className="w-48 border-r border-border bg-muted/40 p-3 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground mb-2">导航</div>
              {["概览", "Q&A", "影响分析", "评估"].map((item) => (
                <div key={item} className="rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-muted cursor-pointer">
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Sample Commerce API</h3>
                <div className="flex gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">Node.js</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">TypeScript</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "已解析文件", value: "142" },
                  { label: "已索引片段", value: "2,860" },
                  { label: "引用覆盖率", value: "94%" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-lg font-semibold">{m.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground">证据片段</p>
                {["src/services/orderService.ts", "src/routes/auth.ts", "src/models/order.ts"].map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-[11px] font-mono text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
