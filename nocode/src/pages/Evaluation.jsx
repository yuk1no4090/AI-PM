import { MessageSquareIcon, ThumbsUpIcon, QuoteIcon, AlertTriangleIcon, TrendingDownIcon, LightbulbIcon } from "lucide-react";
import MetricCard from "@/components/common/MetricCard";

const Evaluation = () => {
  const metrics = [
    { label: "总问题数", value: "1,248", icon: MessageSquareIcon },
    { label: "好评率", value: "87.2%", trend: "较上周 +2.4%", icon: ThumbsUpIcon },
    { label: "引用覆盖率", value: "94.0%", trend: "目标 ≥ 90%", icon: QuoteIcon },
    { label: "不确定回答率", value: "6.8%", trend: "较上周 -1.1%", icon: AlertTriangleIcon },
    { label: "负面反馈率", value: "4.5%", trend: "需关注", icon: TrendingDownIcon },
    { label: "高风险问题", value: "23", trend: "本周新增 3 个", icon: AlertTriangleIcon },
  ];

  const failures = [
    { reason: "缺少引用", count: 42, pct: "35%" },
    { reason: "过于笼统", count: 38, pct: "32%" },
    { reason: "回答不准确", count: 28, pct: "23%" },
    { reason: "其他", count: 12, pct: "10%" },
  ];

  const feedbacks = [
    { content: "订单状态机的解释很清晰，但缺少 tests/order.test.ts 的引用。", type: "建设性", time: "2 小时前" },
    { content: "退款逻辑的回答没有找到关键文件 src/services/refundService.ts。", type: "负面", time: "5 小时前" },
    { content: "入职计划生成得很实用，直接列出了需要阅读的核心文件。", type: "正面", time: "1 天前" },
  ];

  const signals = [
    { text: "引用覆盖率低 → 改进检索与引用校验逻辑", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { text: "不确定率高 → 改进文档解析与补充缺失内容", color: "text-rose-700 bg-rose-50 border-rose-200" },
    { text: "笼统反馈多 → 强制要求引用具体文件与函数", color: "text-sky-700 bg-sky-50 border-sky-200" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">AI 质量与反馈指标</h1>
        <p className="mt-2 text-sm text-muted-foreground">基于真实用户反馈衡量 Copilot 回答质量，驱动产品迭代。</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground">主要失败原因</h3>
            <div className="space-y-3">
              {failures.map((f) => (
                <div key={f.reason} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{f.reason}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: f.pct }} />
                    </div>
                    <span className="text-xs font-medium text-foreground w-8 text-right">{f.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground">最近反馈</h3>
            <div className="space-y-3">
              {feedbacks.map((fb, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-card-foreground leading-relaxed">{fb.content}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{fb.type}</span>
                    <span className="text-[10px] text-muted-foreground">{fb.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <LightbulbIcon className="h-4 w-4" /> 产品迭代信号
            </h3>
            <div className="space-y-2">
              {signals.map((s, i) => (
                <div key={i} className={`rounded-md border px-3 py-2 text-xs leading-relaxed ${s.color}`}>
                  {s.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Evaluation;
