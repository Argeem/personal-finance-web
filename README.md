# 🏛️ FinTrack Pro (Hexagonal Architecture)

ระบบจัดการการเงินส่วนบุคคล พัฒนาด้วย **React 19 + TypeScript + Vite** โดยออกแบบตามหลัก **Hexagonal Architecture (Ports and Adapters)** อย่างเคร่งครัด แยก Business Logic ออกจาก Framework และ Storage อย่างสมบูรณ์ ทำให้ง่ายต่อการทดสอบ บำรุงรักษา และต่อยอดในอนาคต

---

## 📐 โครงสร้างสถาปัตยกรรม (Architecture Structure)

```
personal-financial-web/src/
│
├── 🧠 core/                               # 1. Domain Core (หัวใจของระบบ - ปราศจาก Framework ภายนอก)
│   ├── domain/                            # Entity & Value Objects
│   │   ├── ExpenseItem.ts                 # โครงสร้างรายจ่าย & หนี้สินประจำเดือน
│   │   ├── LandInstallment.ts             # โครงสร้างตารางผ่อนชำระที่ดิน 72 งวด
│   │   └── DebtSummary.ts                 # โครงสร้างหนี้สินรวม & กยศ.
│   │
│   └── usecases/                          # Application Business Rules (Use Cases)
│       ├── CalculateMetricsUseCase.ts     # คำนวณ KPI 4 ตัวบนแดชบอร์ด (Sub, Debt, Total, Outstanding)
│       ├── CalculateSnowballPlanUseCase.ts # เรียงลำดับแผนปลดหนี้ Snowball Method
│       └── SimulateLandPrepaymentUseCase.ts # จำลองการโปะเงินงวดที่ดิน คำนวณเวลาที่ลดลง
│
├── 🔌 ports/                              # 2. Ports (Contracts / Interfaces)
│   ├── in/                                # Inbound Ports (สิ่งที่ภายนอกเรียกเข้าหา Core)
│   │   ├── IFinanceService.ts
│   │   └── ILandService.ts
│   │
│   └── out/                               # Outbound Ports (สิ่งที่ Core สั่งออกไปภายนอก)
│       ├── IFinanceRepository.ts          # สัญญาณ Interface สำหรับจัดเก็บข้อมูลการเงิน
│       ├── ILandRepository.ts             # สัญญาณ Interface สำหรับจัดเก็บงวดที่ดิน
│       └── IGoogleSheetsSyncPort.ts       # สัญญาณ Interface สำหรับ Sync กับ Google Sheets
│
├── ⚙️ adapters/                           # 3. Adapters (ตัวเชื่อมต่อโลกภายนอกกับ Core)
│   ├── out/                               # Outbound (Secondary / Driven) Adapters
│   │   ├── storage/
│   │   │   ├── LocalStorageFinanceAdapter.ts # บันทึกรายจ่ายลง LocalStorage
│   │   │   └── LocalStorageLandAdapter.ts    # บันทึกงวดที่ดินลง LocalStorage
│   │   └── sheets/
│   │       └── GoogleSheetsWebhookAdapter.ts # เชื่อมต่อ Google Apps Script Webhook
│   │
│   └── in/                                # Inbound (Primary / Driving) Adapters
│       └── hooks/                         # React Custom Hooks ทำหน้าที่เป็น Inbound Controllers
│           ├── useFinanceDashboard.ts     # Hook จัดการแดชบอร์ด Finance UI
│           ├── useLandTracker.ts          # Hook จัดการตารางผ่อนที่ดิน & จำลองการโปะ
│           ├── useDebtSnowball.ts         # Hook จัดการภาพรวมหนี้ & กยศ.
│           └── useTheme.ts                # Hook สลับธีม Dark / Light Mode
│
├── 🎨 presentation/                       # 4. Presentation / UI Layer (React Components)
│   ├── components/
│   │   ├── common/                        # Atomic Components: Navbar, MobileBottomNav, KPICard, Badge
│   │   ├── finance/                       # FinanceKPIGrid, ExpenseTable, ExpenseCardList, ExpenseItemModal
│   │   ├── land/                          # LandHeroCard, InstallmentGrid, PrepaymentSimulator, LandPayModal
│   │   └── debt/                          # DebtSnowballList, StudentLoanCard
│   │
│   ├── views/                             # Feature Views (ประกอบแต่ละหน้า)
│   │   ├── FinanceDashboardView.tsx       # หน้าหลัก Finance UI (เหมือน Sheet Finance UI)
│   │   ├── LandTrackerView.tsx            # หน้าผ่อนที่ดิน 72 งวด (Sheet ผ่อนที่ดิน)
│   │   ├── DebtOverviewView.tsx           # หน้าหนี้สินรวม & กยศ. (Sheet Overview)
│   │   └── GoogleSheetsView.tsx           # หน้าเชื่อมต่อ Google Sheets & จัดการสำรองข้อมูล
│   │
│   └── styles/
│       └── theme.css                      # Design Tokens, Glassmorphism, Theme Variables
│
├── 📦 config/
│   ├── initialData.ts                     # ข้อมูลเริ่มต้นจากไฟล์ Excel การเงิน.xlsx
│   └── container.ts                       # Dependency Injection Container (เชื่อม Adapter เข้า Port)
│
├── App.tsx                                # Root Application Component
└── main.tsx                               # Entry Point
```

---

## 🚀 ข้อดีและการต่อยอดในอนาคต (Extensibility)

1. **เปลี่ยน Database หรือ Storage ใหม่โดยไม่ต้องแก้ UI เลย:**
   - หากต้องการเปลี่ยนจาก `LocalStorage` ไปเป็น **Firebase, Supabase, SQLite, PostgreSQL หรือ REST API**
   - เพียงแค่สร้างไฟล์ใหม่ใน `src/adapters/out/storage/SupabaseFinanceAdapter.ts` ที่ `implements IFinanceRepository`
   - แล้วสลับใน `src/config/container.ts` เพียงบรรทัดเดียว! โค้ดหน้าจอ UI และ Business Logic ใน `core/` จะทำงานได้ทันทีโดยไม่ต้องแก้แม้แต่บรรทัดเดียว

2. **ทดสอบ Business Logic ได้ 100% โดยไม่ต้องพึ่งพา Browser/React:**
   - สูตรคำนวณเงินกู้, การจำลองการโปะ, การคิดดอกเบี้ย อยู่ใน `src/core/usecases/`
   - สามารถเขียน Unit Test ด้วย Jest หรือ Vitest รันได้เร็วระดับมิลลิวินาที

3. **รองรับทั้ง PC และ Mobile อย่างสมบูรณ์:**
   - Desktop: ตาราง Excel-like จัดเต็ม พร้อม Progress Bar
   - Mobile: เมนู **Mobile Bottom Navigation Bar** และ Card List แตะเช็กลิสต์ด้วยมือเดียวได้สะดวก

---

## 💻 วิธีการรันโปรเจกต์

```bash
# เข้าโฟลเดอร์
cd personal-financial-web

# ติดตั้ง Dependencies
npm install

# รัน Development Server
npm run dev
```

เปิดเบราว์เซอร์ที่: **`http://localhost:5173`**
