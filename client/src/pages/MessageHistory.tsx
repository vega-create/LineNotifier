import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Group, Message } from "@shared/schema";
import { format } from "date-fns";
import { 
  Copy as CopyIcon, 
  Trash2 as TrashIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MessageHistory() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Fetch groups
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Fetch messages
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const handleDeleteMessage = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/messages/${id}`);
      
      toast({
        title: "訊息已刪除",
        description: "訊息已成功從系統中刪除。",
      });
      
      // Invalidate messages cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: "刪除訊息時發生錯誤，請再試一次。",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateMessage = async (message: Message) => {
    try {
      const { id, createdAt, status, ...messageData } = message;
      
      // Create a new message with the same data
      await apiRequest("POST", "/api/messages", {
        ...messageData,
        status: "scheduled"
      });
      
      toast({
        title: "訊息已複製",
        description: "訊息已成功複製並加入排程。",
      });
      
      // Invalidate messages cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    } catch (error) {
      toast({
        title: "複製失敗",
        description: "複製訊息時發生錯誤，請再試一次。",
        variant: "destructive",
      });
    }
  };

  // Sort messages by scheduled time (newest first)
  const sortedMessages = messages ? 
    [...messages].sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()) : 
    [];

  // Paginate messages
  const paginatedMessages = sortedMessages.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sortedMessages.length / pageSize);

  const getGroupNames = (groupIds: string[]) => {
    if (!groups) return "";
    
    return groupIds
      .map(id => {
        const group = groups.find(g => g.id.toString() === id);
        return group ? group.name : "";
      })
      .filter(Boolean)
      .join(", ");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">排程中</Badge>;
      case "sent":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">已發送</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">失敗</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <i className="fas fa-history mr-2 text-primary"></i> 訊息歷史記錄
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-medium">日期時間</TableHead>
                <TableHead className="font-medium">訊息類型</TableHead>
                <TableHead className="font-medium">發送對象</TableHead>
                <TableHead className="font-medium">訊息內容</TableHead>
                <TableHead className="font-medium">狀態</TableHead>
                <TableHead className="text-center font-medium">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMessages.length > 0 ? (
                paginatedMessages.map((message) => (
                  <TableRow key={message.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="py-3">
                      {format(new Date(message.scheduledTime), "yyyy/MM/dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>{message.title}</TableCell>
                    <TableCell>{getGroupNames(message.groupIds)}</TableCell>
                    <TableCell className="truncate max-w-xs">{message.content}</TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicateMessage(message)}
                          title="複製訊息"
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMessage(message.id)}
                          title="刪除訊息"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    沒有找到訊息記錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
