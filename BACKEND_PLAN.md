# 365 CRM: Backend Plan

**Stack:** Node.js + Express.js + MongoDB (Mongoose), ES Modules
**Frontend (planned next):** React (Vite) + JS + Tailwind CSS
**Goal:** Role-based CRM that tracks the whole lead life cycle: create → follow up → change status → transfer → close or cancel.

---

## 1. What the screenshots tell us (requirements extracted)

| Screen | What we learned | Backend impact |
|---|---|---|
| **Add Lead** | Fields: status, source, user (assignee), mobile (+country code, required), company, date, customer name (required), email, label (multi), label-wise estimate amount, estimate amount, reference, address, comment | `Lead` schema, `Source`, `Label`, `LeadStatus` masters, user dropdown API |
| **Status dropdown** | New, Processing, Close-by, Visited, Confirm, Cancel, Internal Transfer Needed | Configurable `LeadStatus` collection (seeded) |
| **Kanban (Leads)** | One column per status, with ₹ total + count; card shows CN (company), CD (created date), BY (created by), TO (assigned to), NFD (next followup date), AD (address), rating (5 stars), estimated amount, labels, followup count, OVERDUE badge | Board endpoint with per-status count/sum; computed `isOverdue`; denormalized `nextFollowupDate`, `followupCount` |
| **Card actions** | Label, rating/progress, assign user (transfer), change status, followup (count badge), more menu | Dedicated sub-endpoints per action; each writes history |
| **Add Lead Followup** | Category (required), next followup date (required), comment, attachment (images, videos, PDF, DOC, EXCEL, PPT, TEXT, max 5 MB), **voice recording** | `Followup` schema, `FollowupCategory` master, upload middleware |
| **Followup card** | Created time, NEXT FOLLOWUP, GAP, ALLOWED (30m), DIFFERENCE, STATUS (Inpolicy), category, comment, edit icon | Followup **policy** calculation (see §7.3) |
| **Lead Details tabs** | Details, FollowUp, History, Task, Reminder, Meeting | `LeadHistory`, and Task/Reminder/Meeting linked to a lead |
| **Dashboard** | Today's Leads / Followups / Tasks / To-Dos with completion %, "vs yesterday"; Leads tabs (New/Processing/Close-by); Schedules (Reminder/Meeting/Events); Tasks (Today/Tomorrow); To-Dos (High/Medium/Low); Sticky Notes | `/dashboard` aggregation endpoints; Phase 2 modules |
| **Header/sidebar** | Quick-add (Lead/Task/Reminder/Meeting/To-Do/Note), notification bell (1026), global search, Chat, Customer, Leave, SOP, Holidays, Calendar, role label ("Staff") | Notifications, global search, Phase 2 modules |
| **Leads page** | Reports, Filter, Kanban/List toggle, ⋮ menu (likely import/export) | List endpoint with filters, reports, import/export |

### Scope split

- **Phase 1 (MVP, build first):** Auth, Users, Roles, Masters (status, source, label, followup category), Leads, Followups, History, Dashboard, Notifications, Uploads, Admin reports, Import/Export.
- **Phase 2:** Task, To-Do, Note, Reminder, Meeting, Calendar, Customer (lead → customer on Confirm).
- **Phase 3 (only if needed):** Chat, Leave, SOP, Holidays, call-log integration.

---

## 2. Tech stack & packages

```
express mongoose dotenv cors helmet morgan compression cookie-parser
jsonwebtoken bcryptjs zod express-rate-limit express-mongo-sanitize hpp
multer node-cron socket.io libphonenumber-js
exceljs (or json2csv) for export/import   winston (logging)
dev: nodemon, eslint, prettier, vitest + supertest, mongodb-memory-server
```

`package.json`: `"type": "module"`. Node 20+.

---

## 3. Folder structure

