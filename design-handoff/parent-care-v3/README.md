# Handoff: Parent Care v3 — mobile app (Thai-first, multi-family, 4 roles)

## Overview
Parent Care is a family elder-care app: medication with photo confirmation, appointments, daily check-ins, caregiver handoff notes, family messaging, documents/billing, emergency requests, and a care dashboard. The design covers 4 signed-in roles, email/password auth, account registration, and multiple "family groups" (บ้าน) a single user can belong to and switch between.

Target codebase: **Sittichai-So/Parent-care** (Expo + React Native + expo-router, TypeScript). Implement in that environment — do not ship the HTML.

## About the Design Files
The files in this bundle are **design references created in HTML**. They are prototypes showing intended look and behavior, not production code to copy. The task is to **recreate these designs inside the existing Expo/React Native app**, using its established patterns (`expo-router` file routes under `src/app/`, context providers under `src/context/`, tokens in `src/constants/theme.ts`, `StyleSheet.create`).

Translation notes for React Native:
- Every HTML value here is CSS px → use the same number as an unitless RN value.
- `box-shadow` → iOS `shadowColor/shadowOffset/shadowOpacity/shadowRadius` + Android `elevation`.
- `border-radius: 999px` → `borderRadius: 999` (pills).
- Horizontal scrollers → `<ScrollView horizontal showsHorizontalScrollIndicator={false}>`.
- Bottom tab bar + centre floating button → custom tab bar (`tabBar` prop) so the raised Emergency button can overlap.
- Icons in the mock are Phosphor duotone/fill. In RN use `phosphor-react-native` (or the repo's existing icon set) with the names listed per screen.
- Fonts: Plus Jakarta Sans (Latin) + Noto Sans Thai (Thai). Load via `expo-font`; Thai text must use a Thai-capable family or Thai glyphs fall back.

## Fidelity
**High-fidelity.** Colors, type sizes, spacing, radii, shadows, motion durations and copy are final. Recreate pixel-accurately using the values in this document. All user-facing copy is Thai and is given verbatim — do not rewrite it.

## Design Tokens

### Colors
| Token | Hex | Use |
| --- | --- | --- |
| navy | `#1e3a8a` | primary actions, header bg, active tab, chart bars |
| navyHover | `#2f4fbe` | pressed/hover primary |
| navySoft | `#2a4ba5` | icon buttons inside navy header |
| navyChip | `#eaf1fe` | soft primary chip bg / active tab chip |
| navyChip2 | `#eef3fd` | secondary button bg |
| navyChip3 | `#dde7fb` | secondary button hover |
| navySelect | `#dbe6fb` | selected rail row |
| pageBg | `#f4f7fd` | app screen background |
| white | `#ffffff` | cards, sheets |
| ink | `#0f172a` | primary text |
| ink2 | `#334769` | body text on light blue |
| ink3 | `#475569` | secondary text |
| muted | `#64748b` | meta text |
| muted2 | `#94a3b8` | timestamps, inactive tab |
| hairline | `#e6ecf7` | card borders |
| divider | `#eef2f9` | in-card row dividers |
| slotBg | `#e8effb` | avatar/photo placeholder bg |
| headerSub | `#bfd3f7` | subtitle text on navy |
| success | `#15803d` / `#166534` | confirmed states |
| successBg | `#dcfce7` | confirmed chip bg |
| warn | `#b45309` | pending states |
| warnBg | `#fef3c7` | pending chip bg |
| amber | `#fbbf24` | badge dot, "พรุ่งนี้" tag, partial chart bar |
| amberText | `#7c4a03` | text on `#fde68a` tag |
| amberTag | `#fde68a` | appointment tag bg |
| danger | `#b91c1c` | emergency |
| dangerBg | `#fee2e2` | emergency chip bg |
| dangerBorder | `#fecaca` | emergency card border |
| readOnlyBg | `#fff7e6` | viewer banner bg |
| welcomeBg | `#dbeafe` | login hero band |
| welcomeArt | `#c7dbfa` | illustration placeholder |
| pageGradient | `linear-gradient(160deg,#dbeafe 0%,#bfdbfe 55%,#a9cdf7 100%)` | canvas behind phones (presentation only, not in-app) |

### Typography
Families: `Plus Jakarta Sans` + `Noto Sans Thai`, weights 400/500/600/700/800.

| Role | Size / weight / extra |
| --- | --- |
| Screen title (in-body) | 18px / 800 |
| Big display (login, member name) | 30–38px / 800 / letter-spacing −0.025em |
| Header title (navy) | 19–20px / 700 / −0.01em |
| Header subtitle | 12.5px / 400 / color headerSub |
| Card title | 15–16.5px / 700 |
| Big number (KPI, money) | 19–30px / 800 / −0.015em |
| Body | 14–15px / 400–500 / line-height 1.4–1.6 |
| Meta / timestamp | 11.5–13px / 400–600 |
| Label above field | 13px / 600 / ink3 |
| Eyebrow (uppercase) | 12–12.5px / 700 / letter-spacing .12–.16em / uppercase |
| Elder body | 15–20px (one step larger than caregiver) |

### Spacing
Screen horizontal padding 18–24px (cards use 18px margin, text blocks 20px). Card padding 12–20px. Gaps: 6 / 8 / 10 / 12 / 14 / 16 / 18 / 22 / 26px. Section header padding: `22–26px top / 10–12px bottom`.

### Radii
`999` pill · `20–26` sheets & hero cards · `16–20` cards · `12–14` inputs, chips, small tiles · `50%` circles.

### Shadows
| Name | CSS | Use |
| --- | --- | --- |
| card-sm | `0 6px 16px rgba(15,23,42,.05)` | list rows |
| card | `0 8px 18px rgba(15,23,42,.06)` | standard cards |
| card-lg | `0 12px 26px rgba(15,23,42,.08)` | hero cards, photo frames |
| card-hover | `0 12px 24px rgba(15,23,42,.11)` | pressed/hover |
| primary | `0 10px 24px rgba(30,58,138,.3–.35)` | primary buttons |
| navy-card | `0 16px 32px rgba(30,58,138,.28)` | dashboard ring card |
| tabbar | `0 -8px 24px rgba(15,23,42,.06)` | bottom bar |
| search | `0 8px 18px rgba(15,23,42,.14)` | search pill on navy |

### Hit targets
Minimum 44px everywhere. Primary buttons 54–62px. Elder action cards 92–96px. Emergency FAB 60px + 4px white border.

## Roles & Access

Login: email + password (`1234` in the mock). No demo-account list on screen.

| Role | Email in mock | Home | Tabs | Can edit |
| --- | --- | --- | --- | --- |
| Caregiver | caregiver@gmail.com | Home | หน้าหลัก · ครอบครัว · ⟨FAB⟩ · แดชบอร์ด · โปรไฟล์ | yes |
| Elder | elder@gmail.com | Elder home | หน้าหลัก · ยาของฉัน · ⟨FAB⟩ · นัดหมาย · ข้อความ | yes (own data only) |
| Admin | admin@gmail.com | Dashboard | แดชบอร์ด · สิทธิ์ · ⟨FAB⟩ · บันทึกระบบ · โปรไฟล์ | yes |
| Viewer | viewer@gmail.com | Home | หน้าหลัก · ครอบครัว · ⟨FAB⟩ · ปฏิทิน · แจ้งเตือน | **no** |

Rules that must hold in code:
1. **Navigation guard** — a role can only reach screens in its own screen list. Any navigation to a screen outside the role's list is a no-op (in the mock, `go()` checks the role's rail before setting state). Route guards in `expo-router` should redirect to the role home.
2. **Elder scoping** — elder sees only their own data. Header text is elder-scoped ("สวัสดีครับ / คุณแม่สมใจ · ยังไม่ได้เช็กอินวันนี้"), the medication person-switcher is hidden entirely, the "ดูแดชบอร์ดการทานยา" link is hidden, and "ผู้บันทึก" shows the elder, not the caregiver. No other member's name, status, adherence or expense is rendered anywhere in the elder tree.
3. **Viewer read-only** — every mutating handler is gated: task toggle, checklist toggle, open camera / shoot / confirm medication / reset, add handoff note, add vital, send message, save reminder, ping member, add family group. Gated controls render at `opacity .45`, `cursor: not-allowed`, `aria-disabled` (RN: `disabled` + `accessibilityState={{disabled:true}}`), and inputs show read-only placeholders ("ดูได้เท่านั้น — ส่งข้อความไม่ได้"). A banner sits at the top of the scroll area: bg `#fff7e6`, radius 14, padding 12/14, grid `24px 1fr` gap 10, icon `Eye` 20px `#b45309`, text 13px `#7c4a03` — "โหมดดูได้เท่านั้น — บันทึกและยืนยันข้อมูลไม่ได้".

