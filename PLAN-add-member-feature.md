# แผนแก้ไข "หน้าบ้าน" — เพิ่มสมาชิกแบบ 3 ทาง

คู่กับแผนฝั่ง backend (`PLAN-add-member-feature.md` ในโปรเจกต์ `parent-care-backend`) — ไฟล์นี้ครอบคลุมฝั่งแอปเท่านั้น

**3 ทางที่ต้องรองรับ:**
1. รหัสเชิญกลุ่ม (มีอยู่แล้ว — ไม่แก้)
2. เพิ่มสมาชิก **ไม่มีบัญชี** (กรอกข้อมูลแทนได้เลย เช่น คุณตาคุณยาย)
3. **ค้นหาบัญชี** (อีเมล/รหัสประจำตัว) แล้วส่งคำขอ → รออีกฝ่ายกดยอมรับ

---

## 1. `src/services/households-api.ts` — เพิ่มฟังก์ชันเรียก API ใหม่
- `createManagedMember(householdId, payload)` → `POST /households/:id/members`
- `lookupUser(query: { code?: string; email?: string })` → `GET /users/lookup`
- `inviteExistingUser(householdId, userId, role, displayName, relation)` → `POST /households/:id/members/invite`
- `getPendingInvites()` → `GET /users/me/pending-invites`
- `acceptInvite(householdId, memberId)` / `declineInvite(householdId, memberId)`
- `generateClaimCode(householdId, memberId)` → `POST .../generate-claim-code`
- `claimMembership(claimCode)` → `POST /households/claim`

## 2. `src/context/family-context.tsx` — state และ action ใหม่
- เพิ่ม state: `pendingInvites` (คำขอที่ค้างรอเรา), `refreshPendingInvites()` เรียกรวมใน `refreshAll()`
- เพิ่ม action: `addManagedMember`, `searchUserForInvite`, `inviteExistingUser`, `acceptInvite`, `declineInvite`, `generateClaimCode`, `claimMembership` — ทุกตัว async + เรียก `refreshAll()` หลังสำเร็จ ตาม pattern เดิมของไฟล์นี้ทั้งหมด
- `familyMembers` ที่ map มาจาก households-api ต้องกรอง/แนบ `membershipState` มาด้วย เพื่อให้ UI แยก active vs pending ได้

## 3. หน้าจอใหม่/แก้ไข

