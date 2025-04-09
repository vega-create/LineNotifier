import { useState } from "react";
import MessageForm from "../components/MessageForm";
import ScheduleList from "../components/ScheduleList";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Group, Template, Message } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  
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
      <MessageForm 
        groups={groups} 
        templates={templates}
        onSuccess={() => {
          toast({
            title: "訊息已排程",
            description: "您的訊息已成功排程，將於指定時間發送。",
          });
        }}
      />
      
      <ScheduleList messages={messages} groups={groups} />
    </div>
  );
}