## Family groups (multi-house)

A user can belong to several groups and switch between them; one is the default that opens on sign-in. Groups can be added during registration and any time later from the header.

- Group model: `{ id, name, kind, members }`, `kind ∈ parents | partner | relatives | other`.
- Kind labels/icons: บ้านพ่อแม่ `HouseLine` · บ้านแฟน `Heart` · บ้านญาติ `UsersFour` · บ้านอื่น `Buildings`.
- Seeded: `บ้านพ่อแม่` (parents, 4 คน, default) and `บ้านแฟน` (partner, 3 คน).
- Header pill (in navy header, above the title): bg `#2a4ba5`, radius 999, padding 6/12, min-height 36, 12.5px/700 white, kind icon 16px + name (ellipsized) + `CaretDown` 12px.
- Tapping it opens a bottom sheet: white, radius `24 24 0 0`, padding `20 20 34`, slide-up 240ms `cubic-bezier(.2,.8,.2,1)`, scrim `rgba(15,23,42,.34)` fading 160ms. Title "กลุ่มบ้านของฉัน" 17px/800 + close button 40×40 radius 12 bg `#f4f7fd`.
- Each row: border 2px (`navy` if active else hairline), radius 16, padding 12/14, grid `42px 1fr auto`; icon tile 42×42 radius 13 bg navyChip; name 15/700; meta `"<kind label> · <n> คน"` + `" · เริ่มต้น"` when default; trailing `CheckCircle` navy when active else `CaretRight` muted2. Below the row a full-width 44px button toggles default: active `bg #dbe6fb / navy`, else `bg #f4f7fd / muted`, star icon fill when default, label "กลุ่มเริ่มต้น" / "ตั้งเป็นค่าเริ่มต้น".
- "เพิ่มบ้านที่ต้องไปดูแล" block at the bottom of the sheet: bg `#f4f7fd` radius 16 padding 14, name input (52px, radius 13, white), kind chips (44px pills; active navy/white, idle `#eef3fd`/ink2), and a navy 50px "เพิ่มบ้าน" button with `PlusCircle`. Empty name is a no-op; the first group added becomes default automatically.
- Removing a group reassigns default and active group to the first remaining one.

