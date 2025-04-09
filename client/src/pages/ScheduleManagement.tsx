import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScheduleList from "../components/ScheduleList";
import { Group, Message } from "@shared/schema";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "react-responsive";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Trash2 } from "lucide-react";

export default function ScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [isClearing, setIsClearing] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const { toast } = useToast();
  
  // Fetch groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Fetch messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Count sent messages
  const sentMessages = messages?.filter(message => message.status === "sent") || [];
  
  // Handle clearing sent messages
  const handleClearSentMessages = async () => {
    if (!confirm("確定要刪除所有已發送的訊息嗎？此操作無法復原。")) return;
    
    setIsClearing(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Process all sent messages in parallel
      await Promise.all(
        sentMessages.map(async (message) => {
          try {
            await apiRequest("DELETE", `/api/messages/${message.id}`);
            successCount++;
          } catch (error) {
            console.error(`Failed to delete message ${message.id}:`, error);
            errorCount++;
          }
        })
      );
      
      // Show success message
      if (successCount > 0) {
        toast({
          title: "清除成功",
          description: `已成功刪除 ${successCount} 條已發送的訊息${errorCount > 0 ? `，${errorCount} 條刪除失敗` : ''}。`,
        });
      } else if (errorCount > 0) {
        toast({
          title: "清除失敗",
          description: `所有訊息刪除失敗，請稍後再試。`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "無訊息可清除",
          description: "沒有找到已發送的訊息。",
        });
      }
      
      // Refresh the message list
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    } catch (error) {
      toast({
        title: "操作失敗",
        description: "清除訊息時發生錯誤，請再試一次。",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const filteredMessages = messages?.filter(message => {
    if (!selectedDate) return true;
    
    const scheduleDate = new Date(message.scheduledTime);
    return (
      scheduleDate.getDate() === selectedDate.getDate() &&
      scheduleDate.getMonth() === selectedDate.getMonth() &&
      scheduleDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // If data is still loading, show loading state
  if (isLoadingGroups || isLoadingMessages) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">資料載入中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If there's an error with the data, show error
  if (!groups || !messages) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center">
            <p className="text-red-500">載入資料時發生錯誤，請重新整理頁面。</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 視圖選擇和操作按鈕 */}
      <div className={`flex ${isMobile ? "flex-col" : "justify-between"} items-center gap-4`}>
        <h1 className="text-2xl font-semibold flex items-center">
          <i className="fas fa-calendar-alt mr-2 text-primary"></i> 排程管理
        </h1>
        
        <div className="flex items-center gap-4">
          {/* 清除已發送訊息按鈕 */}
          {sentMessages.length > 0 && (
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={handleClearSentMessages}
              disabled={isClearing}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              清除已發送訊息 {sentMessages.length > 0 && `(${sentMessages.length})`}
            </Button>
          )}
          
          <Tabs defaultValue="calendar" className="w-auto">
            <TabsList>
              <TabsTrigger 
                value="calendar" 
                onClick={() => setView("calendar")}
                className={view === "calendar" ? "bg-primary text-white" : ""}
              >
                日曆檢視
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                onClick={() => setView("list")}
                className={view === "list" ? "bg-primary text-white" : ""}
              >
                列表檢視
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 日曆視圖 */}
      {view === "calendar" && (
        <div className="grid grid-cols-1 gap-6">
          {/* 日曆區塊 */}
          <Card>
            <CardContent className={isMobile ? "p-4" : "p-6"}>
              <div className="flex justify-center">
                <div className={isMobile ? "w-full" : "w-auto"}>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={zhTW}
                    className={`border rounded-md ${isMobile ? "p-2" : "p-3"} bg-white w-full`}
                  />
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    <p>已選擇日期: {selectedDate ? format(selectedDate, "yyyy/MM/dd") : "未選擇"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 排程列表區塊 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">當日排程</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMessages && filteredMessages.length > 0 ? (
                <ScheduleList messages={filteredMessages} groups={groups} hideTitle compact />
              ) : (
                <div className="border rounded-md p-6 text-center text-gray-500">
                  <p>選擇的日期沒有排程訊息</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 列表視圖 */}
      {view === "list" && (
        <Card>
          <CardContent className="p-6">
            <ScheduleList messages={messages} groups={groups} hideTitle />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
