import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import { Group, insertGroupSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertGroupSchema.extend({
  name: z.string().min(1, "群組名稱不能為空"),
  lineId: z.string().min(1, "LINE ID不能為空"),
});

export default function GroupManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

  // Fetch groups
  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Add group form
  const addForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lineId: "",
    },
  });

  // Edit group form
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lineId: "",
    },
  });

  const handleAddGroup = async (data: z.infer<typeof formSchema>) => {
    try {
      await apiRequest("POST", "/api/groups", data);

      toast({
        title: "群組已新增",
        description: "LINE群組已成功新增到系統中。",
      });

      // Invalidate groups cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });

      // Close dialog and reset form
      setIsAddDialogOpen(false);
      addForm.reset();
    } catch (error) {
      toast({
        title: "新增失敗",
        description: "新增群組時發生錯誤，請確認資料是否正確。",
        variant: "destructive",
      });
    }
  };

  const handleEditGroup = async (data: z.infer<typeof formSchema>) => {
    if (!currentGroup) return;

    try {
      await apiRequest("PUT", `/api/groups/${currentGroup.id}`, data);

      toast({
        title: "群組已更新",
        description: "LINE群組資訊已成功更新。",
      });

      // Invalidate groups cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });

      // Close dialog and reset form
      setIsEditDialogOpen(false);
      setCurrentGroup(null);
    } catch (error) {
      toast({
        title: "更新失敗",
        description: "更新群組時發生錯誤，請確認資料是否正確。",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("確定要刪除此群組嗎？")) return;

    try {
      await apiRequest("DELETE", `/api/groups/${id}`);

      toast({
        title: "群組已刪除",
        description: "LINE群組已成功從系統中刪除。",
      });

      // Invalidate groups cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: "刪除群組時發生錯誤，請再試一次。",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (group: Group) => {
    setCurrentGroup(group);
    editForm.reset({
      name: group.name,
      lineId: group.lineId,
    });
    setIsEditDialogOpen(true);
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
    <div className="space-y-6">
      {/* Info Card: How to Get LINE Group ID */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium text-blue-800">如何取得LINE群組ID？</h3>
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

      {/* Info Card: LINE Group ID Format */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium text-blue-800">LINE群組ID格式說明</h3>
            <p className="text-sm text-blue-700">
              LINE群組ID通常以 <span className="font-mono bg-white px-1 rounded">C</span> 開頭，長度約為33個字元。
            </p>
            <div className="bg-white p-3 rounded border border-blue-200 font-mono text-sm text-gray-600">
              範例：C1234567890abcdef1234567890abcdef
            </div>
            <p className="text-sm text-blue-700">
              請確保輸入的ID格式正確，否則系統將無法發送訊息到該群組。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold flex items-center">
              <i className="fas fa-users mr-2 text-primary"></i> LINE群組管理
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <i className="fas fa-plus mr-2"></i> 新增群組
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium">群組名稱</TableHead>
                  <TableHead className="font-medium">LINE ID</TableHead>
                  <TableHead className="text-center font-medium">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups && groups.length > 0 ? (
                  groups.map((group) => (
                    <TableRow key={group.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.lineId}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(group)}
                            title="編輯群組"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGroup(group.id)}
                            title="刪除群組"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">
                      <div className="flex flex-col items-center space-y-2">
                        <p className="text-gray-500">尚未新增任何群組</p>
                        <p className="text-sm text-gray-400">
                          點擊右上角的「新增群組」按鈕開始新增LINE群組
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Group Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增LINE群組</DialogTitle>
          </DialogHeader>

          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddGroup)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>群組名稱</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入群組名稱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="lineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LINE群組ID</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入LINE群組ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">儲存</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯LINE群組</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditGroup)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>群組名稱</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入群組名稱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="lineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LINE群組ID</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入LINE群組ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">更新</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