## Screens

Global chrome (all signed-in screens except Login/Register):

- **Navy header** — bg navy, padding `52 20 24`, white text. Row: group pill + title + subtitle on the left (flex 1, min-width 0); on the right two 44×44 radius-14 `#2a4ba5` icon buttons (`ChatTeardropDots` → messages, `Bell` → notices). The bell shows a 9px amber dot at top 9 right 10 with a 2px `#2a4ba5` ring while anything needs attention.
- **Search pill** — under the header row, margin-top 18, white, radius 999, padding `0 16`, min-height 52, shadow search; `MagnifyingGlass` 20px muted, input 14.5px placeholder "ค้นหายา นัดหมาย สมาชิก...", `Microphone` 20px navy.
- **Bottom tab bar** — white, top border `#e8eef9`, padding `10 8 26`, shadow tabbar. Each tab: flex 1, min-height 56, column, gap 5; icon inside a 38×32 radius-12 chip (`#eaf1fe` when active, transparent otherwise), icon 22px, label 11px/600 (navy active, `#94a3b8` idle). The 3rd slot is an empty spacer holding room for the FAB.
- **Emergency FAB** — absolutely positioned, `left 50% / bottom 56`, translateX(-50%), 60×60 circle navy, 4px white border, `PhoneCall` fill 26px white, breathing shadow 2.6s (`0 10px 22px rgba(30,58,138,.4)` ⇄ `0 10px 34px rgba(30,58,138,.62)`). Caption "Emergency" 11px/700 navy at bottom 38.
- **Screen enter animation** — `translateY(12px) → 0`, opacity 0 → 1, 300ms ease-out. Sheets slide up 240–260ms. All motion respects reduced-motion.

### 01 Login
Hero band 246px bg `#dbeafe`; illustration placeholder inset `56 40 78`, radius 18, bg `#c7dbfa`, shadow `0 16px 34px rgba(30,58,138,.18)`. A white SVG wave overlays the bottom 70px: `viewBox="0 0 402 70"`, `path d="M0 34C86 4 150 62 236 44 300 31 348 8 402 22V70H0Z"`.

Body padding `2 30 36`: "เข้าสู่ระบบ" 15.5px muted · "Parent Care" 30px/800. Fields (52–54px, radius 14, bg `#f4f7fd`, padding `0 14`, 20px navy leading icon `EnvelopeSimple` / `LockKey`, 15px input): อีเมล (placeholder `caregiver@gmail.com`), รหัสผ่าน (placeholder `1234`). Primary "เข้าสู่ระบบ" 56px navy radius 16, 17px/700, trailing `ArrowRight`. Status line under it: success green `#15803d`, error `#b91c1c` — "อีเมลหรือรหัสผ่านไม่ถูกต้อง (ใช้ 1234)".

Then a hairline "หรือ" divider, secondary "สร้างบัญชีใหม่" 54px `#eef3fd` navy radius 16 with `UserPlus`, and a muted note "ลืมรหัสผ่าน? ติดต่อผู้ดูแลกลุ่มบ้านของคุณ".

### 02 Register (2 steps)
Navy header `52 24 22`: back button 40×40 radius 12 `#2a4ba5` with `CaretLeft`, "สร้างบัญชี" 20px/700, "ขั้นที่ N จาก 2" 12.5px headerSub, and a 2-segment progress bar (4px, radius 2; step 2 segment `rgba(255,255,255,.3)` until reached). Body bg `#f4f7fd`, padding `18 24 36`.

**Step 1 — account.** Fields (54px, radius 14, white, shadow card-sm): ชื่อที่ใช้แสดง (`คุณสมชาย`), อีเมล (`you@gmail.com`), รหัสผ่าน (`อย่างน้อย 4 ตัวอักษร`). Role picker — three 64px cards, grid `40px 1fr 22px`, border 2px (navy + bg navyChip when selected), 40×40 icon tile, title 14.5/700, detail 12.5 muted, trailing `CheckCircle` fill navy / `Circle` `#cbd5e1`:
- Caregiver `UserFocus` — "ดูแลและจัดการยา นัดหมายของทุกคน"
- Elder `HandHeart` — "เห็นเฉพาะเรื่องของตัวเอง จอใหญ่ ปุ่มน้อย"
- Viewer `Eye` — "ดูข้อมูลได้ แต่แก้ไขไม่ได้"

