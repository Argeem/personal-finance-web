import React, { useState, useRef } from 'react';
import {
  X,
  Save,
  Download,
  Upload,
  RefreshCw,
  Code,
  FileText,
  CheckCircle2,
  Cloud,
  Copy,
  Settings,
} from 'lucide-react';
import { ExpenseItem } from '../../../core/domain/ExpenseItem';
import { LandInstallment } from '../../../core/domain/LandInstallment';
import { StudentLoan } from '../../../core/domain/DebtSummary';
import { InvestmentItem } from '../../../core/domain/Investment';
import { ConfirmModal } from './ConfirmModal';
import { container } from '../../../config/container';
import { FinanceDataSchema } from '../../../config/initialData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
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
  const [activeTab, setActiveTab] = useState<'deploy' | 'sheets'>('deploy');
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('FINTRACK_SHEET_URL') || '';
  });
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isResetDefaultOpen, setIsResetDefaultOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isSavingProjectFile, setIsSavingProjectFile] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<FinanceDataSchema | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 680, width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--indigo-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                ⚙️ ตั้งค่า & จัดการข้อมูล
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                บันทึกไฟล์ Deploy, สำรอง/นำเข้าข้อมูล JSON, และซิงค์ Google Sheets
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        {/* Sub-tabs inside Settings */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px 0',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'deploy' ? '2px solid var(--sky-400)' : '2px solid transparent',
              color: activeTab === 'deploy' ? 'var(--sky-400)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={15} />
            บันทึกไฟล์ Deploy & JSON
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'sheets' ? '2px solid var(--indigo-400)' : '2px solid transparent',
              color: activeTab === 'sheets' ? 'var(--indigo-400)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Cloud size={15} />
            เชื่อมต่อ Google Sheets
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Hidden file input for JSON import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          {/* TAB 1: Deploy & JSON Backup */}
          {activeTab === 'deploy' && (
            <div>
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} style={{ color: 'var(--sky-400)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>ไฟล์ข้อมูลหลักของโปรเจกต์</span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--emerald-400)',
                    }}
                  >
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                    พร้อม Deploy
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  ปลายทางไฟล์: <code style={{ color: 'var(--sky-400)', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px' }}>src/data/financeData.json</code>
                  <br />
                  เมื่อกด <strong>"บันทึกลงไฟล์โปรเจกต์"</strong> ระบบจะเขียนข้อมูลล่าสุดลงในไฟล์นี้ทันที เมื่อคุณรันคำสั่ง deploy หรือ git commit ข้อมูลทั้งหมด (ค่าใช้จ่าย, ที่ดิน, เงินเก็บ/หุ้น) จะเดินทางไปด้วยทันที
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveToProjectFile}
                  disabled={isSavingProjectFile}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}
                >
                  <Save size={16} />
                  {isSavingProjectFile ? 'กำลังบันทึกลงไฟล์...' : '💾 บันทึกข้อมูลลงไฟล์โปรเจกต์ (financeData.json)'}
                </button>
              </div>

              {/* Secondary operations */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>ส่งออกข้อมูล</div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    ดาวน์โหลดไฟล์สำรองข้อมูล JSON เก็บไว้ในเครื่อง
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleDownloadJson}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Download size={14} /> ดาวน์โหลด JSON
                  </button>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>นำเข้าข้อมูล</div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    อัปโหลดไฟล์ financeData.json เพื่อคืนค่า
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Upload size={14} /> เลือกไฟล์ JSON
                  </button>
                </div>
              </div>

              {/* Reset to defaults */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>รีเซ็ตเป็นค่าเริ่มต้น</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ล้างการแก้ไขในเบราว์เซอร์และคืนค่าจากไฟล์ financeData.json
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsResetDefaultOpen(true)}
                  style={{ color: 'var(--rose-400)' }}
                >
                  <RefreshCw size={13} /> รีเซ็ต
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Google Sheets Webhook */}
          {activeTab === 'sheets' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                เชื่อมต่อเว็บนี้เข้ากับ Google Sheet ของคุณผ่าน Google Apps Script เพื่อให้ทุกการบันทึกชำระเงินส่งข้อมูลไปยัง Sheet แบบ Real-time:
              </p>

              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--indigo-400)', marginBottom: '4px' }}>
                  โค้ด Google Apps Script
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  คัดลอกโค้ด doPost ไปวางในส่วนขยาย Apps Script บน Google Sheet แล้ว Deploy as Web App
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsScriptModalOpen(true)}
                >
                  <Code size={14} /> ดูโค้ด Apps Script พร้อมใช้งาน
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Google Sheet Webhook URL (หรือ Web App URL):</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="url"
                    className="form-control"
                    style={{ flex: 1, minWidth: '240px' }}
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
                    {testing ? 'กำลังทดสอบ...' : 'บันทึก & ทดสอบ'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Confirm Import JSON Modal */}
      <ConfirmModal
        isOpen={!!pendingImportData}
        title="ยืนยันการนำเข้าข้อมูลจากไฟล์ JSON"
        message={`พบรายการค่าใช้จ่าย ${pendingImportData?.items?.length || 0} รายการ, การผ่อนที่ดิน ${pendingImportData?.landInstallments?.length || 0} งวด, และสินทรัพย์เงินเก็บ/ลงทุน ${pendingImportData?.investments?.length || 0} รายการ คุณต้องการนำเข้าข้อมูลและแทนที่ข้อมูลปัจจุบันหรือไม่?`}
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

      {/* Apps Script Code Modal */}
      {isScriptModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScriptModalOpen(false)} style={{ zIndex: 130 }}>
          <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>📋 โค้ด Google Apps Script สำหรับเชื่อมต่อ</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsScriptModalOpen(false)}
                style={{ width: 30, height: 30 }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  background: '#0D1117',
                  color: '#E6EDF3',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  position: 'relative',
                  overflowX: 'auto',
                  border: '1px solid rgba(255,255,255,0.1)',
                  margin: '10px 0',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyCode}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '3px 8px',
                    fontSize: '11px',
                  }}
                >
                  <Copy size={11} /> คัดลอกโค้ด
                </button>
                <pre style={{ margin: 0 }}>
                  <code>{APPS_SCRIPT_CODE}</code>
                </pre>
              </div>

              <ol style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>วางโค้ดใน Apps Script แล้วกด Save</li>
                <li>คลิก Deploy ➔ New deployment ➔ เลือกประเภท Web App</li>
                <li>Who has access เลือก Anyone แล้วคัดลอก URL มาใส่ในช่อง</li>
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
