import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// 定義查詢表單的 schema
const searchSchema = z.object({
  query: z.string().min(1, { message: '請輸入搜尋關鍵字' })
});

type SearchFormValues = z.infer<typeof searchSchema>;

// 查詢結果的類型定義
interface SearchResult {
  found: boolean;
  message: string;
  groups: {
    id: number;
    name: string;
    lineId: string;
  }[];
}

export default function GroupSearch() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  
  // 初始化表單
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: ''
    }
  });
  
  // 執行搜索的查詢
  const { data: searchResult, isLoading, isError, error } = useQuery<SearchResult>({
    queryKey: ['groupSearch', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { found: false, message: '', groups: [] };
      
      const res = await apiRequest(`/api/groups/search?query=${encodeURIComponent(searchTerm)}`);
      return res;
    },
    enabled: !!searchTerm, // 只有當searchTerm存在時才執行查詢
  });
  
  // 表單提交處理
  const onSubmit = (values: SearchFormValues) => {
    setSearchTerm(values.query);
  };
  
  // 清空查詢
  const clearSearch = () => {
    form.reset();
    setSearchTerm(null);
  };
  
  // 複製群組ID到剪貼簿
  const copyToClipboard = (text: string, groupName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: '已複製群組ID',
        description: `${groupName} 的ID已複製到剪貼簿`
      });
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: '複製失敗',
        description: '無法複製到剪貼簿，請手動複製'
      });
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">查詢群組 ID</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>搜尋群組</CardTitle>
          <CardDescription>輸入群組名稱進行搜尋，查看對應的群組ID</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>搜尋關鍵字</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入群組名稱..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '搜尋中...' : '搜尋'}
                </Button>
                {searchTerm && (
                  <Button type="button" variant="outline" onClick={clearSearch}>
                    清除
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>搜尋失敗</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : '發生錯誤，請稍後再試'}
          </AlertDescription>
        </Alert>
      )}
      
      {searchResult && searchTerm && (
        <Card>
          <CardHeader>
            <CardTitle>搜尋結果</CardTitle>
            <CardDescription>{searchResult.message}</CardDescription>
          </CardHeader>
          <CardContent>
            {searchResult.found ? (
              <div className="space-y-4">
                {searchResult.groups.map(group => (
                  <div key={group.id} className="p-4 border rounded-lg bg-background">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{group.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-mono bg-muted p-1 rounded">
                            {group.lineId}
                          </span>
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">ID: {group.id}</Badge>
                    </div>
                    <div className="mt-4">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => copyToClipboard(group.lineId, group.name)}
                      >
                        複製群組ID
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">沒有找到匹配的群組，請嘗試其他關鍵字</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              您可以複製群組ID並在發送測試訊息時使用
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}