export interface SyncPayload {
  action: string;
  timestamp: string;
  data?: unknown;
}

export interface SyncResponse {
  success: boolean;
  message: string;
}

export interface IGoogleSheetsSyncPort {
  testConnection(webhookUrl: string): Promise<SyncResponse>;
  syncUpdate(webhookUrl: string, payload: SyncPayload): Promise<SyncResponse>;
}