Primary "ต่อไป · กลุ่มบ้าน" 56px navy. Validation: name + email required, password ≥ 4 chars, else warn text "กรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 4 ตัวอักษร".

**Step 2 — groups.** "กลุ่มบ้านของคุณ" 16px/800 + explainer "เพิ่มได้หลายกลุ่ม เช่น บ้านพ่อแม่ บ้านแฟน หรือบ้านญาติ แล้วเลือกกลุ่มที่จะเปิดเป็นค่าเริ่มต้น". Group cards (border 2px navy when default, radius 16, grid `42px 1fr auto`, 40×40 trash button that turns `#b91c1c` on hover) each with the default-toggle button described in *Family groups*. Then the same "เพิ่มกลุ่มบ้าน" block (white card here). Finish with "สร้างบัญชีและเริ่มใช้งาน" 58px navy and a text "ย้อนกลับ". Finishing signs in with the chosen role and opens the default group.

### 03 Home (caregiver / viewer)
1. **Booking strip** — margin `-14 18 0`, bg `#eaf1fe`, radius 18, padding 12, row gap 12, shadow `0 12px 26px rgba(30,58,138,.14)`: 92×64 radius-12 tile `#d5e4fb` with `CalendarPlus` 30px navy, then a navy 52px "จองนัดหมาย" button with `ArrowRight`.
2. **นัดหมายของคุณ** section header 16px/700 + "ดูทั้งหมด" navy 14px/600 → calendar. Card (white, radius 18, padding 16, shadow card-lg): kind 14.5/600 navy + amber tag pill ("พรุ่งนี้"); rows `CalendarDots` date, `Clock` time, `MapPin` place (15px, icons 20px navy); divider `#e6ecf7`; footer doctor 15/700 + dept 13 muted and a 44px "ส่งข้อความ" chip (`#eef3fd`, radius 12, 13.5/600).
3. **สมาชิกในบ้านวันนี้** + "ดูทั้งหมด" → family. Horizontal cards 132px wide: white, border 1px status-tinted, radius 18, padding 12; 72px initials tile (radius 12, bg slotBg, navy 24px/800); name 14.5/700 ellipsized + status icon 18px; detail 12.5 muted.
4. **ยาวันนี้ · รวมของฉัน** — one row per person with medication (me / dad / mom): 72px, grid `44px 1fr auto`, white, radius 16, 44px chip tile (successBg/warnBg) with `CheckCircle`/`Pill`, title `"ยาของฉัน · 13:00"` / `"ยาของพ่อ · 12:00"`, detail `"<drug> · ยืนยันพร้อมรูปแล้ว HH:MM"` or `"<drug> · รอถ่ายภาพยืนยัน"`, trailing status 12.5/700 in the status colour. Tapping opens the medication flow for that person.
5. **งานอื่นวันนี้** — Check-in (done) and Appointment (in-progress) rows, 68px, same anatomy, tap toggles status (caregiver only).
6. Timeline / emergency button: full-width 60px outline `2px #fecaca`, `#b91c1c` text, `FirstAidKit` icon → emergency sheet.

### 04 Family
Title "สมาชิกในบ้าน" 18/800. Rows: white, border 1px status-tinted, radius 18, padding 14, min-height 92, grid `64px 1fr 22px`; 64px initials tile radius 16; name 16.5/700 + relation 13 muted; status pill (bg/ink per status, 12.5/700, radius 999, icon 15px); detail 13.5 ink3; `CaretRight` 18px muted2. Order: attention first. Members: คุณสมชาย (ฉัน) · พ่อประสิทธิ์ · แม่สมใจ · พี่เกษม. Initials: สช / ปส / สม / กษ.

Status meta — ปกติ `#15803d` on `#dcfce7`, `CheckCircle`; ต้องติดตาม `#b45309` on `#fef3c7`, `ClockCountdown`; ต้องช่วยเหลือ `#b91c1c` on `#fee2e2`, `WarningCircle`.

### 05 Member detail
Back chip "สมาชิกในบ้าน" (`#eef3fd`, 44px, `CaretLeft`). Hero card: white radius 20 padding 16 shadow card-lg, grid `132px 1fr` gap 16 — 132×150 photo slot (radius 16, bg slotBg, user-droppable image) + role eyebrow, name 24/800, status pill. Three vitals tiles (radius 16, padding 13, icon 20px navy, value 19/800, label 11.5 muted): `128/82` ความดัน 08:40 `Heartbeat` · `74` ชีพจร `Pulse` · `102` น้ำตาล 07:10 `Drop`. Info card rows (13px vertical padding, dividers `#eef2f9`): ความสัมพันธ์ · สถานะ · ผู้ดูแลวันนี้ "พี่เกษม · 08:00–16:00". Actions: navy 54px "ส่งข้อความเตือน" / after tap "ส่งข้อความเตือนแล้ว" with `BellRinging`; secondary 52px "ยืนยันการทานยา HH:MM" (or "ดูภาพยืนยันการทานยา" when done) — rendered only if that member has medication.

