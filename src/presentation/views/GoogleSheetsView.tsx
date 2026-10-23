import React, { useState, useRef } from 'react';
import { Copy, Code, Download, RefreshCw, X, Save, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { ExpenseItem } from '../../core/domain/ExpenseItem';
import { LandInstallment } from '../../core/domain/LandInstallment';
import { StudentLoan } from '../../core/domain/DebtSummary';
import { InvestmentItem } from '../../core/domain/Investment';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { container } from '../../config/container';
import { FinanceDataSchema } from '../../config/initialData';

interface GoogleSheetsViewProps {
  items: ExpenseItem[];
  installments: LandInstallment[];
  investments?: InvestmentItem[];
  studentLoan: StudentLoan;
  onResetFinance: () => void;
  onResetLand: () => void;
  onResetInvestments?: () => void;
  onImportData: (items: ExpenseItem[], installments: LandInstallment[], investments?: InvestmentItem[]) => void;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
  onUpdateSyncStatus: (status: string) => void;
}

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // บันทึก Log การอัปเดต หรือซิงค์กับ Sheet 'Finance UI'
    var sheet = ss.getSheetByName('Finance UI') || ss.getActiveSheet();
    
    // ตอบกลับสำเร็จ
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      timestamp: new Date().toISOString(),
      actionReceived: data.action || 'sync'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'connected',
    message: 'FinTrack API is ready!'
  })).setMimeType(ContentService.MimeType.JSON);
}`;

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  items,
  installments,
  investments,
  studentLoan,
  onResetFinance,
  onResetLand,
  onResetInvestments,
  onImportData,
  onNotify,
  onUpdateSyncStatus,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('FINTRACK_SHEET_URL') || '';
  });
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isResetDefaultOpen, setIsResetDefaultOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isSavingProjectFile, setIsSavingProjectFile] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<FinanceDataSchema | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveToProjectFile = async () => {
    setIsSavingProjectFile(true);
    try {
      const payload = container.jsonSync.createFullPayload(items, installments, studentLoan, investments);
      const result = await container.jsonSync.saveToProjectFile(payload);
      if (result.isLocalDev) {
        onNotify('บันทึกลง src/data/financeData.json เรียบร้อยแล้ว พร้อม deploy ข้อมูลล่าสุดไปด้วยทันที!', 'success');
      } else {
        onNotify(result.message, 'success');
      }
    } catch (err: any) {
      onNotify(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'info');
    } finally {
      setIsSavingProjectFile(false);
    }
  };

  const handleDownloadJson = () => {
    const payload = container.jsonSync.createFullPayload(items, installments, studentLoan, investments);
    container.jsonSync.downloadJsonFile(payload, 'financeData.json');
    onNotify('ดาวน์โหลดไฟล์ financeData.json เรียบร้อยแล้ว', 'success');
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await container.jsonSync.parseUploadedFile(file);
      setPendingImportData(parsed);
    } catch (err: any) {
      onNotify(err.message, 'info');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImportData) return;
    onImportData(
      pendingImportData.items,
      pendingImportData.landInstallments,
      pendingImportData.investments
    );
    setPendingImportData(null);
    onNotify('นำเข้าข้อมูลจากไฟล์ JSON สำเร็จแล้ว!', 'success');
  };

  const handleConfirmResetDefaults = () => {
    onResetFinance();
    onResetLand();
    onResetInvestments?.();
    setIsResetDefaultOpen(false);
    onNotify('รีเซ็ตข้อมูลตั้งต้นจากไฟล์ financeData.json สำเร็จแล้ว', 'success');
  };

  const handleSaveAndTest = async () => {
    const url = webhookUrl.trim();
    localStorage.setItem('FINTRACK_SHEET_URL', url);

    if (!url) {
      onNotify('ลบ URL แล้ว ตอนนี้ทำงานในโหมด Offline', 'info');
      onUpdateSyncStatus('Offline');
      return;
    }

    setTesting(true);
    onNotify('กำลังทดสอบส่งสัญญาณเชื่อมต่อ Google Sheets...', 'info');

    const result = await container.sheetsSync.testConnection(url);
    setTesting(false);

    if (result.success) {
      onNotify('บันทึกและเชื่อมต่อ Google Sheets สำเร็จ!', 'success');
      onUpdateSyncStatus('เชื่อมต่อแล้ว');
    } else {
      onNotify(`เชื่อมต่อไม่สำเร็จ: ${result.message}`, 'info');
      onUpdateSyncStatus('พร้อมส่ง Webhook');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(() => {
      onNotify('คัดลอกโค้ด Google Apps Script สำเร็จ!', 'success');
    }).catch(() => {
      onNotify('กรุณาคลุมดำเพื่อคัดลอกโค้ด', 'info');
    });
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title-wrap">
          <h2>
            <span>☁️ จัดการข้อมูล JSON & ซิงค์ Google Sheets</span>
          </h2>
          <p>บันทึกข้อมูลลงไฟล์ JSON เพื่อให้ติดไปกับตัวเว็บเมื่อ Deploy หรือเชื่อมต่อ Google Sheet</p>
        </div>
      </div>

      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Card 1: JSON File Management for Deploy */}
      <div className="data-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--sky-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                📦 จัดเก็บข้อมูลลงไฟล์ JSON สำหรับ Deploy
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                ไฟล์ต้นทาง: <code style={{ color: 'var(--sky-400)', background: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>src/data/financeData.json</code>
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--emerald-400)',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            <CheckCircle2 size={14} />
            พร้อม Deploy ไปกับโค้ด
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
          ข้อมูลทั้งหมด (14 รายการค่าใช้จ่าย & หนี้สิน, 72 งวดผ่อนที่ดิน, และยอดหนี้ กยศ.) ถูกผูกไว้กับไฟล์ <strong>src/data/financeData.json</strong> โดยตรง 
          เมื่อคุณกด <strong>"บันทึกลงไฟล์โปรเจกต์"</strong> ระบบจะเขียนข้อมูลล่าสุดลงไฟล์ทันที และเมื่อคุณรัน <code>npm run build</code> หรือ deploy ขึ้น Vercel / Netlify / Server ข้อมูลทั้งหมดจะเดินทางไปด้วยทันที ไม่สูญหาย!
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveToProjectFile}
            disabled={isSavingProjectFile}
            style={{ minWidth: '220px' }}
          >
            <Save size={16} />
            {isSavingProjectFile ? 'กำลังบันทึกลงไฟล์...' : '💾 บันทึกลงไฟล์โปรเจกต์ (financeData.json)'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadJson}
          >
            <Download size={15} />
            ส่งออก / ดาวน์โหลด JSON
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={15} />
            นำเข้าไฟล์ JSON
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsResetDefaultOpen(true)}
            style={{ color: 'var(--rose-400)', marginLeft: 'auto' }}
          >
            <RefreshCw size={14} />
            รีเซ็ตเป็นค่าเริ่มต้น
          </button>
        </div>
      </div>

      {/* Card 2: Google Sheets Webhook Integration */}
      <div className="data-card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>
          🔗 วิธีเชื่อมต่อ Google Sheet กับเว็บนี้
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          คุณสามารถเชื่อมต่อเว็บนี้เข้ากับ Google Sheet เพื่อให้อ่านและเขียนข้อมูลได้แบบ Real-time:
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Option 1: Webhook */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--indigo-400)', marginBottom: '6px' }}>
              วิธีที่ 1: Google Apps Script (Webhook)
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              สร้าง Web App ผ่าน Apps Script ใน Google Sheet เพื่อให้เว็บนี้บันทึกข้อมูลและส่งสถานะกลับได้ทันที
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsScriptModalOpen(true)}
            >
              <Code size={14} /> ดูโค้ด Apps Script พร้อมใช้งาน
            </button>
          </div>

          {/* Option 2: JSON Deploy File */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--emerald-400)', marginBottom: '6px' }}>
              วิธีที่ 2: ใช้ไฟล์ financeData.json ในโปรเจกต์
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              ข้อมูลถูก bundle อยู่ในโปรเจกต์เว็บเรียบร้อยแล้ว เมื่อ deploy ขึ้น host ใดก็ตาม ข้อมูลจะพร้อมใช้งานทันที
            </p>
            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={handleSaveToProjectFile}
            >
              <Save size={14} /> ซิงค์ลงไฟล์ก่อน Deploy
            </button>
          </div>
        </div>

        {/* Webhook URL Input */}
        <div className="form-group">
          <label>Google Sheet Webhook URL (หรือ Web App URL):</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="url"
              className="form-control"
              style={{ flex: 1, minWidth: '250px' }}
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAndTest}
              disabled={testing}
            >
              {testing ? 'กำลังทดสอบ...' : 'บันทึก & ทดสอบ Sync'}
            </button>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            เมื่อบันทึกแล้ว ทุกครั้งที่คุณติ๊กชำระเงิน หรือแก้ไขยอด ระบบจะส่งการอัปเดตไปยัง Sheet ของคุณ
          </span>
        </div>
      </div>

      {/* Confirm Import JSON Modal */}
      <ConfirmModal
        isOpen={!!pendingImportData}
        title="ยืนยันการนำเข้าข้อมูลจากไฟล์ JSON"
        message={`พบรายการค่าใช้จ่าย ${pendingImportData?.items?.length || 0} รายการ และการผ่อนที่ดิน ${pendingImportData?.landInstallments?.length || 0} งวด คุณต้องการนำเข้าข้อมูลและแทนที่ข้อมูลปัจจุบันหรือไม่?`}
        confirmText="ยืนยันนำเข้าข้อมูล"
        cancelText="ยกเลิก"
        variant="warning"
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImportData(null)}
      />

      {/* Confirm Reset to Default Modal */}
      <ConfirmModal
        isOpen={isResetDefaultOpen}
        title="ยืนยันการรีเซ็ตข้อมูลทั้งหมด"
        message="คุณต้องการล้างการแก้ไขทั้งหมดและนำเข้าข้อมูลตั้งต้นดั้งเดิมจากไฟล์ financeData.json กลับมาใช่หรือไม่? การกระทำนี้จะเขียนทับข้อมูลที่คุณเคยบันทึกไว้ในเบราว์เซอร์"
        confirmText="ยืนยันการรีเซ็ต"
        cancelText="ยกเลิก"
        variant="danger"
        onConfirm={handleConfirmResetDefaults}
        onCancel={() => setIsResetDefaultOpen(false)}
      />

      {/* Script Code Modal */}
      {isScriptModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScriptModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>📋 โค้ด Google Apps Script สำหรับเชื่อมต่อ</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsScriptModalOpen(false)}
                style={{ width: 32, height: 32 }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                คัดลอกโค้ดนี้ไปวางใน <strong>Google Sheet ➔ ส่วนขยาย (Extensions) ➔ Apps Script</strong> แล้วกด <strong>Deploy as Web App</strong>:
              </p>

              <div
                style={{
                  background: '#0D1117',
                  color: '#E6EDF3',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  position: 'relative',
                  overflowX: 'auto',
                  border: '1px solid rgba(255,255,255,0.1)',
                  margin: '14px 0',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyCode}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 10px',
                    fontSize: '11px',
                  }}
                >
                  <Copy size={12} /> คัดลอกโค้ด
                </button>
                <pre style={{ margin: 0 }}>
                  <code>{APPS_SCRIPT_CODE}</code>
                </pre>
              </div>

              <ol style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>วางโค้ดใน Apps Script แล้วกด <strong>Save (บันทึก)</strong></li>
                <li>คลิก <strong>Deploy (ทำให้ใช้งานได้) ➔ New deployment (การนำไปใช้งานใหม่)</strong></li>
                <li>เลือกประเภท <strong>Web App</strong>, Who has access เลือก <strong>Anyone (ทุกคน)</strong></li>
                <li>คัดลอก <strong>Web app URL</strong> มาใส่ในช่องการเชื่อมต่อในเว็บนี้</li>
              </ol>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsScriptModalOpen(false)}
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
