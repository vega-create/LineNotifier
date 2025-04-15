import { useState, useEffect } from "react";
import MessageForm from "../components/MessageForm";
import ScheduleList from "../components/ScheduleList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Group, Template, Message } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 設置自動刷新定時器
  useEffect(() => {
    // 創建一個定時器，每5秒刷新一次訊息數據
    const refreshInterval = setInterval(() => {
      // 重新獲取訊息數據
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      console.log("自動刷新排程清單...");
    }, 5000); // 5秒刷新一次
    
    // 組件卸載時清除定時器
    return () => clearInterval(refreshInterval);
  }, [queryClient]);
  
  // Fetch groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Fetch templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  // Fetch messages (for schedule list)
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    // 啟用自動背景刷新（不顯示加載狀態）
    refetchInterval: 5000,
  });

  // If any data is still loading, show loading state
  if (isLoadingGroups || isLoadingTemplates || isLoadingMessages) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">資料載入中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If there's an error with the data, show error
  if (!groups || !templates || !messages) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="h-80 flex items-center justify-center">
              <p className="text-red-500">載入資料時發生錯誤，請重新整理頁面。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium text-blue-800">群組ID查詢功能</h3>
            <p className="text-sm text-blue-700">
              現在您可以直接在LINE群組中查詢群組ID！只需在任何LINE群組中輸入以下命令：
            </p>
            <div className="bg-white p-3 rounded border border-blue-200 font-mono text-sm">
              查群組ID
            </div>
            <p className="text-sm text-blue-700">
              機器人將直接回覆該群組的ID，您可以複製並在此系統中使用。
            </p>
          </div>
        </CardContent>
      </Card>
      
      <MessageForm 
        groups={groups} 
        templates={templates}
        onSuccess={() => {
          toast({
            title: "訊息排程成功",
            description: "您的訊息將在指定的時間準確推播，而非立即發送。",
          });
        }}
      />
      
      <ScheduleList messages={messages} groups={groups} />
    </div>
  );
}
