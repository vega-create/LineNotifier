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
    <>
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
                    <TableCell colSpan={3} className="text-center py-10 text-gray-500">
                      沒有找到群組資料
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
    </>
  );
}
