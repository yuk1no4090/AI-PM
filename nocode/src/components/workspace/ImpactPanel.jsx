import { UserIcon, BotIcon, LightbulbIcon, HelpCircleIcon } from "lucide-react";
import ImpactAreaCard from "@/components/common/ImpactAreaCard";

const ImpactPanel = () => {
  const impacts = [
    {
      title: "数据模型",
      risk: "high",
      files: ["src/models/order.ts", "src/models/refund.ts"],
      reason: "需新增 partially_refunded 状态，涉及状态机枚举和数据库迁移。",
    },
    {
      title: "API 路由",
      risk: "medium",
      files: ["src/routes/order.ts", "src/routes/refund.ts"],
      reason: "退款接口需支持部分退款金额参数，接口契约变更。",
    },
    {
      title: "业务逻辑",
      risk: "high",
      files: ["src/services/orderService.ts", "src/services/refundService.ts"],
      reason: "退款金额必须小于等于已支付金额，需新增校验逻辑。",
    },
    {
      title: "UI / 展示",
      risk: "low",
      files: ["src/components/OrderStatusBadge.tsx"],
      reason: "前端状态标签需展示新状态文案和颜色。",
    },
    {
      title: "测试",
      risk: "medium",
      files: ["tests/order.test.ts", "tests/refund.test.ts"],
      reason: "需补充部分退款场景的单测和集成测试。",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
          <UserIcon className="h-4 w-4 text-secondary-foreground" />
        </div>
        <div className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground shadow-sm">
          我想添加一个新的订单状态：partially_refunded。可能会影响哪些地方？
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <BotIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm text-sm text-card-foreground leading-relaxed">
            引入 partially_refunded 状态将影响数据模型、业务逻辑、API 契约和前端展示。建议优先评估退款金额校验规则，并补充对应的回归测试。
          </div>

          <div className="grid grid-cols-1 gap-3">
            {impacts.map((item) => (
              <ImpactAreaCard key={item.title} {...item} />
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-3">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <LightbulbIcon className="h-3 w-3" /> 测试建议
            </p>
            <ul className="ml-4 list-disc text-xs text-muted-foreground space-y-1">
              <li>补充部分退款金额边界值测试（等于、大于已支付金额）</li>
              <li>验证状态迁移路径：paid → partially_refunded → refunded</li>
              <li>检查并发场景下重复退款的风险</li>
            </ul>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 shadow-sm space-y-2">
            <p className="text-xs font-medium text-amber-800 flex items-center gap-1">
              <HelpCircleIcon className="h-3 w-3" /> 待确认问题
            </p>
            <ul className="ml-4 list-disc text-xs text-amber-800 space-y-1">
              <li>是否允许对已 partial_refunded 的订单再次退款？</li>
              <li>部分退款后优惠券是否需要按比例退回？</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactPanel;