### `src/app/add-member.tsx` **(ไฟล์ใหม่)**
หน้าเดียว มี segmented control 3 แท็บ (ใช้ `ChipSelect` แบบเดียวกับ `household-setup.tsx`):
- **"แชร์รหัสเชิญ"** — ย้าย UI การ์ดรหัสเชิญจาก [(tabs)/index.tsx](src/app/(tabs)/index.tsx#L147-L158) มาไว้ที่นี่แทน (ของเดิมไม่ต้องแก้ logic แค่ย้ายที่)
- **"เพิ่มแทน (ไม่มีบัญชี)"** — ฟอร์ม `TextField`: ชื่อ, ความสัมพันธ์, `ChipSelect` เลือก role (จำกัดแค่ ผู้สูงอายุ/ดูอย่างเดียว ตามที่ backend บังคับ), วันเกิด (optional) → เรียก `addManagedMember`
- **"ค้นหาบัญชี"** — `TextField` กรอกอีเมลหรือรหัสประจำตัว → ปุ่มค้นหา → เรียก `searchUserForInvite` โชว์ผลลัพธ์ 1 รายการ (ชื่อ + รหัส) → ยืนยัน role/ความสัมพันธ์ → เรียก `inviteExistingUser` → แจ้งผลเป็น "ส่งคำขอแล้ว รอเขายอมรับ"

เข้าถึงหน้านี้จากปุ่ม "+" หรือการ์ดรหัสเชิญเดิมใน `(tabs)/index.tsx`

### `src/app/(tabs)/index.tsx` — แก้ไข
- ย้ายการ์ดรหัสเชิญ (บรรทัด ~147-158) ไปหน้า `add-member.tsx` ตามข้างบน เหลือแค่ปุ่ม/การ์ดสั้นๆ "เพิ่มสมาชิก" ที่พาไปหน้านั้น
- เพิ่ม `NotificationBanner`-style การ์ดด้านบนสุด (ก่อนรายการสมาชิก) ถ้ามี `pendingInvites.length > 0` — โชว์ "มีคำขอเข้าร่วมกลุ่มจาก [บ้าน] — [ปุ่มยอมรับ] [ปุ่มปฏิเสธ]"
- รายการสมาชิกในหน้านี้ ต้องแสดง badge เพิ่ม 2 แบบ:
  - สมาชิกไม่มีบัญชี → badge "ไม่มีบัญชี" (เทาๆ) + ปุ่มเล็ก "สร้างรหัสผูกบัญชี" (เรียก `generateClaimCode` แล้วโชว์รหัสให้แชร์ ผ่าน `Alert`/`Share` เหมือนรหัสเชิญกลุ่ม)
  - สมาชิกที่ส่งคำขอไปแล้วรอเขายอมรับ (`membershipState: 'pending'`) → badge "รอการยืนยัน" (เหลืองๆ ใช้ `StatusBadge tone="warning"`)

### `src/app/family-member.tsx` — แก้ไข
- ถ้าเปิดโปรไฟล์สมาชิกไม่มีบัญชี ให้ซ่อนปุ่ม/แอคชันที่ต้องทำโดยเจ้าตัวเอง (เช่น เช็คอินเอง) เพราะเจ้าตัวไม่มีแอปให้กด — คงไว้แค่สิ่งที่ผู้ดูแลทำแทนได้ (บันทึกยา, นัดหมาย, vitals)

### `src/app/household-setup.tsx` — แก้ไข
- เพิ่ม mode ที่ 3 ในหน้านี้ (นอกจาก "สร้างกลุ่มใหม่"/"เข้าร่วมด้วยรหัส") คือ **"ผูกบัญชีกับโปรไฟล์เดิม"** — กรอก claimCode → เรียก `claimMembership` → เข้ากลุ่มพร้อมประวัติเดิมของโปรไฟล์นั้นทันที (ไม่ใช่สร้างสมาชิกใหม่)

### หน้าโปรไฟล์ผู้ใช้ (ถ้ายังไม่มี อาจต้องสร้างเพิ่ม เช่น `src/app/profile.tsx`)
- โชว์ `userCode` ของตัวเอง (ที่ backend เพิ่มมาใน `/auth/login`, `/auth/register`) พร้อมปุ่มคัดลอก/แชร์ ให้คนอื่นเอาไปค้นหาแล้วส่งคำขอเชิญได้

## 4. `src/context/auth-context.tsx`
- เพิ่ม `userCode` เข้า `User` type ให้ตรงกับ field ใหม่ฝั่ง backend

## 5. Deep link จาก notification (ถ้ามีคำขอเข้ากลุ่มใหม่)
- ถ้าต้องการแจ้งเตือนแบบ push/local ตอนมีคำขอเข้ากลุ่มใหม่ ต้องรอ backend ทำ webhook/poll ก่อน ยังไม่รวมในรอบนี้ — รอบนี้ใช้วิธี badge ในแอปตอนเปิดแอป/ pull-to-refresh พอ

---

## ลำดับที่แนะนำให้ทำ
1. Backend: model + migration + endpoint พื้นฐาน (`members` POST, `lookup`) ก่อน — ทดสอบผ่าน curl ให้ครบ
2. Backend: invite/accept/decline + claim flow
3. Frontend: `households-api.ts` + `family-context.tsx`
4. Frontend: หน้า `add-member.tsx` + แก้ `(tabs)/index.tsx`
5. Frontend: claim flow ใน `household-setup.tsx` + หน้าโปรไฟล์แสดง `userCode`
6. ทดสอบ end-to-end ทั้ง 3 ทางอีกครั้งด้วย curl/สมมติ 2 บัญชี ก่อนใช้งานจริง