```
server/
├─ src/
│  ├─ config/
│  │  ├─ env.js              # validated env (zod)
│  │  ├─ db.js               # mongoose connect
│  │  └─ constants.js        # ROLES, HISTORY_ACTIONS, FILE LIMITS
│  ├─ models/
│  │  ├─ User.model.js
│  │  ├─ Lead.model.js
│  │  ├─ Followup.model.js
│  │  ├─ LeadHistory.model.js
│  │  ├─ LeadStatus.model.js
│  │  ├─ Source.model.js
│  │  ├─ Label.model.js
│  │  ├─ FollowupCategory.model.js
│  │  ├─ Setting.model.js
│  │  ├─ Notification.model.js
│  │  ├─ Counter.model.js        # lead number sequence
│  │  └─ (phase 2) Task, Todo, Note, Reminder, Meeting, Customer
│  ├─ validators/            # zod schemas per module
│  ├─ middlewares/
│  │  ├─ auth.js             # verify JWT, attach req.user
│  │  ├─ authorize.js        # role guard
│  │  ├─ leadAccess.js       # per-lead access check
│  │  ├─ validate.js         # zod runner
│  │  ├─ upload.js           # multer config
│  │  ├─ rateLimit.js
│  │  ├─ notFound.js
│  │  └─ errorHandler.js
│  ├─ controllers/           # thin: parse req → call service → respond
│  ├─ services/              # business logic lives here
│  │  ├─ auth.service.js
│  │  ├─ lead.service.js
│  │  ├─ followup.service.js
│  │  ├─ history.service.js
│  │  ├─ dashboard.service.js
│  │  ├─ report.service.js
│  │  ├─ notification.service.js
│  │  └─ storage.service.js  # local now, S3/Cloudinary later
│  ├─ routes/
│  │  ├─ index.js            # mounts everything under /api/v1
│  │  └─ auth|user|lead|followup|master|dashboard|report|notification|settings .routes.js
│  ├─ jobs/                  # cron: followup reminders, overdue alerts
│  ├─ sockets/               # socket.io setup + events
│  ├─ seeders/               # statuses, sources, categories, admin user
│  ├─ utils/                 # ApiError, ApiResponse, asyncHandler, pagination, phone, dates
│  ├─ app.js                 # express app (no listen)
│  └─ server.js              # connect DB, start HTTP + sockets + cron
├─ uploads/                  # gitignored
├─ tests/
├─ .env.example
└─ package.json
```

**Layering rule:** `route → validate → auth/authorize → controller → service → model`. Controllers never touch Mongoose directly. This keeps logic testable and reusable (for example, cron and import reuse the services).

---

## 4. Environment variables

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://...
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
DEFAULT_TIMEZONE=Asia/Kolkata
SEED_ADMIN_EMAIL=admin@365crm.com
SEED_ADMIN_PASSWORD=ChangeMe@123
```

---

## 5. Roles & permissions

Roles: `admin`, `staff` (optional `manager` later, leave it in the enum).

| Action | Admin | Staff |
|---|---|---|
| See leads | **All** | Only leads where `createdBy = me` **or** `assignedTo = me` |
| Create lead | ✅ | ✅ |
| Edit lead fields | ✅ any | ✅ own/assigned |
| Change status / rating / labels | ✅ any | ✅ own/assigned |
| Transfer (assign) lead | ✅ any | ✅ own/assigned (becomes read-only for them if they lose both roles; see §12 Q2) |
| Add followup | ✅ | ✅ on accessible leads |
| Edit/delete followup | ✅ any | Own followups only |
| Delete lead (soft) | ✅ | ❌ (or own, configurable) |
| Restore lead | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| Manage masters (status/source/label/category) | ✅ | ❌ (read only) |
| Policy settings | ✅ | ❌ |
| Reports | All data | Own data only |
| Import/Export | ✅ | Export own only (optional) |

**Single source of truth for scoping** (`utils/scope.js`):

```js
export const leadScope = (user) =>
  user.role === 'admin'
    ? { isDeleted: false }
    : { isDeleted: false, $or: [{ createdBy: user._id }, { assignedTo: user._id }] };
```

Every lead list, board, dashboard, and report query starts from `leadScope(req.user)`. A single-lead route uses `leadAccess` middleware: it loads the lead using the scope and returns **404** if not found (not 403, so we don't leak existence).

---

## 6. Data models (Mongoose)

All models use `{ timestamps: true }`.

### 6.1 User
```js
const userSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  mobile:      { type: String },
  password:    { type: String, required: true, select: false },
  role:        { type: String, enum: ['admin', 'staff'], default: 'staff', index: true },
  designation: String,
  avatar:      String,
  isActive:    { type: Boolean, default: true, index: true },
  lastLoginAt: Date,
  refreshTokenHash: { type: String, select: false },
  passwordChangedAt: Date,
}, { timestamps: true });
// pre-save: bcrypt hash (cost 12). method: comparePassword()
```
Deactivating a user (never hard delete) keeps the history intact. Admin can reassign that user's leads in bulk.

### 6.2 LeadStatus (master, configurable)
```js
{ key: {type:String, unique:true},   // 'new','processing','close-by','visited','confirm','cancel','internal-transfer-needed'
  name: String, color: String, order: Number,
  isTerminal: Boolean,               // confirm / cancel → no more followup overdue
  requiresReason: Boolean,           // cancel
  isActive: Boolean }
