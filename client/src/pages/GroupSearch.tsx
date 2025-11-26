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

// 查詢表單 schema
const searchSchema = z.object({
  query: z.string().min(1, { message: '請輸入搜尋關鍵字' })
});

type SearchFormValues = z.infer<typeof searchSchema>;

// 後端正確回傳格式：只需要 groups
interface Group {
  id: number;
  name: string;
  lineId: string;
}

interface SearchResponse {
  groups: Group[];
}

export default function GroupSearch() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' }
  });

  // React Query
  const { data, isLoading, isError, error } = useQuery<SearchResponse>({
    queryKey: ['groupSearch', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { groups: [] };

      const res = await apiRequest('GET', `/api/groups/search?query=${encodeURIComponent(searchTerm)}`);
      const json = await res.json();
      return json as SearchResponse;
    },
    enabled: !!searchTerm,
  });

  const groups = data?.groups ?? [];

  const onSubmit = (values: SearchFormValues) => {
    setSearchTerm(values.query);
  };

  const clearSearch = () => {
    form.reset();
    setSearchTerm(null);
  };

  const copyToClipboard = (text: string, groupName: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({
        title: '已複製群組 ID',
        description: `${groupName} 的 ID 已複製到剪貼簿`
      }))
      .catch(() => toast({
        variant: 'destructive',
        title: '複製失敗',
        description: '無法複製，請手動複製'
      }));
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">查詢群組 ID</h1>

      <Card className="mb-8">
        <CardHeader>
