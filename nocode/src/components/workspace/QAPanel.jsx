import { BotIcon, UserIcon } from "lucide-react";
import AnswerCard from "@/components/common/AnswerCard";

const QAPanel = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BotIcon className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">代码库 Copilot 已就绪</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            基于源代码和文档回答您的问题，所有回答均附带文件引用。
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
            <UserIcon className="h-4 w-4 text-secondary-foreground" />
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground shadow-sm">
            订单创建逻辑在哪里？
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <BotIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <AnswerCard
              answer="订单创建逻辑分布在路由层、服务层和数据模型层。核心入口在 orderService.createOrder()，由 order.ts 路由处理 HTTP 请求。"
              points={[
                "订单路由接收 POST /orders 请求并进行参数校验",
                "orderService.createOrder 处理库存检查、价格计算和优惠券验证",
                "订单状态初始化为 pending，支付成功后迁移为 paid",
                "相关测试覆盖在 tests/order.test.ts",
              ]}
              files={[
                "src/routes/order.ts",
                "src/services/orderService.ts",
                "src/models/order.ts",
                "tests/order.test.ts",
              ]}
              uncertainty="订单退款状态的迁移逻辑在部分分支中缺少注释说明，建议结合实际业务规则确认。"
              suggestions={[
                "支付状态机如何设计？",
                "优惠券校验逻辑在哪里？",
                "库存扣减是否支持回滚？",
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QAPanel;
