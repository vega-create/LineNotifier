import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Group, Template, Message, MessageFormData } from "@shared/schema";
import MessageTemplateSelector from "./MessageTemplateSelector";
import ScheduleSelector from "./ScheduleSelector";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const formSchema = z.object({
  title: z.string().min(1, "訊息標題不能為空"),
  content: z.string().min(1, "訊息內容不能為空"),
  type: z.enum(["single", "periodic"]),
  multiGroup: z.boolean().default(false),
  groups: z.array(z.string()).min(1, "至少選擇一個群組"),
  scheduledDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  currency: z.string().optional(),
  amount: z.string().optional(),
});

type MessageFormProps = {
  groups: Group[];
  templates: Template[];
  onSuccess?: () => void;
};

export default function MessageForm({ groups, templates, onSuccess }: MessageFormProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "single",
      multiGroup: false,
      groups: ["1"], // Default to first group
      scheduledDate: new Date(),
      startTime: "16:00",
      endTime: "18:00",
      currency: "TWD", // 預設台幣
      amount: "",
    },
  });

  const watchType = form.watch("type");
  const watchMultiGroup = form.watch("multiGroup");
  const watchContent = form.watch("content");
  const watchTitle = form.watch("title");
  const watchCurrency = form.watch("currency");
  const watchAmount = form.watch("amount");
  
  // 監聽金額和幣別變更，更新訊息內容
  useEffect(() => {
    if ((watchTitle.includes("入帳") || watchTitle.includes("收款")) && watchAmount) {
      // 獲取幣別符號
      let currencySymbol = "";
      if (watchCurrency === "TWD") currencySymbol = "NT$";
      else if (watchCurrency === "USD") currencySymbol = "US$";
      else if (watchCurrency === "AUD") currencySymbol = "AU$";
      
      // 構建金額字符串
      const amountStr = `${currencySymbol}${watchAmount}`;
      
      // 檢查訊息內容是否已經包含了金額信息
      if (!watchContent.includes(amountStr)) {
        // 替換或添加金額信息
        let newContent = watchContent;
        
        // 使用正則表達式嘗試查找並替換現有的金額信息
        const currencyRegex = /(NT\$|US\$|AU\$)[0-9,.]+/;
        if (currencyRegex.test(newContent)) {
          newContent = newContent.replace(currencyRegex, amountStr);
        } else if (watchContent.includes("金額")) {
          // 如果包含"金額"關鍵字，在其後添加金額
          newContent = newContent.replace(/金額[：:]\s*/, `金額: ${amountStr} `);
        } else {
          // 如果沒有找到適合的位置，直接添加到內容末尾
          newContent = newContent + "\n\n金額: " + amountStr;
        }
        
        // 更新表單內容
        form.setValue("content", newContent);
      }
    }
  }, [watchCurrency, watchAmount, watchTitle, watchContent, form]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    form.setValue("title", template.name);
    form.setValue("content", template.content);
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Convert form data to API format
      const [startHour, startMinute] = data.startTime.split(":").map(Number);
      const [endHour, endMinute] = data.endTime.split(":").map(Number);
      
      const scheduleDate = new Date(data.scheduledDate);
      const scheduleTime = new Date(scheduleDate);
      scheduleTime.setHours(startHour, startMinute, 0);
      
      const endTime = new Date(scheduleDate);
      endTime.setHours(endHour, endMinute, 0);
      
      const messageData = {
        title: data.title,
        content: data.content,
        type: data.type,
        scheduledTime: scheduleTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "scheduled",
        groupIds: data.groups,
        currency: data.currency,
        amount: data.amount
      };
      
      // Send message data to API
      await apiRequest("POST", "/api/messages", messageData);
      
      // Reset form
      form.reset({
        title: "",
        content: "",
        type: "single",
        multiGroup: false,
        groups: ["1"],
        scheduledDate: new Date(),
        startTime: "16:00",
        endTime: "18:00",
        currency: "TWD",
        amount: "",
      });
      
      // Invalidate messages cache to refresh any lists
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleClearForm = () => {
    form.reset({
      title: "",
      content: "",
      type: "single",
      multiGroup: false,
      groups: ["1"],
      scheduledDate: new Date(),
      startTime: "16:00",
      endTime: "18:00",
      currency: "TWD",
      amount: "",
    });
    setSelectedTemplate(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold text-gray-800">LINE訊息發送</CardTitle>
            
            <div className="flex items-center">
              <div className="relative mr-2">
                <Select defaultValue="1">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="選擇群組" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button>
                <i className="fas fa-plus mr-1"></i> 新增群組
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Message Type */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-4">訊息設定</h3>
                
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-2">訊息類型</FormLabel>
                  <div className="flex">
                    <Button
                      type="button"
                      variant={watchType === "single" ? "default" : "outline"}
                      className="rounded-r-none"
                      onClick={() => form.setValue("type", "single")}
                    >
                      單次發送
                    </Button>
                    <Button
                      type="button"
                      variant={watchType === "periodic" ? "default" : "outline"}
                      className="rounded-l-none"
                      onClick={() => form.setValue("type", "periodic")}
                    >
                      週期性發送
                    </Button>
                  </div>
                </div>
                
                {/* Group Settings */}
                <div className="mb-4">
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-2">群組設定</FormLabel>
                  <div className="flex items-center mb-2">
                    <FormField
                      control={form.control}
                      name="multiGroup"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="multi-group"
                            />
                          </FormControl>
                          <label 
                            htmlFor="multi-group" 
                            className="text-sm text-gray-700 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            多群組模式
                          </label>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <FormField
                      control={form.control}
                      name="groups"
                      render={({ field }) => (
                        <FormItem className="flex-grow mr-2">
                          <FormControl>
                            {watchMultiGroup ? (
                              <div className="space-y-2">
                                {groups.map((group) => (
                                  <div key={group.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`group-${group.id}`}
                                      checked={field.value.includes(group.id.toString())}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, group.id.toString()]);
                                        } else {
                                          field.onChange(field.value.filter(id => id !== group.id.toString()));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`group-${group.id}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {group.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Select
                                value={field.value[0]}
                                onValueChange={(value) => field.onChange([value])}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="選擇群組" />
                                </SelectTrigger>
                                <SelectContent>
                                  {groups.map((group) => (
                                    <SelectItem key={group.id} value={group.id.toString()}>
                                      {group.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button">
                      <i className="fas fa-plus mr-1"></i> 新增群組
                    </Button>
                  </div>
                </div>
                
                {/* Message Template */}
                <MessageTemplateSelector 
                  templates={templates} 
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={handleTemplateSelect}
                />
              </div>

              {/* Message Content */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-4">訊息內容</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>訊息標題</FormLabel>
                      <FormControl>
                        <Input placeholder="輸入訊息標題" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>訊息內容</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="輸入訊息內容" 
                          className="min-h-32 resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 幣別與金額區塊 - 僅在入帳通知或收款通知時顯示 */}
                {(watchTitle.includes("入帳") || watchTitle.includes("收款")) && (
                  <div className="bg-gray-50 p-4 rounded-md space-y-4">
                    <h4 className="font-medium text-gray-700">通知金額設定</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>幣別</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="選擇幣別" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="TWD">台幣 (TWD)</SelectItem>
                                <SelectItem value="AUD">澳幣 (AUD)</SelectItem>
                                <SelectItem value="USD">美金 (USD)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>金額</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="輸入金額" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule Settings */}
              <ScheduleSelector form={form} />



              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                  className="w-full sm:w-auto"
                >
                  清除內容
                </Button>
                
                <div className="flex w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2 sm:w-auto rounded-r-none"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    預覽
                  </Button>
                  <Button 
                    type="submit"
                    className="w-1/2 sm:w-auto bg-green-500 hover:bg-green-600 rounded-l-none"
                  >
                    發送至LINE群組
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>訊息預覽</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">訊息標題</h3>
              <p className="text-sm">{watchTitle}</p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium">發送對象</h3>
              <p className="text-sm">
                {form.getValues("groups")
                  .map(id => {
                    const group = groups.find(g => g.id.toString() === id);
                    return group ? group.name : "";
                  })
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium">LINE訊息內容</h3>
              <div className="bg-[#F0F0F0] p-4 rounded-lg space-y-2">
                <p className="text-sm whitespace-pre-line">{watchContent}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium">排程時間</h3>
              <p className="text-sm">
                {form.getValues("scheduledDate").toLocaleDateString()} {form.getValues("startTime")}
              </p>
            </div>
            
            {/* 顯示幣別和金額（如果有） */}
            {(watchTitle.includes("入帳") || watchTitle.includes("收款")) && form.getValues("amount") && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium">通知金額</h3>
                <p className="text-sm">
                  {form.getValues("currency") === "TWD" && "NT$"}
                  {form.getValues("currency") === "USD" && "US$"}
                  {form.getValues("currency") === "AUD" && "AU$"}
                  {form.getValues("amount")}
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setIsPreviewOpen(false)}>關閉</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 自訂按鈕對話框 */}
      <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增自訂按鈕</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">按鈕類型</label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="buttonType" value="url" className="radio" defaultChecked />
                  <span className="text-sm">網址連結</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="buttonType" value="text" className="radio" />
                  <span className="text-sm">文字訊息</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">按鈕文字</label>
              <Input placeholder="例：點擊查看詳情" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">目標網址或回覆文字</label>
              <Input placeholder="https:// 或要回覆的訊息" />
            </div>

            <DialogFooter className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setIsCustomModalOpen(false)}>
                取消
              </Button>
              <Button 
                onClick={() => {
                  // 這裡會加入按鈕到訊息中
                  setIsCustomModalOpen(false);
                }}
              >
                新增按鈕
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
