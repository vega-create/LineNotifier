import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Group } from "@shared/schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

const TestFormSchema = z.object({
  groupId: z.string().min(1, "請選擇一個群組"),
  content: z.string().min(1, "請輸入訊息內容"),
});

type TestFormValues = z.infer<typeof TestFormSchema>;

export default function TestSend() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 獲取群組列表
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });
  
  const form = useForm<TestFormValues>({
    resolver: zodResolver(TestFormSchema),
    defaultValues: {
      groupId: "2", // 預設選擇 Anna 群（ID: 2）
      content: "測試訊息 - 直接發送功能測試",
    },
  });
  
  const handleSubmit = async (data: TestFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      const result = await api.testSend(Number(data.groupId), data.content);
      
      setResult(result);
      toast({
        title: "發送成功",
        description: `訊息已發送到 ${result.group.name} 群組`,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      toast({
        title: "發送失敗",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">LINE 訊息測試發送</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>發送測試訊息</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>選擇群組</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇群組" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
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
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isLoading ? "發送中..." : "立即發送訊息"}
                </Button>
              </form>
            </Form>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>發送失敗</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {result && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <AlertTitle>發送成功</AlertTitle>
                <AlertDescription>
                  <div className="mt-2">
                    <p><strong>群組名稱:</strong> {result.group.name}</p>
                    <p><strong>群組 ID:</strong> {result.group.id}</p>
                    <p><strong>LINE 群組 ID:</strong> {result.group.lineId}</p>
                    <p><strong>訊息:</strong> {result.message}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}