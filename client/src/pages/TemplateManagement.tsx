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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, FileText } from "lucide-react";
import { Template, insertTemplateSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const templateTypes = [
  { value: "meeting", label: "會議提醒" },
  { value: "holiday", label: "放假通知" },
  { value: "project", label: "專案進度" },
  { value: "payment", label: "款項通知" },
  { value: "invoice", label: "發票通知" },
  { value: "introduction", label: "自我介紹" },
  { value: "other", label: "其他" },
];

const formSchema = insertTemplateSchema.extend({
  name: z.string().min(1, "模板名稱不能為空"),
  content: z.string().min(1, "訊息內容不能為空"),
  type: z.string().min(1, "模板類型不能為空"),
});

export default function TemplateManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  // Fetch templates
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  // Add template form
  const addForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      content: "",
      type: "meeting",
    },
  });

  // Edit template form
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      content: "",
      type: "meeting",
    },
  });

  const handleAddTemplate = async (data: z.infer<typeof formSchema>) => {
    try {
      await apiRequest("POST", "/api/templates", data);
      
      toast({
        title: "模板已新增",
        description: "訊息模板已成功新增到系統中。",
      });
      
      // Invalidate templates cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      
      // Close dialog and reset form
      setIsAddDialogOpen(false);
      addForm.reset();
    } catch (error) {
      toast({
        title: "新增失敗",
        description: "新增模板時發生錯誤，請確認資料是否正確。",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = async (data: z.infer<typeof formSchema>) => {
    if (!currentTemplate) return;
    
    try {
      await apiRequest("PUT", `/api/templates/${currentTemplate.id}`, data);
      
      toast({
        title: "模板已更新",
        description: "訊息模板已成功更新。",
      });
      
      // Invalidate templates cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      
      // Close dialog and reset form
      setIsEditDialogOpen(false);
      setCurrentTemplate(null);
    } catch (error) {
      toast({
        title: "更新失敗",
        description: "更新模板時發生錯誤，請確認資料是否正確。",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("確定要刪除此模板嗎？")) return;
    
    try {
      await apiRequest("DELETE", `/api/templates/${id}`);
      
      toast({
        title: "模板已刪除",
        description: "訊息模板已成功從系統中刪除。",
      });
      
      // Invalidate templates cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: "刪除模板時發生錯誤，請再試一次。",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (template: Template) => {
    setCurrentTemplate(template);
    editForm.reset({
      name: template.name,
      content: template.content,
      type: template.type,
    });
    setIsEditDialogOpen(true);
  };

  const openPreviewDialog = (template: Template) => {
    setCurrentTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const getTemplateTypeName = (type: string) => {
    const templateType = templateTypes.find(t => t.value === type);
    return templateType ? templateType.label : type;
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
              <i className="fas fa-file-alt mr-2 text-primary"></i> 訊息模板管理
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <i className="fas fa-plus mr-2"></i> 新增模板
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium">模板名稱</TableHead>
                  <TableHead className="font-medium">類型</TableHead>
                  <TableHead className="font-medium">訊息內容</TableHead>
                  <TableHead className="text-center font-medium">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <TableRow key={template.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getTemplateTypeName(template.type)}</TableCell>
                      <TableCell className="truncate max-w-xs">{template.content}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPreviewDialog(template)}
                            title="預覽模板"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(template)}
                            title="編輯模板"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(template.id)}
                            title="刪除模板"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                      沒有找到模板資料
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Template Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增訊息模板</DialogTitle>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddTemplate)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>模板名稱</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入模板名稱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>模板類型</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇模板類型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>訊息內容</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="輸入訊息內容" 
                        className="min-h-24"
                        {...field} 
                      />
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

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯訊息模板</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditTemplate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>模板名稱</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入模板名稱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>模板類型</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇模板類型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>訊息內容</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="輸入訊息內容" 
                        className="min-h-24"
                        {...field} 
                      />
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

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>預覽訊息模板</DialogTitle>
          </DialogHeader>
          
          {currentTemplate && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">模板名稱</h3>
                <p className="text-sm">{currentTemplate.name}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium">模板類型</h3>
                <p className="text-sm">{getTemplateTypeName(currentTemplate.type)}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium">LINE訊息內容</h3>
                <div className="bg-[#F0F0F0] p-4 rounded-lg space-y-2">
                  <p className="text-sm whitespace-pre-line">{currentTemplate.content}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setIsPreviewDialogOpen(false)}>關閉</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