```
Seed order: New → Processing → Close-by → Visited → Confirm → Cancel → Internal Transfer Needed.

### 6.3 Source (master)
`{ name, type: 'online' | 'offline', isActive }`. Seeds: Online, Meta, Google Ads, Website, Walk-in, Referral, Call, Other.

### 6.4 Label (master)
`{ name, color, defaultAmount?: Number, isActive }`. Example: `2BHK`. Supports "Label Wise Estimate Amount Calculation".

### 6.5 FollowupCategory (master)
`{ name, isActive }`. Seeds: Call Not Picked, Call Back Later, Interested, Site Visit, Negotiation, Other.

### 6.6 Lead (core)
```js
const leadSchema = new Schema({
  leadNo:       { type: String, unique: true },               // L-000123 via Counter
  customerName: { type: String, required: true, trim: true },
  countryCode:  { type: String, default: '+91' },
  mobile:       { type: String, required: true, index: true }, // national digits
  mobileFull:   { type: String, index: true },                 // 917307646484 (shown on card)
  email:        { type: String, lowercase: true, trim: true },
  companyName:  String,                                        // "CN"
  address:      String,                                        // "AD"
  comment:      String,
  reference:    String,
  leadDate:     { type: Date, default: Date.now },             // "Date" on form

  source:       { type: Schema.Types.ObjectId, ref: 'Source' },
  status:       { type: String, default: 'new', index: true }, // LeadStatus.key
  labels:       [{ label: { type: Schema.Types.ObjectId, ref: 'Label' }, amount: { type: Number, default: 0 } }],
  estimateAmount: { type: Number, default: 0 },
  rating:       { type: Number, min: 0, max: 5, default: 0 },

  createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedTo:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // denormalized for fast cards/dashboard (kept in sync by followup.service)
  nextFollowupDate: { type: Date, index: true },               // "NFD"
  lastFollowupAt:   Date,
  followupCount:    { type: Number, default: 0 },

  statusChangedAt: Date,
  closedAt: Date,
  cancelReason: String,

  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date, deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

leadSchema.index({ status: 1, assignedTo: 1, nextFollowupDate: 1 });
leadSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
leadSchema.index({ customerName: 'text', companyName: 'text', mobileFull: 'text', email: 'text' });
```

**Computed (not stored):** `isOverdue = nextFollowupDate < now && !status.isTerminal`. Compute it in the serializer (or `$addFields` in aggregations) so it is never stale.

**Estimate amount rule:** if the user picks labels with amounts, `estimateAmount = Σ labels.amount`; otherwise the manual value is used. The server recalculates, so the client can't send inconsistent totals.

**Duplicates:** the mobile is **not** unique. `GET /leads/check-duplicate?mobile=` returns matches so the UI can warn, and the user can still proceed. Admin can decide to enforce uniqueness later (§12 Q4).

### 6.7 Followup
```js
const followupSchema = new Schema({
  lead:        { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  category:    { type: Schema.Types.ObjectId, ref: 'FollowupCategory', required: true },
  comment:     String,
  nextFollowupDate: { type: Date, required: true },            // when to contact next
  attachments: [{
    kind: { type: String, enum: ['file', 'voice'] },
    url: String, originalName: String, mimeType: String, size: Number,
  }],

  // policy snapshot (calculated on create / on edit of the date)
  gapMinutes:        Number,   // nextFollowupDate − createdAt
  allowedMinutes:    Number,   // from Setting at that time (30)
  differenceMinutes: Number,   // allowed − gap
  policyStatus:      { type: String, enum: ['inpolicy', 'outofpolicy'] },

  leadStatusAtTime: String,    // status when followup was logged
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // completion tracking → powers "Today's Followups: X completed"
  completedAt: Date,           // set when the NEXT followup is added (the due one was acted on)
  completedOnTime: Boolean,    // completedAt <= nextFollowupDate (+ grace)

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

followupSchema.index({ lead: 1, createdAt: -1 });
followupSchema.index({ createdBy: 1, nextFollowupDate: 1, completedAt: 1 });
```

### 6.8 LeadHistory (immutable audit log; the "History" tab)
```js
{ lead, actor: ref User,
  action: enum['LEAD_CREATED','LEAD_UPDATED','STATUS_CHANGED','ASSIGNED','LABELS_CHANGED',
               'RATING_CHANGED','AMOUNT_CHANGED','FOLLOWUP_ADDED','FOLLOWUP_EDITED',
               'FOLLOWUP_DELETED','LEAD_DELETED','LEAD_RESTORED'],
  changes: [{ field, from, to }],      // e.g. status: 'new' → 'processing'
  note: String, meta: Mixed,           // followupId, from/to user, etc.
  createdAt }
```
Never updated or deleted. Index `{ lead: 1, createdAt: -1 }`.

### 6.9 Setting (singleton)
```js
{ key: 'followup', allowedMinutes: 30, graceMinutes: 0,
  staffCanDeleteOwnLead: false, staffFollowupEditWindowMinutes: 1440 }
```

### 6.10 Notification
```js
{ user, type: enum['FOLLOWUP_DUE','FOLLOWUP_OVERDUE','LEAD_ASSIGNED','LEAD_TRANSFERRED','STATUS_CHANGED','MENTION','SYSTEM'],
  title, body, link: { entity:'lead', id }, isRead: false, readAt, createdAt }
// index { user: 1, isRead: 1, createdAt: -1 }; TTL 90 days
```

### 6.11 Counter
`{ _id: 'lead', seq: Number }` with atomic `findOneAndUpdate({$inc})` to generate `L-000001`.

### 6.12 Phase 2 models (sketch)
- **Task:** `title, description, dueDate, priority, status, assignedTo, createdBy, lead?`
- **Todo:** `title, priority (high/medium/low), isDone, dueDate, user`
- **Note (sticky):** `title, content, color, isPinned, user, lead?`
- **Reminder:** `title, remindAt, user, lead?, isDone, notifiedAt`
- **Meeting:** `title, startAt, endAt, location/link, attendees[], lead?, status`
- **Customer:** created when lead is **Confirmed**: `{ fromLead, name, mobile, email, company, ... }`

---

## 7. Business rules (the heart of the system)

### 7.1 Lead lifecycle
```
NEW ──(first followup)──► PROCESSING ──► CLOSE-BY ──► VISITED ──► CONFIRM (terminal, ✔ won)
  │                           │                                      
  └───────────────┬───────────┴──────────────► CANCEL (terminal, needs reason)
                  └──────────────────────────► INTERNAL TRANSFER NEEDED
```
- **Create:** status defaults `new`; `createdBy = req.user`; `assignedTo` = chosen user (defaults to creator). Generate `leadNo`. Write history `LEAD_CREATED`. Notify assignee if different from creator.
- **Auto-promote:** adding a followup to a lead in `new` automatically moves it to `processing` (history: `STATUS_CHANGED`, note "auto").
- **Manual status change** is allowed to any status (the CRM flow isn't strictly linear). Rules:
  - `cancel` requires `cancelReason`.
  - Terminal statuses (`confirm`, `cancel`) set `closedAt`, clear `nextFollowupDate`, and the lead stops showing as overdue.
  - Moving out of a terminal status (reopen) clears `closedAt`. Admin only, or any user (configurable).
  - Followups can still be added in any status (the user said "in that status can add followups").
- **Transfer:** `PATCH /leads/:id/assign {userId}`. The target must be an active user. Write history `ASSIGNED` (from → to), notify the new owner, and keep `createdBy` unchanged.
- **Soft delete only** for leads, followups, and users.

### 7.2 Followup lifecycle
On **create**, in one service function (use a Mongo session/transaction if on a replica set, which Atlas is):
1. Validate lead access and `nextFollowupDate` (not before "now − 1 min" unless admin).
2. Find the lead's previous open followup (`completedAt: null`) → set `completedAt = now`, `completedOnTime = now <= prev.nextFollowupDate + grace`.
3. Compute policy fields (§7.3).
4. Insert the followup with attachments.
5. Update the lead: `nextFollowupDate`, `lastFollowupAt = now`, `$inc followupCount`, and auto-promote `new → processing`.
6. Write history `FOLLOWUP_ADDED`.

On **edit** (comment, category, date, attachments): recompute policy if the date changed. If it is the latest followup, sync `lead.nextFollowupDate`. Write history `FOLLOWUP_EDITED` with a diff.

On **delete** (soft): decrement `followupCount`. If it was the latest, set `lead.nextFollowupDate` to the latest remaining open followup's date (or null). Write history `FOLLOWUP_DELETED`. If the deleted one had completed a previous followup, re-open that previous one.

### 7.3 Followup policy (GAP / ALLOWED / DIFFERENCE / STATUS)
From the screenshot (gap 4m, allowed 30m, difference 26m, status "Inpolicy"), my interpretation:

```
gapMinutes        = nextFollowupDate − followup.createdAt   (how far ahead the next contact is scheduled)
allowedMinutes    = Setting.allowedMinutes                   (30)
differenceMinutes = allowedMinutes − gapMinutes              (26)
policyStatus      = gapMinutes <= allowedMinutes ? 'inpolicy' : 'outofpolicy'
```
⚠️ **Please confirm this interpretation** (see §12 Q1). It is isolated in one function (`calcFollowupPolicy`), so changing it later is trivial.

### 7.4 Overdue
`overdue = nextFollowupDate < now AND status not terminal`. The card turns red and shows the "OVERDUE" badge (Image 9). The server returns `isOverdue` and `overdueByMinutes` on every lead payload. Board columns sort by `nextFollowupDate asc` (overdue first) when requested.

### 7.5 Rating
Integer 0–5, updated via `PATCH /leads/:id/rating`, logged in history.

---

## 8. Middlewares

| Middleware | Purpose |
|---|---|
| `auth` | Read `Authorization: Bearer <access>`, verify, load user (active only), attach `req.user`. Reject if `passwordChangedAt` > token `iat`. |
| `authorize(...roles)` | Role guard, e.g. `authorize('admin')`. |
| `leadAccess` | Loads the lead via `leadScope`, attaches `req.lead`, or 404. |
| `validate({body, query, params})` | Zod parse; returns 422 with field errors. |
| `upload` | Multer, 5 MB, mime allowlist (images, video, pdf, doc/docx, xls/xlsx, ppt/pptx, txt, **audio/webm/mpeg/wav/ogg** for voice), randomized filenames, max 5 files. |
| `rateLimit` | Strict on `/auth/login` (e.g. 10 / 15 min / IP), general on `/api`. |
| `errorHandler` | Maps `ApiError`, Mongoose validation / duplicate key / cast errors, Multer errors, JWT errors → uniform JSON. |
| Security stack | `helmet`, `cors({origin: CLIENT_URL, credentials: true})`, `mongo-sanitize`, `hpp`, `compression`. |

**Response envelope**
```json
{ "success": true, "message": "Lead created", "data": {...}, "meta": { "page":1, "limit":20, "total":134 } }
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR", "errors": [{ "field":"mobile","message":"Required" }] }
```

**Auth strategy:** short-lived access token (15 min, in memory on the client) plus refresh token in an **httpOnly, SameSite cookie** (hashed in DB, rotated on use). `POST /auth/refresh` issues new tokens. Logout clears them.

---

## 9. API design (`/api/v1`)

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | email + password |
| POST | `/auth/refresh` | cookie → new access token |
| POST | `/auth/logout` | |
| GET | `/auth/me` | current user + role |
| PATCH | `/auth/change-password` | |

### Users
| Method | Path | Access |
|---|---|---|
| GET | `/users/options` | all auth: `[{_id,name,avatar}]` for the assign dropdown |
| GET | `/users` | admin, list/search/filter |
| POST | `/users` | admin |
| GET/PATCH | `/users/:id` | admin |
| PATCH | `/users/:id/status` | admin (activate/deactivate) |
| PATCH | `/users/:id/reset-password` | admin |
| POST | `/users/:id/reassign-leads` | admin, move all open leads to another user |

### Masters (GET = all auth, writes = admin)
`/statuses`, `/sources`, `/labels`, `/followup-categories`: each supports `GET /`, `POST /`, `PATCH /:id`, `PATCH /:id/status` (toggle active). Statuses also support `PATCH /reorder`.

### Leads
| Method | Path | Notes |
|---|---|---|
| GET | `/leads` | List view. Query: `page, limit, q, status[], source[], label[], assignedTo[], createdBy[], rating, dateFrom, dateTo (createdAt or leadDate), nfdFrom, nfdTo, overdue=true, minAmount, maxAmount, sort` |
| GET | `/leads/board` | Kanban: `[{status, count, totalAmount, leads: first N}]`. Same filters. Per-column "load more" uses `/leads?status=x&page=2` |
| POST | `/leads` | Create |
| GET | `/leads/check-duplicate?mobile=` | Duplicate warning |
| GET | `/leads/:id` | Details tab |
| PATCH | `/leads/:id` | Edit fields (pencil icon) |
| PATCH | `/leads/:id/status` | `{status, cancelReason?}` (refresh icon) |
| PATCH | `/leads/:id/assign` | `{userId}` (user+ icon) |
| PATCH | `/leads/:id/labels` | `{labels:[{label, amount}]}` (tag icon) |
| PATCH | `/leads/:id/rating` | `{rating}` |
| GET | `/leads/:id/history` | History tab (paginated) |
| DELETE | `/leads/:id` | Soft delete |
| POST | `/leads/:id/restore` | Admin |
| GET | `/leads/export` | CSV/XLSX using current filters |
| POST | `/leads/import` | Admin, XLSX/CSV with a validation report |
| POST | `/leads/bulk/assign` | Admin, `{ids[], userId}` |
| POST | `/leads/bulk/status` | `{ids[], status}` |

### Followups
| Method | Path | Notes |
|---|---|---|
| GET | `/leads/:leadId/followups` | FollowUp tab (newest first, with policy fields) |
| POST | `/leads/:leadId/followups` | `multipart/form-data`: `category, nextFollowupDate, comment, files[], voice` |
| PATCH | `/followups/:id` | Edit |
| DELETE | `/followups/:id` | Soft delete |
| GET | `/followups` | "My followups": `?when=today|overdue|upcoming|tomorrow&userId=` (scoped) |
| GET | `/files/:followupId/:fileId` | Authenticated file download (checks lead access) |

### Dashboard (all scoped by role; admin may pass `?userId=` to view as a user)
| Method | Path | Returns |
|---|---|---|
| GET | `/dashboard/summary` | Today's leads (+ % vs yesterday), followups (total/completed), tasks, todos, completion % |
| GET | `/dashboard/leads?status=new|processing|close-by` | Cards for the dashboard Leads panel + tab counts |
| GET | `/dashboard/followups?when=today|overdue` | Followup list |
| GET | `/dashboard/schedules?type=reminder|meeting|event` | Phase 2 |
| GET | `/dashboard/tasks?when=today|tomorrow` | Phase 2 |
| GET | `/dashboard/todos?priority=` | Phase 2 |

### Reports
`/reports/leads-summary` (by status), `/reports/by-source`, `/reports/by-user` (admin), `/reports/followup-compliance` (in-policy %, on-time %), `/reports/conversion` (new → confirm), `/reports/overdue`. All take `dateFrom, dateTo, userId?`.

### Settings
`GET /settings`, `PATCH /settings` (admin): followup allowed minutes, grace, edit windows.

### Notifications
`GET /notifications` (paginated + `unreadCount`), `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`. Realtime via Socket.io (`notification:new`).

### Global search
`GET /search?q=` → leads (name/mobile/company/email) now; tasks/notes in Phase 2. Scoped by role.

### Phase 2 (same CRUD pattern)
`/tasks`, `/todos`, `/notes`, `/reminders`, `/meetings`, `/calendar?from=&to=` (merges followups, tasks, reminders, meetings), `/customers`. Each can be linked via `?lead=:id` (these feed the Task/Reminder/Meeting tabs in Lead Details).

---

## 10. Key query patterns

**Board column totals** (single aggregation, role-scoped):
```js
Lead.aggregate([
  { $match: { ...leadScope(user), ...filters } },
  { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$estimateAmount' } } },
]);
// then Promise.all per status: Lead.find({status}).sort(...).limit(20).populate(...)
```

**Dashboard "Today's followups"**
```js
// due today for me
Lead.countDocuments({ ...scope, nextFollowupDate: { $gte: startOfDay, $lte: endOfDay } });
// completed today = followups whose completedAt is today and createdBy/assigned = me
Followup.countDocuments({ completedAt: { $gte: startOfDay, $lte: endOfDay }, createdBy: me });
```
Day boundaries use `DEFAULT_TIMEZONE` (`Asia/Kolkata`), not server UTC. Use `date-fns-tz` or `luxon` consistently.

**"vs Yesterday %"**: `(today − yesterday) / max(yesterday,1) × 100`.

Use `.lean()` and `populate` with field selection (`name avatar`) for list endpoints.

---

## 11. Background jobs & realtime

- **Cron (every minute, `node-cron`)**
  - Leads with `nextFollowupDate` within the next 10 min and not yet notified → `FOLLOWUP_DUE` notification to the assignee.
  - Newly overdue leads → `FOLLOWUP_OVERDUE` (once; track `overdueNotifiedAt` on the lead or via a notification dedupe key).
  - Phase 2: reminders due.
- **Socket.io:** authenticate the handshake with the access token and join room `user:<id>`. Emit `notification:new`, `lead:assigned`, and `lead:updated` (so Kanban refreshes live for the assignee/admin).
- The cron job calls the same `notification.service` that controllers use.

---

## 12. Open questions (please confirm; defaults chosen in brackets)

1. **Followup policy math** (§7.3): is `GAP` = (next followup date − time you logged the followup), compared against a 30-minute allowance? [Yes, as designed]
2. **Staff visibility after transfer:** in your screenshot Jyoti sees a lead created by Raj and assigned to her, and a lead she created assigned to Krishana. I assumed staff see leads they **created OR are assigned**. Should the creator keep seeing it after transfer? [Yes]
3. **Can staff delete leads?** [No, admin only; setting-controlled]
4. **Duplicate mobile numbers:** warn only, or block? [Warn only]
5. **Can staff reopen a Cancelled/Confirmed lead?** [Admin only]
6. **File storage:** local disk for dev; S3 / Cloudinary for production? [Local behind `storage.service`, swappable]
7. **Statuses fixed or admin-editable?** [Seeded and admin-editable (rename/color/order), `key` immutable]
8. **Do you need a Manager role** (sees team leads only)? [Not in MVP]
9. **Lead import** from Excel at launch (you have 77+ cancelled leads, so likely migrated data)? [Yes, M7]

---

## 13. Build order (milestones)

| # | Milestone | Deliverable |
|---|---|---|
| M0 | Project setup | Express app, env validation, DB connect, error handler, logger, ESLint, health route |
| M1 | Auth & Users | User model, login/refresh/logout/me, role guards, admin user CRUD, seed admin |
| M2 | Masters + seeders | Status, Source, Label, Category, Setting + seed data + CRUD |
| M3 | Leads core | Lead model, counter, create/read/update/delete, scope, history service, duplicate check |
| M4 | Lead actions | status, assign, labels, rating, restore + notifications for assignment |
| M5 | Followups | Followup CRUD, uploads (files + voice), policy calc, completion tracking, auto-promote, denormalized sync |
| M6 | List / Board / Filters | `/leads`, `/leads/board`, search, sorting, overdue flag, pagination |
| M7 | Dashboard & Reports | Summary, panels, reports, export/import, bulk actions |
| M8 | Realtime & jobs | Socket.io, cron reminders, notification center |
| M9 | Phase 2 modules | Task, Todo, Note, Reminder, Meeting, Calendar, Customer + dashboard panels |
| M10 | Hardening | Tests (service + API), rate limits, indexes review, Postman/OpenAPI docs, Docker, deployment |

**Definition of done per module:** schema + indexes, zod validators, service, controller, routes, role checks, history/notification hooks, tests for the happy path and permission edge cases.

---

## 14. Testing strategy
- **Unit:** `calcFollowupPolicy`, `leadScope`, estimate-amount calculation, day-boundary helpers.
- **Integration (supertest + mongodb-memory-server):**
  - Staff A cannot read Staff B's lead (404). Admin can.
  - Followup on a `new` lead → status `processing`, `followupCount = 1`, `nextFollowupDate` synced.
  - Deleting the latest followup restores the previous NFD.
  - Transfer creates history and notification; cancel without reason → 422.
- **Contract:** export a Postman collection / OpenAPI file so the frontend plan can reference exact payloads.

---

## 15. Next step
Once you confirm or adjust §12, we move to the **Frontend plan** (React + Vite + Tailwind): routing, role-based guards, state/data layer (TanStack Query), Kanban + list views, Add Lead modal, Lead Details tabs, Followup modal with voice recorder, dashboard widgets, and notifications, all mapped 1:1 to the endpoints above.