### 06 Medication photo confirmation
Per-person state machine: `idle → camera → review → done`.

Header row: 52px radius-16 `#eaf1fe` tile with `Pill` 28px navy, drug 20/800, subline `"ยา <time> · <person>"` (elder: "ของฉัน").

Person switcher (hidden for elder): horizontal 104px cards, grid `32px 1fr`, min-height 60, radius 16, active navy/white else white/ink; 32px initials tile with a 9px status dot (`#4ade80` done / `#fbbf24` pending); label + time 11.5px.

Step indicator: three equal 4px bars with labels "1 ถ่ายภาพ / 2 ตรวจภาพ / 3 ยืนยัน"; reached = navy bar + navy label, else `#dbe3f2` / `#94a3b8`.

- **idle** — white card radius 20 padding 20: three hint rows (34px `#eaf1fe` tiles, icons `Pill` / `Clock` / `UsersThree`) "ถ่ายให้เห็นเม็ดยาและซองยาในภาพเดียว" · "ระบบบันทึกเวลาถ่ายภาพให้อัตโนมัติ" · "ครอบครัวเห็นภาพและเวลาที่ยืนยันทันที"; navy 58px "ถ่ายภาพยืนยัน" with `Camera`; note "หรือลากรูปจากเครื่องลงกรอบด้านล่างในขั้นตอนถัดไป".
- **camera** — 270px viewfinder: radius 20, `radial-gradient(120% 90% at 50% 40%, #334769, #0f172a)`, inset-26 dashed 2px `rgba(255,255,255,.42)` frame, "กล้อง" label with a pulsing red dot, hint "จัดซองยาให้อยู่ในกรอบ แล้วกดถ่าย", 52px white shutter circle with `rgba(255,255,255,.45)` 4px ring. Below: 52px "ยกเลิก".
- **review / done** — 250px photo frame (radius 20, bg slotBg) holding the captured/dropped image, plus a stamp pill at top-left (white, radius 999, padding 8/14, 13px/700, shadow, pop-in 400ms `cubic-bezier(.2,.8,.2,1)`): pending `ClockCountdown` `#b45309` "รอการยืนยัน" / done `CheckCircle` `#166534` "ยืนยันแล้ว HH:MM". Detail card: "เวลาถ่ายภาพ" and "ผู้บันทึก" (the signed-in person — elder sees themself). Review actions: navy 58px "ทานแล้วและยืนยัน" + `#eef3fd` 52px "ถ่ายใหม่" with `ArrowCounterClockwise`. Done actions: "ดูแดชบอร์ดการทานยา" (hidden when the role has no dashboard) + "เริ่มขั้นตอนใหม่ (สาธิต)". Status line: "บันทึกเวลา HH:MM · ครอบครัวเห็นแล้ว" / "ตรวจภาพให้ชัดเจน แล้วกดยืนยันเพื่อบันทึก".

Seeded medications: me `Metformin 500 mg` 13:00 idle · dad `Amlodipine 5 mg` 12:00 idle · mom `Simvastatin 10 mg` 20:00 done (shot 08:30, confirmed 08:32).

