import { useState } from "react";
import { Button } from "@/components/ui/button";
import OnboardingDayCard from "@/components/common/OnboardingDayCard";

const OnboardingPanel = () => {
  const [role, setRole] = useState("Backend Engineer");
  const [duration, setDuration] = useState("5 天");

  const roles = ["后端工程师", "前端工程师", "产品经理", "QA"];
  const durations = ["3 天", "5 天"];

  const days = [
    {
      day: "D1",
      focus: "了解项目背景与技术栈",
      files: ["README.md", "package.json", "tsconfig.json"],
      tasks: ["阅读 README，了解项目目标", "梳理依赖关系与构建流程", "确认本地环境能否正常运行"],
    },
    {
      day: "D2",
      focus: "理解核心业务流",
      files: ["src/routes/auth.ts", "src/routes/order.ts", "src/services/orderService.ts"],
      tasks: ["梳理用户注册与登录链路", "理解订单创建到支付的完整流程", "标注关键业务规则与状态机"],
    },
    {
      day: "D3",
      focus: "深入关键模块",
      files: ["src/services/paymentService.ts", "src/models/order.ts", "tests/order.test.ts"],
      tasks: ["阅读支付服务实现", "理解数据模型设计", "对照测试用例验证业务规则"],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">角色</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-3 py-1.5 text-xs transition-colors ${role === r ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">周期</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-3 py-1.5 text-xs transition-colors ${duration === d ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" className="text-xs">生成计划</Button>
      </div>

      <div className="relative border-l border-border ml-3 space-y-6 pl-6">
        {days.map((d, i) => (
          <div key={i} className="relative">
            <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-border">
              <span className="h-2 w-2 rounded-full bg-primary" />
            </span>
            <OnboardingDayCard {...d} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingPanel;
