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

export default function ScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  
  // Fetch groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Fetch messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold flex items-center">
              <i className="fas fa-calendar-alt mr-2 text-primary"></i> 排程管理
            </CardTitle>
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
        </CardHeader>
        <CardContent>
          {view === "calendar" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={zhTW}
                  className="border rounded-md p-3"
                />
                <div className="mt-4 text-sm text-gray-600">
                  {selectedDate ? (
                    <p>已選擇日期: {format(selectedDate, "yyyy/MM/dd")}</p>
                  ) : (
                    <p>請選擇日期</p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="font-medium text-lg mb-4">當日排程</h3>
                {filteredMessages && filteredMessages.length > 0 ? (
                  <ScheduleList messages={filteredMessages} groups={groups} hideTitle compact />
                ) : (
                  <div className="border rounded-md p-6 text-center text-gray-500">
                    <p>選擇的日期沒有排程訊息</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ScheduleList messages={messages} groups={groups} hideTitle />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