### 07 Calendar
Title "ปฏิทินครอบครัว". Date strip: horizontal 64px tiles, min-height 84, radius 18, centred column; idle white/ink with shadow card-sm, selected navy/white with `0 12px 24px rgba(30,58,138,.32)`; day label 12.5/600 (opacity .8), date 22/800, and a 6px dot (amber on selected, navy on idle, transparent when no appointment). Days 25–30 April; appointments on 25, 26, 28, 29 (29 = the signed-in user's own annual check-up), 30.

Appointment card: white radius 20 padding 16 shadow card-lg — title 16.5/800 + amber tag; rows `CalendarDots` "date · time", `MapPin` place, `UserFocus` who. Data:
- 25: ตรวจสุขภาพ · อายุรกรรม — ศุกร์ 25 เมษายน 08:00 · โรงพยาบาลกรุงเทพ · หมอพงศ์ (อายุรกรรม) · ผู้พา: พี่เกษม · tag "พรุ่งนี้"
- 26: รับยาต่อเนื่อง 3 เดือน — 12:00 · ห้องยาผู้ป่วยนอก ชั้น 2 · เภสัชกรวิภา · ผู้พา: คุณสมชาย
- 28: นัดหมอหัวใจ — 15:30 · ศูนย์หัวใจ ชั้น 4 · หมอวราภรณ์ · ผู้พา: พี่เกษม
- 29: ตรวจสุขภาพประจำปี (ของฉัน) — 07:30 · ศูนย์ตรวจสุขภาพ ชั้น 3 · หมอณัฐ · ผู้เข้ารับ: คุณสมชาย (ฉัน) · tag "ของฉัน"
- 30: กายภาพบำบัดเข่า — 10:00 · แผนกกายภาพ ชั้น 1 · ครูกิ่ง · ผู้พา: แม่สมใจ

Checklist "Checklist ก่อนไป": 56px rows, white radius 14, grid `26px 1fr`, `CheckCircle` fill `#15803d` when done else `Circle` `#94a3b8`, done text muted + line-through. Items: บัตรประชาชน · สิทธิ์การรักษา (done) · รายการยาที่ใช้อยู่ · งดน้ำงดอาหารหลัง 22:00. Footer navy 56px "บันทึกเตือนก่อนวันนัด" → "บันทึกเตือนแล้ว ✓".

### 08 Messages
Title "ข้อความครอบครัว". Bubbles: max-width 86%, radius 16, padding 13/15, shadow card-sm; own messages navy bg / white text aligned right with `#bfd3f7` name+time, others white / ink aligned left with navy name and `#94a3b8` time. Name 12.5/700, body 14.5/1.55, time 11.5. Seed: พี่เกษม 10:22 "เตรียมเอกสารเรียบร้อย พรุ่งนี้ผมไปรับพ่อเอง" · แม่สมใจ 08:33 "ยืนยันว่าวันนี้ปกติดี ทานยาแล้วนะ" · คุณสมชาย 07:58 (own) "อรุณสวัสดิ์ครับ ฝากช่วยเตือนพ่อเรื่องยา 12:00 ด้วย". Composer: 52px white pill input + 52px navy circle send button with `PaperPlaneRight`. New messages append at the bottom with the current clock time.

### 09 Notices
Title "การแจ้งเตือน" (subtitle "4 รายการใหม่"). Rows: white radius 16 padding 14, grid `44px 1fr`; 44px radius-13 chip tile; title 14.5/700 + time 11.5 muted2; detail 13.5 ink3.
- ยา 12:00 ยังไม่ยืนยัน — พ่อประสิทธิ์ · Amlodipine 5 mg — 5 นาที — `Pill` warn
- Check-in สำเร็จ — แม่สมใจยืนยันว่าปกติดี — 08:32 — `CheckCircle` success
- นัดตรวจพรุ่งนี้ 08:00 — โรงพยาบาลกรุงเทพ · หมอพงศ์ — 10:20 — `CalendarDots` navy
- พี่เกษมรับผิดชอบพาไป — มอบหมายงานในครอบครัวแล้ว — เมื่อวาน — `UsersThree` navy

### 10 Profile
Identity card: 64px navy-on-`#e8effb` initials circle "สช", name "คุณสมชาย" 19/800, "Owner · caregiver@gmail.com" 13.5 muted.

**ข้อมูลสุขภาพของฉัน** — two 72px rows: "ยาของฉัน · 13:00" (status chip + label like the home medication rows) → medication flow for me; "นัดหมายของฉัน / ตรวจสุขภาพประจำปี · 29 เม.ย. 07:30" with `CalendarHeart` → calendar on day 29.

**บันทึกส่งต่อเวร** — textarea 3 rows (white, radius 16, padding 14, 14.5/1.55) + navy 52px "บันทึก"; then note cards (white radius 16 padding 14, who 14/700 + time 11.5 muted2, text 14 ink3). Seed: พี่เกษม 10:20 "รับผิดชอบจัดเตรียมเอกสารไปโรงพยาบาลพรุ่งนี้ 09:00" · พี่เกษม 08:45 "แม่สมใจทานยาเช้าแล้ว เพิ่ม photo confirmation ในระบบ". New notes prepend as คุณสมชาย with the current time.

**เอกสารและสิทธิ์** — rows grid `40px 1fr auto`, icon 26px navy, name 14.5/700, meta 12.5 muted, kind pill (`#eef3fd`/navy, 11.5/700):
- บัตรประชาชน — แม่สมใจ · อัปเดต 2 มิ.ย. 2568 · ID · `IdentificationCard`
- สิทธิ์บัตรทอง — พ่อประสิทธิ์ · ใช้ได้ถึง 31 ธ.ค. 2568 · สิทธิ์ · `SealCheck`
- ประกันสุขภาพกลุ่ม · กรมธรรม์ 4482-119 · ประกัน · `ShieldCheck`
- ใบรับรองแพทย์ · ออก 4 ส.ค. 2568 · หมอพงศ์ · PDF · `FileText`

### 11 Dashboard (caregiver / admin)
Header row: "ภาพรวมการดูแล" 18/800 + a segmented range control (bg `#e6edfb`, radius 999, padding 4; each 36px pill 12.5/700, active navy/white) — 7 วัน / 30 วัน / 3 เดือน.

**Adherence card** — navy, radius 22, padding 20, shadow navy-card, grid `112px 1fr` gap 18. Ring: 112px SVG, `r=52`, track `rgba(255,255,255,.22)` 11px, progress `#fbbf24` 11px round cap, `stroke-dasharray 327`, offset `327 − 327·pct/100`, rotated −90°, 600ms `cubic-bezier(.3,.7,.2,1)` transition. Centre: `NN%` 30/800 + "ทานยาตรงเวลา" 11px headerSub. Right: headline "ทุกคนทานยาครบวันนี้" / "เหลือยาที่ยังไม่ยืนยัน N รายการ" 15/700, sub "จาก 21|90|270 ครั้งที่กำหนด · พลาด N ครั้ง · ตรงเวลาเฉลี่ย 08:12".

**KPI tiles** — 3 up, white radius 16 padding 13: `CheckCircle` success "ยืนยันพร้อมรูป" · `WarningCircle` warn "พลาด / เลยเวลา" · `Hospital` navy "3 นัดหมายเดือนนี้". Value 21/800.

**การทานยารายวัน** — card radius 20 padding 18; 7 bars, height `max(14, pct/100 × 78)`, radius `8 8 4 4`, navy at 100% else amber, percent label above (navy/warn), day letter below (จ อ พ พฤ ศ ส อา) 10.5 muted2. Values 100/100/67/100/100/67/(100 when all confirmed else 67).

**รายคน** — rows grid `44px 1fr auto`: 44px initials tile, name 14.5/700 + pct 12.5/700 (≥95 success, ≥85 navy, else warn), a 7px track `#eef2f9` with a filled bar (500ms width transition), note "ยืนยันครบวันนี้ · <drug>" / "รอยืนยัน <time> · <drug>" / "ผู้ดูแล · บันทึกให้ 12 ครั้ง". Base percentages me 88 · dad 76 · mom 100 · brother 96, +12 (max 100) once that person's medication is confirmed.

**ค่าใช้จ่ายเดือนนี้** — 30/800 "4,280" + "บาท · 6 รายการ"; a 12px stacked bar radius 6 (navy 15% ค่ายา 620 · `#5b7fd4` 44% ค่าตรวจอายุรกรรม 1,900 · amber 41% ค่าเดินทางโรงพยาบาล 1,760) with a legend below (9px dots).

### 12 Elder home (elder only)
Greeting card: white radius 22 padding 20 shadow card-lg, centred — "สวัสดีครับ คุณแม่สมใจ" 26/800, status line 17px ink3 ("วันนี้เหลือยา 20:00 อีกอย่างเดียว" / "บอกครอบครัวแล้วว่าวันนี้สบายดี"), then a 64px check-in button radius 18, 19/700 with `HandHeart` fill 26px — navy "ฉันสบายดี" → `#15803d` "เช็กอินแล้ววันนี้".

Four 92px action cards: white, border 2px, radius 20, padding 14, grid `56px 1fr 22px`, 56px radius-18 icon tile (icon 32px), label 20/800, detail 15 muted, `CaretRight` 20px:
- ยาของฉัน — "<drug> · <time>" — `Pill` navy, border `#dbe6fb`
- นัดหมายของฉัน — "ดูวันตรวจและสถานที่" — `CalendarHeart`
- ข้อความครอบครัว — "คุยกับลูกและผู้ดูแล" — `ChatTeardropDots`
- ต้องการความช่วยเหลือ — "ส่งคำขอไปยังครอบครัว" — `Siren` `#b91c1c`, tile `#fee2e2`, border `#fecaca`

### 13 Members & access (admin)
Title "สมาชิกและสิทธิ์การเข้าถึง". Cards: white radius 18 padding 14; top grid `44px 1fr auto` — 44px initials tile, name 15/700 + email 12.5 muted, role pill (caregiver navyChip/navy · elder warnBg/warn · viewer `#f1f5f9`/`#475569`). Below, wrapping permission chips (radius 999, padding 6/11, 11.5/600, icon 14px): granted `#dcfce7`/`#166534`, denied `#fee2e2`/`#b91c1c`, neutral `#f1f5f9`/`#475569`.
- คุณสมชาย · caregiver@gmail.com · Caregiver — จัดการยา · จัดการนัดหมาย · ดูเอกสาร
- แม่สมใจ · elder@gmail.com · Elder — ยาของตัวเอง · ไม่เห็นข้อมูลคนอื่น (denied, `EyeSlash`)
- พี่เกษม · kasem@gmail.com · Caregiver — บันทึกส่งต่อเวร · จัดการยา
- ป้าวรรณ · viewer@gmail.com · Viewer — ดูได้เท่านั้น

### 14 Audit log (admin)
Title "บันทึกการใช้งานระบบ". Rows: white radius 16 padding 13/14, grid `40px 1fr`, 40px chip tile, title 14/700 + time 11.5 muted2, detail 13 ink3.
- ยืนยันการทานยาพร้อมรูป — คุณสมชาย · <drug> — 5 นาที — `Camera` success
- เข้าสู่ระบบ — elder@gmail.com · อุปกรณ์ iPhone — 08:30 — `SignIn` navy
- แก้ไขสิทธิ์สมาชิก — ป้าวรรณ เปลี่ยนเป็น Viewer — เมื่อวาน — `ShieldCheck` warn
- เพิ่มเอกสาร — ใบรับรองแพทย์ อายุรกรรม — 2 วันก่อน — `FilePlus` navy
- ส่งคำขอฉุกเฉิน — แม่สมใจ · แจ้ง 3 คนในครอบครัว — 3 วันก่อน — `Siren` danger

### Emergency sheet (all roles)
Scrim `rgba(15,23,42,.36)`, sheet white radius `26 26 0 0` padding `22 22 38`, slide-up 260ms. Header: 52px radius-16 `#fee2e2` tile with `Siren` 28px `#b91c1c`; eyebrow "ฉุกเฉิน" 12/700 uppercase `#b91c1c`; title "ต้องการความช่วยเหลือ" 20/800 → "ส่งคำขอแล้ว". Body 15px ink3: "ระบบจะแจ้งครอบครัวทุกคนพร้อมตำแหน่งของคุณทันที" → "ครอบครัวทั้ง 3 คนได้รับแจ้งเตือนพร้อมตำแหน่งของคุณแล้ว". Actions: 58px `#b91c1c` "ใช่ ต้องการความช่วยเหลือ" (hover `#d02b2b`) + 52px `#eef3fd` navy "ปิด".

## Interactions & Behavior
- Press feedback: `transform: scale(.98–.985)` for 120ms on cards/buttons; hover raises shadow one step.
- Tab / rail navigation replaces the screen with a 300ms rise; no cross-fade.
- Medication flow gates confirmation behind having a photo: `idle` blocks confirm, `review` enables it, `done` stamps the frame.
- Task rows and checklist rows are toggles (optimistic local state).
- Adding a vital, note or message prepends/appends with the current `HH:MM` and clears the input; empty input is a no-op.
- Emergency sheet has a two-stage body (ask → sent) and never auto-dismisses.
- Notification dot and home attention banner derive from "any member has non-normal status".
- All animations sit behind `prefers-reduced-motion` (RN: `AccessibilityInfo.isReduceMotionEnabled`).

## State Management
Put this in a context provider (extend the repo's `family-context.tsx`, add an `auth-context` for role):

```
auth:    { role, email, displayName }            // role ∈ caregiver|elder|admin|viewer
groups:  { groups[], activeGroupId, defaultGroupId }
meds:    { [personId]: { drug, at, stage, shotTime, doneTime } }   // stage: idle|camera|review|done
people:  [{ id, name, relation, role, status, initials, detail }]  // status: normal|monitor|urgent
tasks:   [{ id, title, detail, status }]          // done|pending|in-progress
checklist, notes[], messages[], vitals[]
ui:      { screen, member, medTarget, day, range, groupMenuOpen, emergency, emergencySent, checkedIn, pinged, reminder }
```

Derived, not stored: member status (from medication stage), attention count, adherence %, dashboard chart, header title/subtitle (role-scoped), `canEdit` (from role).

Persistence for the real app: auth + groups + default group in secure/async storage; medications, notes, messages, vitals server-side.

## Assets
No bitmap assets ship with this design. Three image placeholders are meant to be filled with the user's own photos:
- Login illustration (hero band)
- Member detail portrait (132×150)
- Medication confirmation photo (250px frame, per person)

In the RN app these become `Image` with a real source: the login art from `assets/`, the portrait from the member record, the medication photo from `expo-camera` / `expo-image-picker`. Everything else is Phosphor icons (duotone for decorative, fill for state) and typography.

## Files
- `Parent Care v3.dc.html` — the full design source (all screens, all roles, live logic). Read this for any value not spelled out above.
- `Parent Care v3.html` — self-contained offline build; open in a browser to click through the prototype.
- `image-slot.js`, `ios-frame.jsx`, `support.js` — support files the design source loads (device frame, droppable image placeholder, runtime). Not part of the app to build.

## Screen map to the existing repo
| Design screen | Repo file to change / add |
| --- | --- |
| 01 Login | `src/app/login.tsx`, `src/context/auth-context.tsx` |
| 02 Register | new `src/app/register.tsx` |
| 03 Home | `src/app/(tabs)/index.tsx` |
| 04 Family | `src/app/(tabs)/index.tsx` (member list) |
| 05 Member detail | `src/app/family-member.tsx` |
| 06 Medication confirmation | `src/app/medication-confirm.tsx` |
| 07 Calendar | `src/app/appointment-detail.tsx` + new calendar route |
| 08 Messages | new route |
| 09 Notices | new route |
| 10 Profile | new route (handoff notes, documents, my health) |
| 11 Dashboard | new route |
| 12 Elder home | `src/app/(tabs)/explore.tsx` |
| 13 Members & access | new admin route |
| 14 Audit log | new admin route |
| Emergency sheet | `src/app/emergency.tsx` |
| Group switcher | new component + group context |
