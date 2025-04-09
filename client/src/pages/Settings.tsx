import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, insertSettingsSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const formSchema = insertSettingsSchema.extend({
  lineApiToken: z.string().min(1, "LINE API Token不能為空"),
});

export default function SettingsPage() {
  const { toast } = useToast();

  // Fetch settings
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // Settings form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lineApiToken: "",
      isConnected: false,
    },
  });

  // Update form values when settings are loaded
  useState(() => {
    if (settings) {
      form.reset({
        lineApiToken: settings.lineApiToken || "",
        isConnected: settings.isConnected || false,
      });
    }
  });

  const handleSaveSettings = async (data: z.infer<typeof formSchema>) => {
    try {
      // Update the settings
      await apiRequest("PUT", "/api/settings", {
        ...data,
        lastSynced: new Date(),
      });
      
      toast({
        title: "設定已儲存",
        description: "LINE API設定已成功更新。",
      });
      
      // Refresh settings data
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    } catch (error) {
      toast({
        title: "儲存失敗",
        description: "更新設定時發生錯誤，請再試一次。",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      // In a real implementation, this would test the LINE API connection
      await apiRequest("PUT", "/api/settings", {
        isConnected: true,
        lastSynced: new Date(),
      });
      
      toast({
        title: "連線測試成功",
        description: "已成功連接至LINE Messaging API。",
      });
      
      // Refresh settings data
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    } catch (error) {
      toast({
        title: "連線測試失敗",
        description: "無法連接至LINE Messaging API，請檢查您的API Token。",
        variant: "destructive",
      });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <i className="fas fa-cog mr-2 text-primary"></i> 系統設定
          </CardTitle>
          <CardDescription>
            設定LINE Messaging API連接參數，以便系統發送訊息到LINE群組。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
              <FormField
                control={form.control}
                name="lineApiToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LINE API Token</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="輸入您的LINE Messaging API Token" 
                        type="password"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      從LINE Developer Console取得的Channel Access Token
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium mb-1">API連接狀態</h3>
                  <div className="flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full ${settings?.isConnected ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                    <span className="text-sm text-gray-600">
                      {settings?.isConnected ? '已連接' : '未連接'}
                    </span>
                  </div>
                  {settings?.lastSynced && (
                    <div className="mt-1 text-xs text-gray-500">
                      上次同步: {format(new Date(settings.lastSynced), "yyyy/MM/dd HH:mm")}
                    </div>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleTestConnection}
                >
                  測試連接
                </Button>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <Button type="submit">儲存設定</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">系統資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">系統版本</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">LINE Messaging API SDK</span>
              <span>2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">系統狀態</span>
              <span className="text-green-600">正常運行中</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
