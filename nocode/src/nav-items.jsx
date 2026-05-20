import { HomeIcon, UploadIcon, LayoutDashboardIcon, BrainCircuitIcon, BarChart3Icon } from "lucide-react";
import Index from "./pages/Index.jsx";
import ImportRepo from "./pages/ImportRepo.jsx";
import Overview from "./pages/Overview.jsx";
import Workspace from "./pages/Workspace.jsx";
import Evaluation from "./pages/Evaluation.jsx";

export const navItems = [
  {
    title: "首页",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "导入仓库",
    to: "/import",
    icon: <UploadIcon className="h-4 w-4" />,
    page: <ImportRepo />,
  },
  {
    title: "项目概览",
    to: "/overview",
    icon: <LayoutDashboardIcon className="h-4 w-4" />,
    page: <Overview />,
  },
  {
    title: "工作台",
    to: "/workspace",
    icon: <BrainCircuitIcon className="h-4 w-4" />,
    page: <Workspace />,
  },
  {
    title: "评估指标",
    to: "/evaluation",
    icon: <BarChart3Icon className="h-4 w-4" />,
    page: <Evaluation />,
  },
];
