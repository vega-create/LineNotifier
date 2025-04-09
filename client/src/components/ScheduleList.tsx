import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Group, Message } from "@shared/schema";
import { format } from "date-fns";
import { 
  Edit as EditIcon, 
  Trash2 as TrashIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ScheduleListProps = {
  messages: Message[];
  groups: Group[];
  hideTitle?: boolean;
  compact?: boolean;
};

export default function ScheduleList({ messages, groups, hideTitle = false, compact = false }: ScheduleListProps) {
  const { toast } = useToast();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Sort messages by scheduled time (newest first) and filter only scheduled ones
  const scheduledMessages = messages
    .filter(message => message.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

  const handleDeleteMessage = async (id: number) => {
    if (!confirm("確定要刪除此排程訊息嗎？")) return;
    
    try {
      await apiRequest("DELETE", `/api/messages/${id}`);
      
      toast({
        title: "訊息已刪除",
        description: "排程訊息已成功刪除。",
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

  const openDetailsDialog = (message: Message) => {
    setSelectedMessage(message);
    setIsDetailsOpen(true);
  };

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

  return (
    <>
      <Card>
        {!hideTitle && (
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <i className="fas fa-list-alt mr-2 text-primary"></i> 排程清單
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium">日期時間</TableHead>
                  <TableHead className="font-medium">訊息類型</TableHead>
                  <TableHead className="font-medium">發送對象</TableHead>
                  {!compact && <TableHead className="font-medium">訊息內容</TableHead>}
                  <TableHead className="font-medium">狀態</TableHead>
                  <TableHead className="text-center font-medium">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledMessages.length > 0 ? (
                  scheduledMessages.map((message) => (
                    <TableRow key={message.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell className="py-3">
                        {format(new Date(message.scheduledTime), "yyyy/MM/dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>{message.title}</TableCell>
                      <TableCell>{getGroupNames(message.groupIds)}</TableCell>
                      {!compact && <TableCell className="truncate max-w-xs">{message.content}</TableCell>}
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsDialog(message)}
                            title="查看詳情"
                          >
                            <EditIcon className="h-4 w-4" />
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
                    <TableCell colSpan={compact ? 5 : 6} className="text-center py-10 text-gray-500">
                      目前沒有排程中的訊息
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Message Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>排程訊息詳情</DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">訊息標題</h3>
                  <p className="text-sm">{selectedMessage.title}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">發送狀態</h3>
                  <div>{getStatusBadge(selectedMessage.status)}</div>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium">排程時間</h3>
                <p className="text-sm">
                  {format(new Date(selectedMessage.scheduledTime), "yyyy/MM/dd HH:mm:ss")}
                </p>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium">發送對象</h3>
                <p className="text-sm">{getGroupNames(selectedMessage.groupIds)}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium">訊息內容</h3>
                <div className="bg-[#F0F0F0] p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-line">{selectedMessage.content}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedMessage(null);
                  }}
                >
                  關閉
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
