import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeftSidebar from "@/components/workspace/LeftSidebar";
import RightInspector from "@/components/workspace/RightInspector";
import OnboardingPanel from "@/components/workspace/OnboardingPanel";
import QAPanel from "@/components/workspace/QAPanel";
import ImpactPanel from "@/components/workspace/ImpactPanel";
import PromptComposer from "@/components/workspace/PromptComposer";

const Workspace = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <LeftSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-background px-4 py-2">
          <Tabs defaultValue="onboarding" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="onboarding" className="text-xs">入职计划</TabsTrigger>
              <TabsTrigger value="qa" className="text-xs">Q&A</TabsTrigger>
              <TabsTrigger value="impact" className="text-xs">影响分析</TabsTrigger>
            </TabsList>
            
            <TabsContent value="onboarding" className="flex-1 overflow-hidden mt-0">
              <div className="flex h-[calc(100vh-120px)] overflow-hidden">
                <OnboardingPanel />
              </div>
            </TabsContent>
            
            <TabsContent value="qa" className="flex-1 overflow-hidden mt-0">
              <div className="flex h-[calc(100vh-120px)] overflow-hidden">
                <div className="flex-1 flex flex-col">
                  <QAPanel />
                  <PromptComposer />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="impact" className="flex-1 overflow-hidden mt-0">
              <div className="flex h-[calc(100vh-120px)] overflow-hidden">
                <div className="flex-1 flex flex-col">
                  <ImpactPanel />
                  <PromptComposer />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <RightInspector />
    </div>
  );
};

export default Workspace;
