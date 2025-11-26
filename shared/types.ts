// 前端可安全使用的純資料型別

export type Group = {
  id: number;
  name: string;
  lineId: string;
};

export type Template = {
  id: number;
  name: string;
  content: string;
  type: string;
};

export type Message = {
  id: number;
  title: string;
  content: string;
  scheduledTime: string;
  endTime?: string | null;
  type: string;
  status: string;
  createdAt: string;
  groupIds: string[];
  currency?: string | null;
  amount?: string | null;
  recurringType?: string | null;
  lastSent?: string | null;
  recurringActive?: boolean;
};

export type Settings = {
  id: number;
  lineApiToken?: string | null;
  lineChannelSecret?: string | null;
  lastSynced?: string | null;
  isConnected: boolean;
};
