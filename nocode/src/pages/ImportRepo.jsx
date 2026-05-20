import { useState } from "react";
import { GithubIcon, UploadIcon, Loader2Icon, CheckCircleIcon, FileArchiveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const steps = [
  { label: "正在上传", desc: "接收仓库文件" },
  { label: "解析文件", desc: "提取代码结构与文档" },
  { label: "创建检索索引", desc: "构建向量检索片段" },
  { label: "生成项目摘要", desc: "总结模块与依赖关系" },
  { label: "就绪", desc: "工作空间准备完成" },
];

const ImportRepo = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setStepIndex(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i >= steps.length) {
        clearInterval(interval);
        setAnalyzing(false);
        setStepIndex(steps.length - 1);
      } else {
        setStepIndex(i);
      }
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight">创建仓库工作空间</h1>
        <p className="mt-2 text-sm text-muted-foreground">导入 GitHub 仓库或上传 ZIP 文件，开始 AI 分析。</p>

        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            <Input placeholder="https://github.com/username/repo" className="flex-1 text-sm" />
            <Button variant="outline" size="icon">
              <GithubIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8">
            <div className="text-center space-y-2">
              <FileArchiveIcon className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">拖拽 ZIP 文件到此处，或点击上传</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing && <Loader2Icon className="mr-1.5 h-4 w-4 animate-spin" />}
              分析仓库
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/overview">使用示例仓库</Link>
            </Button>
          </div>
        </div>

        {analyzing && (
          <div className="mt-8 rounded-lg border border-border bg-card p-4 space-y-3">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${i <= stepIndex ? "border-primary bg-primary/10" : "border-border"}`}>
                  {i < stepIndex ? <CheckCircleIcon className="h-3 w-3 text-primary" /> : <span className="text-[10px]">{i + 1}</span>}
                </div>
                <div>
                  <p className={`text-xs font-medium ${i <= stepIndex ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { title: "安全护栏", desc: "所有回答必须附带引用的源文件" },
            { title: "精准检索", desc: "Top 片段包含文件路径与行号范围" },
            { title: "度量闭环", desc: "用户反馈驱动评估仪表迭代" },
          ].map((card) => (
            <div key={card.title} className="rounded-lg border border-border bg-card p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">{card.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImportRepo;

