import { ExpenseItem } from '../../../core/domain/ExpenseItem';
import { LandInstallment } from '../../../core/domain/LandInstallment';
import { StudentLoan } from '../../../core/domain/DebtSummary';
import { InvestmentItem } from '../../../core/domain/Investment';
import { INITIAL_DATA, FinanceDataSchema } from '../../../config/initialData';

export interface SaveResult {
  success: boolean;
  message: string;
  isLocalDev: boolean;
}

export class JsonDataSyncService {
  /**
   * สร้าง object ข้อมูลการเงินในรูปแบบ JSON Schema ที่พร้อม deploy
   */
  createFullPayload(
    items: ExpenseItem[],
    landInstallments: LandInstallment[],
    studentLoan: StudentLoan,
    investments?: InvestmentItem[]
  ): FinanceDataSchema {
    const fixedExpenses = items
      .filter(i => i.type === 'subscription')
      .reduce((acc, curr) => acc + curr.monthly, 0);

    const debtRemaining = items
      .filter(i => i.type === 'debt')
      .reduce((acc, curr) => acc + curr.remaining, 0);

    const totalDebt = debtRemaining + (studentLoan?.remaining || 0);

    return {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      items,
      landInstallments,
      investments: investments || INITIAL_DATA.investments || [],
      debtOverview: {
        student_loan: studentLoan,
        fixed_expenses: fixedExpenses,
        total_debt: totalDebt
      }
    };
  }

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * ดึงข้อมูลล่าสุดจาก src/data/financeData.json ผ่าน Vite dev server
   */
  async fetchServerData(): Promise<FinanceDataSchema | null> {
    try {
      const response = await fetch('/__api/data', {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.items) && Array.isArray(json.landInstallments)) {
          return json as FinanceDataSchema;
        }
      }
    } catch {
      // Endpoint ไม่พร้อมใช้งาน (เช่น บน Static Hosting หรือออฟไลน์)
    }
    return null;
  }

  /**
   * บันทึกข้อมูลกลับไปยัง src/data/financeData.json บนเครื่อง (ผ่าน Vite dev server)
   * หากทำงานในโหมด Static Hosting จะดาวน์โหลดไฟล์ JSON ให้แทนอัตโนมัติเฉพาะเมื่อ autoDownload = true
   */
  async saveToProjectFile(payload: FinanceDataSchema, autoDownload = false): Promise<SaveResult> {
    try {
      const response = await fetch('/__api/save-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          message: json.message || 'บันทึกลง src/data/financeData.json สำเร็จแล้ว',
          isLocalDev: true
        };
      }
    } catch {
      // ไม่สามารถยิง dev server ได้ (เช่น deploy ขึ้น Vercel/Netlify/Hosting แล้ว)
    }

    if (autoDownload) {
      this.downloadJsonFile(payload);
      return {
        success: true,
        message: 'ดาวน์โหลด financeData.json สำเร็จ (นำไปแทนที่ใน src/data/ เพื่อ deploy ข้อมูลชุดนี้)',
        isLocalDev: false
      };
    }

    return {
      success: false,
      message: 'ไม่ได้ทำงานในโหมด Local Dev Server (ไม่สามารถเขียนไฟล์บนเครื่องได้อัตโนมัติ)',
      isLocalDev: false
    };
  }

  /**
   * บันทึกอัตโนมัติแบบ Debounced เพื่อไม่ให้เขียนดิสก์บ่อยเกินไป
   */
  debouncedAutoSave(
    payload: FinanceDataSchema,
    onStatusChange?: (status: 'saving' | 'saved' | 'idle' | 'error') => void,
    delayMs = 600
  ) {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    onStatusChange?.('saving');

    this.saveTimer = setTimeout(async () => {
      try {
        const res = await this.saveToProjectFile(payload, false);
        if (res.success && res.isLocalDev) {
          onStatusChange?.('saved');
        } else {
          onStatusChange?.('idle');
        }
      } catch {
        onStatusChange?.('error');
      }
    }, delayMs);
  }

  /**
   * ดาวน์โหลดไฟล์ JSON ทันที
   */
  downloadJsonFile(payload: FinanceDataSchema, filename = 'financeData.json') {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * อ่านไฟล์ JSON ที่อัปโหลดเข้ามา
   */
  async parseUploadedFile(file: File): Promise<FinanceDataSchema> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (!parsed.items || !parsed.landInstallments) {
            throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้อง (ขาด items หรือ landInstallments)');
          }
          resolve(parsed as FinanceDataSchema);
        } catch (err: any) {
          reject(new Error(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsText(file);
    });
  }

  /**
   * ดึงข้อมูลตั้งต้นที่ bundle มาพร้อม deploy
   */
  getBundledDefault(): FinanceDataSchema {
    return INITIAL_DATA;
  }
}

export const jsonDataSyncService = new JsonDataSyncService();
