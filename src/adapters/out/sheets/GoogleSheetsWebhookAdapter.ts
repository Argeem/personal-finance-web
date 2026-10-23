import { IGoogleSheetsSyncPort, SyncPayload, SyncResponse } from '../../../ports/out/IGoogleSheetsSyncPort';

export class GoogleSheetsWebhookAdapter implements IGoogleSheetsSyncPort {
  async testConnection(webhookUrl: string): Promise<SyncResponse> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return { success: false, message: 'URL ไม่ถูกต้อง' };
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Standard for Google Apps Script Web App redirects
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          timestamp: new Date().toISOString(),
          client: 'FinTrack React Hexagonal'
        })
      });

      return { success: true, message: 'ส่งสัญญาณเชื่อมต่อ Google Sheets สำเร็จ' };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: err.message || 'เชื่อมต่อล้มเหลว' };
    }
  }

  async syncUpdate(webhookUrl: string, payload: SyncPayload): Promise<SyncResponse> {
    if (!webhookUrl) {
      return { success: false, message: 'ไม่มี Webhook URL' };
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { success: true, message: 'ซิงค์ข้อมูลสำเร็จ' };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: err.message || 'ซิงค์ไม่สำเร็จ' };
    }
  }
}
