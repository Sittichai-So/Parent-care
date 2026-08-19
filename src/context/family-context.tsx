import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import {
  cancelAppointmentReminder,
  cancelMedicationReminders,
  syncAppointmentReminder,
  syncMedicationReminders,
} from '@/services/notifications';
import * as appointmentsApi from '@/services/appointments-api';
import type { ApiAppointment } from '@/services/appointments-api';
import * as emergencyApi from '@/services/emergency-api';
import * as householdsApi from '@/services/households-api';
import type { ApiHouseholdMember, HouseholdKind, HouseholdRole } from '@/services/households-api';
import * as medicinesApi from '@/services/medicines-api';
import type { ApiMedicine } from '@/services/medicines-api';
import * as notificationsInboxApi from '@/services/notifications-inbox-api';
import type { ApiNotification } from '@/services/notifications-inbox-api';
import * as tasksApi from '@/services/tasks-api';
import type { ApiTask } from '@/services/tasks-api';
import * as timelineApi from '@/services/timeline-api';
import type { ApiTimelineEvent } from '@/services/timeline-api';
import * as vitalsApi from '@/services/vitals-api';
import type { ApiVital } from '@/services/vitals-api';

export type MemberRole = 'Owner' | 'Caregiver' | 'Elder' | 'Viewer';
export type MemberStatus = 'normal' | 'monitor' | 'urgent';

export type FamilyMember = {
  id: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  detail: string;
  relation: string;
  /** False for a profile someone else manages on this member's behalf
   *  (e.g. an elderly relative with no phone) — see addManagedMember. */
  hasAccount: boolean;
  /** 'pending' means an existing account was invited but hasn't accepted
   *  yet — see inviteExistingUser/acceptInvite/declineInvite. */
  membershipState: 'active' | 'pending';
};

/** An invite addressed to *this* account, not yet accepted or declined —
 *  distinct from a household's own member list (which also includes rows
 *  with membershipState: 'pending' for members *of* that household). This
 *  is account-wide, surfaced regardless of which household is selected. */
export type PendingInvite = {
  householdId: string;
  householdName: string;
  membershipId: string;
  role: MemberRole;
  displayName: string;
  relation: string;
};

export type FamilyTask = {
  id: string;
  title: string;
  detail: string;
  status: 'pending' | 'in-progress' | 'done';
  owner: string;
  /** Drives the task's icon — replaces the old lookup keyed on a
   *  hardcoded task id, which only ever matched the 3 seeded demo tasks. */
  relatedType: 'checkin' | 'medication' | 'appointment' | 'vitals' | 'custom';
};

export type FamilyEvent = {
  id: string;
  title: string;
  time: string;
  detail: string;
  type: 'check-in' | 'medication' | 'task' | 'appointment' | 'vitals' | 'emergency';
  /** Full ISO timestamp `time` was derived from — kept alongside the display-only
   *  `time` (already formatted to HH:mm) so callers that need the calendar day
   *  (e.g. grouping activity into a report chart) don't have to re-parse it. */
  occurredAt: string;
};

/** A medication a family member takes, self-managed or entered on their behalf. */
export type Medication = {
  id: string;
  memberId: string;
  name: string;
  dosage: string;
  /** What it's for, e.g. "ควบคุมความดันโลหิต". */
  reason?: string;
  /** 24h "HH:mm" times this is due each day it's active. */
  schedule: string[];
  notes?: string;
  active: boolean;
  /** ISO timestamp of the last confirmed dose, if any — computed server-side
   *  from MedicationLog, never stored directly. */
  lastTakenAt?: string;
};

/** A scheduled visit, optionally tied to medications discussed or adjusted there. */
export type Appointment = {
  id: string;
  memberId: string;
  title: string;
  /** "YYYY-MM-DD", local calendar day — see `utils/date`. */
  date: string;
  /** 24h "HH:mm". */
  time: string;
  hospital: string;
  doctor?: string;
  department?: string;
  notes?: string;
  /** Medication instructions tied specifically to this visit. */
  medicationNote?: string;
  linkedMedicationIds: string[];
  reminderEnabled: boolean;
};

/** A self-reported health reading. */
export type VitalLog = {
  id: string;
  memberId: string;
  recordedAt: string;
  systolic?: number;
  diastolic?: number;
  sugar?: number;
  weight?: number;
  note?: string;
};

/** One household this account belongs to, with its role in it. */
export type HouseholdSummary = {
  id: string;
  name: string;
  inviteCode: string;
  role: MemberRole;
  membershipId: string;
  kind: HouseholdKind;
  /** True if this is the household the caller opens on sign-in — a
   *  per-membership flag, so it's this account's own default, not a
   *  household-wide setting (see `setDefaultHousehold`). */
  isDefault: boolean;
};

type FamilyContextValue = {
  /** Every household this account belongs to — a user can be part of more
   *  than one (e.g. caring for both sides of the family). */
  households: HouseholdSummary[];
  isLoadingHouseholds: boolean;
  currentHouseholdId: string | null;
  setCurrentHouseholdId: (id: string | null) => void;
  /** Full record for currentHouseholdId — includes the invite code, so any
   *  screen can offer "share this code" without a separate fetch. */
  currentHousehold: HouseholdSummary | null;
  /** The caller's own membership id / role *within* currentHouseholdId. */
  currentMembershipId: string | null;
  currentRole: MemberRole | null;
  /** Derived from `currentRole` — false only for Viewer. Covers everything a
   *  non-Viewer may touch except managing the medicine/appointment lists
   *  themselves — see `canManageFor`. */
  canEdit: boolean;
  /** True for Owner/Caregiver — can manage *any* member's medicine/appointment
   *  records, including deleting them (Elder never can, even their own). */
  canManage: boolean;
  /** True if the caller may create/edit a medicine or appointment for
   *  `memberId` — Owner/Caregiver: anyone; Elder: only themself; Viewer:
   *  never. Mirrors household-scope.js's resolveWriteMemberId exactly. */
  canManageFor: (memberId: string) => boolean;
  createHousehold: (
    name: string,
    displayName: string,
    relation: string,
    kind?: HouseholdKind
  ) => Promise<HouseholdSummary>;
  joinHousehold: (
    inviteCode: string,
    role: Exclude<HouseholdRole, 'owner'>,
    displayName: string,
    relation: string
  ) => Promise<HouseholdSummary>;
  /** Sets `householdId` as the caller's own "กลุ่มเริ่มต้น". */
  setDefaultHousehold: (householdId: string) => Promise<void>;

  isLoadingData: boolean;
  familyMembers: FamilyMember[];
  tasks: FamilyTask[];
  timeline: FamilyEvent[];
  medications: Medication[];
  appointments: Appointment[];
  vitalLogs: VitalLog[];

  /** Invites addressed to this account, across every household this
   *  account can see (not just currentHouseholdId). */
  pendingInvites: PendingInvite[];
  refreshPendingInvites: () => Promise<void>;

  /** The account's server-side notification inbox — medicine/appointment
   *  due-time reminders, new chat messages, emergency alerts. Account-wide
   *  like pendingInvites, not scoped to currentHouseholdId. Newest-first
   *  (server sorts by createdAt). Polled every 60s while authenticated, in
   *  addition to the explicit refresh below. */
  notifications: ApiNotification[];
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  /** The family's Elder member — used as the default "me" on elder-facing screens. */
  primaryElderId: string;

  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;

  /** Self check-in ("ฉันสบายดี" / "ตรวจสอบสถานะ") — sets the caller's own
   *  member status to normal and records a timeline event server-side. */
  checkIn: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: FamilyTask['status']) => Promise<void>;
  /** Owner-only in practice (the server rejects anyone else) — changes what
   *  a member can do in this household, not their account identity. */
  updateMemberRole: (memberId: string, role: HouseholdRole) => Promise<void>;

  addMedication: (input: Omit<Medication, 'id' | 'lastTakenAt'>) => Promise<string>;
  updateMedication: (id: string, patch: Partial<Omit<Medication, 'id'>>) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  /** `extra` carries the photo confirmation — `image` (its uploaded URL) and
   *  `photoTakenAt` (the real capture time, distinct from the server's own
   *  `takenAt`) — see medication-confirm.tsx. */
  confirmMedicationTaken: (id: string, extra?: { image?: string; photoTakenAt?: string }) => Promise<void>;

  addAppointment: (input: Omit<Appointment, 'id'>) => Promise<string>;
  updateAppointment: (id: string, patch: Partial<Omit<Appointment, 'id'>>) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;

  addVitalLog: (input: Omit<VitalLog, 'id'>) => Promise<void>;

  triggerEmergency: (message?: string) => Promise<void>;

  /** Adds a member profile with no linked account of its own — for
   *  relatives who can't self-register (no phone, not tech-comfortable). */
  addManagedMember: (input: {
    displayName: string;
    relation: string;
    role: Extract<HouseholdRole, 'elder' | 'viewer'>;
    birthday?: string | null;
    gender?: string | null;
  }) => Promise<string>;

  /** Exact-match only (userCode or email) — never a name search. */
  lookupUser: (query: { code: string } | { email: string }) => Promise<householdsApi.ApiUserLookup>;
  /** Sends a pending invite to an existing account found via lookupUser. */
  inviteExistingUser: (
    userId: string,
    role: Exclude<HouseholdRole, 'owner'>,
    displayName: string,
    relation: string
  ) => Promise<void>;
  acceptInvite: (householdId: string, membershipId: string) => Promise<void>;
  declineInvite: (householdId: string, membershipId: string) => Promise<void>;

  /** Generates a one-time code (24h TTL) so a userId-less member profile
   *  can later be linked to a real account. Returns the code to share. */
  generateClaimCode: (memberId: string) => Promise<string>;
  /** Links the caller's own account to an existing userId-less profile,
   *  keeping its medication/appointment/vitals history. */
  claimMembership: (claimCode: string) => Promise<void>;
};

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

const ROLE_TO_DISPLAY: Record<HouseholdRole, MemberRole> = {
  owner: 'Owner',
  caregiver: 'Caregiver',
  elder: 'Elder',
  viewer: 'Viewer',
};

const toFamilyMember = (member: ApiHouseholdMember): FamilyMember => ({
  id: member._id,
  name: member.displayName,
  role: ROLE_TO_DISPLAY[member.role],
  status: member.status,
  detail: member.detail,
  relation: member.relation,
  hasAccount: member.userId !== null,
  membershipState: member.membershipState,
});

const toMedication = (medicine: ApiMedicine): Medication => ({
  id: medicine._id,
  memberId: medicine.memberId,
  name: medicine.name,
  dosage: medicine.dosage,
  reason: medicine.reason ?? undefined,
  schedule: medicine.times,
  notes: medicine.notes ?? undefined,
  active: medicine.isActive,
  lastTakenAt: medicine.lastTakenAt ?? undefined,
});

const toAppointment = (appointment: ApiAppointment): Appointment => ({
  id: appointment._id,
  memberId: appointment.memberId,
  title: appointment.title,
  date: appointment.date,
  time: appointment.time,
  hospital: appointment.hospital,
  doctor: appointment.doctor ?? undefined,
  department: appointment.department ?? undefined,
  notes: appointment.notes ?? undefined,
  medicationNote: appointment.medicationNote ?? undefined,
  linkedMedicationIds: appointment.linkedMedicationIds,
  reminderEnabled: appointment.reminderEnabled,
});

const toVitalLog = (vital: ApiVital): VitalLog => ({
  id: vital._id,
  memberId: vital.memberId,
  recordedAt: vital.recordedAt,
  systolic: vital.systolic ?? undefined,
  diastolic: vital.diastolic ?? undefined,
  sugar: vital.sugar ?? undefined,
  weight: vital.weight ?? undefined,
  note: vital.note ?? undefined,
});

const toTask = (task: ApiTask): FamilyTask => ({
  id: task._id,
  title: task.title,
  detail: task.detail,
  status: task.status,
  owner: task.owner ?? '',
  relatedType: task.relatedType,
});

const toTimelineEvent = (event: ApiTimelineEvent): FamilyEvent => ({
  id: event._id,
  title: event.title,
  time: new Date(event.occurredAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  detail: event.detail,
  type: event.type,
  occurredAt: event.occurredAt,
});

const toSummary = ({ household, membership }: householdsApi.HouseholdWithMembership): HouseholdSummary => ({
  id: household._id,
  name: household.name,
  inviteCode: household.inviteCode,
  role: ROLE_TO_DISPLAY[membership.role],
  membershipId: membership._id,
  kind: household.kind,
  isDefault: membership.isDefault,
});

const toPendingInvite = ({ household, membership }: householdsApi.ApiPendingInvite): PendingInvite => ({
  householdId: household._id,
  householdName: household.name,
  membershipId: membership._id,
  role: ROLE_TO_DISPLAY[membership.role],
  displayName: membership.displayName,
  relation: membership.relation,
});

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [households, setHouseholds] = useState<HouseholdSummary[]>([]);
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [currentHouseholdId, setCurrentHouseholdId] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [timeline, setTimeline] = useState<FamilyEvent[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitalLogs, setVitalLogs] = useState<VitalLog[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const refreshHouseholds = useCallback(async () => {
    setIsLoadingHouseholds(true);
    try {
      const mine = await householdsApi.listMyHouseholds();
      // A still-pending invite must never become a switchable/current
      // household — householdMiddleware 403s any data request against it
      // until the invite is accepted. Those are surfaced separately via
      // pendingInvites/refreshPendingInvites instead.
      const active = mine.filter(({ membership }) => membership.membershipState !== 'pending');
      const summaries = active.map(toSummary);
      setHouseholds(summaries);
      // Default to the first household, or clear the selection if it's no
      // longer in the list (removed, or account switched) — decided here,
      // right where the fresh list is available, rather than in a second
      // effect reacting to `households`.
      setCurrentHouseholdId((current) => {
        if (summaries.length === 0) return null;
        if (current && summaries.some((household) => household.id === current)) return current;
        return summaries[0].id;
      });
    } finally {
      setIsLoadingHouseholds(false);
    }
  }, []);

  const refreshPendingInvites = useCallback(async () => {
    const invites = await householdsApi.getPendingInvites();
    setPendingInvites(invites.map(toPendingInvite));
  }, []);

  const refreshNotifications = useCallback(async () => {
    const items = await notificationsInboxApi.getNotifications();
    setNotifications(items);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isAuthenticated) {
      refreshHouseholds();
      refreshPendingInvites();
      refreshNotifications();
    } else {
      setHouseholds([]);
      setCurrentHouseholdId(null);
      setPendingInvites([]);
      setNotifications([]);
      setFamilyMembers([]);
      setTasks([]);
      setTimeline([]);
      setMedications([]);
      setAppointments([]);
      setVitalLogs([]);
      setIsLoadingHouseholds(false);
    }
  }, [isAuthenticated, refreshHouseholds, refreshPendingInvites, refreshNotifications]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Polls the notification inbox every 60s while logged in — there's no
  // push mechanism (Expo Go on Android can't even receive one, see
  // services/notifications.ts), and the chat socket only connects while
  // messages.tsx itself is mounted, so this is what keeps the message badge
  // and medicine/appointment reminders reasonably live without either.
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      refreshNotifications();
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshNotifications]);

  const currentHousehold = households.find((household) => household.id === currentHouseholdId) ?? null;
  const currentMembershipId = currentHousehold?.membershipId ?? null;
  const currentRole = currentHousehold?.role ?? null;
  const canEdit = currentRole !== 'Viewer';
  const canManage = currentRole === 'Owner' || currentRole === 'Caregiver';
  const canManageFor = useCallback(
    (memberId: string) => canManage || (currentRole === 'Elder' && memberId === currentMembershipId),
    [canManage, currentRole, currentMembershipId]
  );

  const refreshAll = useCallback(async () => {
    if (!currentHouseholdId) return;
    setIsLoadingData(true);
    try {
      const [members, meds, appts, vitals, taskList, timelineList] = await Promise.all([
        householdsApi.getMembers(currentHouseholdId),
        medicinesApi.getMedicines(currentHouseholdId),
        appointmentsApi.getAppointments(currentHouseholdId),
        vitalsApi.getVitals(currentHouseholdId),
        tasksApi.getTasks(currentHouseholdId),
        timelineApi.getTimeline(currentHouseholdId),
      ]);
      const mappedMembers = members.map(toFamilyMember);
      setFamilyMembers(mappedMembers);

      setSelectedMemberId((current) => {
        if (mappedMembers.length === 0) return null;
        if (current && mappedMembers.some((member) => member.id === current)) return current;
        return mappedMembers[0].id;
      });
      setMedications(meds.map(toMedication));
      setAppointments(appts.map(toAppointment));
      setVitalLogs(vitals.map(toVitalLog));
      setTasks(taskList.map(toTask));
      setTimeline(timelineList.map(toTimelineEvent));
    } finally {
      setIsLoadingData(false);
    }
  }, [currentHouseholdId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentHouseholdId) {
      refreshAll();
    } else {
      setFamilyMembers([]);
      setSelectedMemberId(null);
      setTasks([]);
      setTimeline([]);
      setMedications([]);
      setAppointments([]);
      setVitalLogs([]);
    }
  }, [currentHouseholdId, refreshAll]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const primaryElderId = useMemo(() => {
    const elder = familyMembers.find((member) => member.role === 'Elder');
    return elder?.id ?? familyMembers[0]?.id ?? '';
  }, [familyMembers]);


  useEffect(() => {
    medications.forEach((medication) => syncMedicationReminders(medication).catch(() => {}));
  }, [medications]);

  useEffect(() => {
    appointments.forEach((appointment) => syncAppointmentReminder(appointment).catch(() => {}));
  }, [appointments]);

  const createHousehold = useCallback<FamilyContextValue['createHousehold']>(
    async (name, displayName, relation, kind) => {
      const result = await householdsApi.createHousehold(name, displayName, relation, kind);
      const summary = toSummary(result);
      await refreshHouseholds();
      setCurrentHouseholdId(summary.id);
      return summary;
    },
    [refreshHouseholds]
  );

  const joinHousehold = useCallback(
    async (inviteCode: string, role: Exclude<HouseholdRole, 'owner'>, displayName: string, relation: string) => {
      const result = await householdsApi.joinHousehold(inviteCode, role, displayName, relation);
      const summary = toSummary(result);
      await refreshHouseholds();
      setCurrentHouseholdId(summary.id);
      return summary;
    },
    [refreshHouseholds]
  );

  const checkIn = useCallback(async () => {
    if (!currentHouseholdId || !currentMembershipId) return;
    await householdsApi.checkIn(currentHouseholdId, currentMembershipId);
    await refreshAll();
  }, [currentHouseholdId, currentMembershipId, refreshAll]);

  const updateTaskStatus = useCallback<FamilyContextValue['updateTaskStatus']>(
    async (taskId, status) => {
      if (!currentHouseholdId) return;
      await tasksApi.updateTaskStatus(currentHouseholdId, taskId, status);
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const updateMemberRole = useCallback<FamilyContextValue['updateMemberRole']>(
    async (memberId, role) => {
      if (!currentHouseholdId) return;
      await householdsApi.updateMember(currentHouseholdId, memberId, { role });
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const addMedication = useCallback<FamilyContextValue['addMedication']>(
    async (input) => {
      if (!currentHouseholdId) throw new Error('ยังไม่ได้เลือกครอบครัว');
      const created = await medicinesApi.createMedicine(currentHouseholdId, {
        memberId: input.memberId,
        name: input.name,
        dosage: input.dosage,
        reason: input.reason,
        times: input.schedule,
        notes: input.notes,
        isActive: input.active,
      });
      await refreshAll();
      return created._id;
    },
    [currentHouseholdId, refreshAll]
  );

  const updateMedication = useCallback<FamilyContextValue['updateMedication']>(
    async (id, patch) => {
      if (!currentHouseholdId) return;
      const { schedule, active, ...rest } = patch;
      await medicinesApi.updateMedicine(currentHouseholdId, id, {
        ...rest,
        ...(schedule ? { times: schedule } : {}),
        ...(active !== undefined ? { isActive: active } : {}),
      });
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const removeMedication = useCallback<FamilyContextValue['removeMedication']>(
    async (id) => {
      if (!currentHouseholdId) return;
      await medicinesApi.deleteMedicine(currentHouseholdId, id);
      await cancelMedicationReminders(id);
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const confirmMedicationTaken = useCallback<FamilyContextValue['confirmMedicationTaken']>(
    async (id, extra) => {
      if (!currentHouseholdId) return;
      await medicinesApi.logDose(currentHouseholdId, id, 'taken', extra);
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const addAppointment = useCallback<FamilyContextValue['addAppointment']>(
    async (input) => {
      if (!currentHouseholdId) throw new Error('ยังไม่ได้เลือกครอบครัว');
      const created = await appointmentsApi.createAppointment(currentHouseholdId, input);
      await refreshAll();
      return created._id;
    },
    [currentHouseholdId, refreshAll]
  );

  const updateAppointment = useCallback<FamilyContextValue['updateAppointment']>(
    async (id, patch) => {
      if (!currentHouseholdId) return;
      await appointmentsApi.updateAppointment(currentHouseholdId, id, patch);
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const removeAppointment = useCallback<FamilyContextValue['removeAppointment']>(
    async (id) => {
      if (!currentHouseholdId) return;
      await appointmentsApi.deleteAppointment(currentHouseholdId, id);
      await cancelAppointmentReminder(id);
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const addVitalLog = useCallback<FamilyContextValue['addVitalLog']>(
    async (input) => {
      if (!currentHouseholdId) return;
      await vitalsApi.createVital(currentHouseholdId, {
        memberId: input.memberId,
        systolic: input.systolic,
        diastolic: input.diastolic,
        sugar: input.sugar,
        weight: input.weight,
        note: input.note,
      });
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const triggerEmergency = useCallback<FamilyContextValue['triggerEmergency']>(
    async (message) => {
      if (!currentHouseholdId) return;
      await emergencyApi.triggerEmergency(currentHouseholdId, message);
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  const addManagedMember = useCallback<FamilyContextValue['addManagedMember']>(
    async (input) => {
      if (!currentHouseholdId) throw new Error('ยังไม่ได้เลือกครอบครัว');
      const created = await householdsApi.createManagedMember(currentHouseholdId, input);
      await refreshAll();
      return created._id;
    },
    [currentHouseholdId, refreshAll]
  );

  const lookupUser = useCallback<FamilyContextValue['lookupUser']>(
    async (query) => householdsApi.lookupUser(query),
    []
  );

  const inviteExistingUser = useCallback<FamilyContextValue['inviteExistingUser']>(
    async (userId, role, displayName, relation) => {
      if (!currentHouseholdId) throw new Error('ยังไม่ได้เลือกครอบครัว');
      await householdsApi.inviteExistingUser(currentHouseholdId, { userId, role, displayName, relation });
      await refreshAll();
    },
    [currentHouseholdId, refreshAll]
  );

  // acceptInvite/declineInvite act on an invite addressed to *this*
  // account in a household that isn't necessarily currentHouseholdId (may
  // not even be in `households` yet) — so they take householdId explicitly
  // rather than assuming the currently-selected one.
  const acceptInvite = useCallback<FamilyContextValue['acceptInvite']>(
    async (householdId, membershipId) => {
      await householdsApi.acceptInvite(householdId, membershipId);
      await Promise.all([refreshHouseholds(), refreshPendingInvites()]);
    },
    [refreshHouseholds, refreshPendingInvites]
  );

  const declineInvite = useCallback<FamilyContextValue['declineInvite']>(
    async (householdId, membershipId) => {
      await householdsApi.declineInvite(householdId, membershipId);
      await refreshPendingInvites();
    },
    [refreshPendingInvites]
  );

  const markNotificationRead = useCallback<FamilyContextValue['markNotificationRead']>(async (id) => {
    await notificationsInboxApi.markNotificationRead(id);
    setNotifications((current) => current.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
  }, []);

  const markAllNotificationsRead = useCallback<FamilyContextValue['markAllNotificationsRead']>(async () => {
    await notificationsInboxApi.markAllNotificationsRead();
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
  }, []);

  const generateClaimCode = useCallback<FamilyContextValue['generateClaimCode']>(
    async (memberId) => {
      if (!currentHouseholdId) throw new Error('ยังไม่ได้เลือกครอบครัว');
      const updated = await householdsApi.generateClaimCode(currentHouseholdId, memberId);
      await refreshAll();
      return updated.claimCode ?? '';
    },
    [currentHouseholdId, refreshAll]
  );

  const claimMembership = useCallback<FamilyContextValue['claimMembership']>(
    async (claimCode) => {
      await householdsApi.claimMembership(claimCode);
      await refreshHouseholds();
    },
    [refreshHouseholds]
  );

  const setDefaultHousehold = useCallback<FamilyContextValue['setDefaultHousehold']>(
    async (householdId) => {
      await householdsApi.setDefaultHousehold(householdId);
      await refreshHouseholds();
    },
    [refreshHouseholds]
  );

  const value = useMemo<FamilyContextValue>(
    () => ({
      households,
      isLoadingHouseholds,
      currentHouseholdId,
      setCurrentHouseholdId,
      currentHousehold,
      currentMembershipId,
      currentRole,
      canEdit,
      canManage,
      canManageFor,
      createHousehold,
      joinHousehold,
      setDefaultHousehold,

      isLoadingData,
      familyMembers,
      tasks,
      timeline,
      medications,
      appointments,
      vitalLogs,

      pendingInvites,
      refreshPendingInvites,
      notifications,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,

      primaryElderId,
      selectedMemberId,
      setSelectedMemberId,

      checkIn,
      updateTaskStatus,
      updateMemberRole,

      addMedication,
      updateMedication,
      removeMedication,
      confirmMedicationTaken,

      addAppointment,
      updateAppointment,
      removeAppointment,

      addVitalLog,

      triggerEmergency,

      addManagedMember,
      lookupUser,
      inviteExistingUser,
      acceptInvite,
      declineInvite,
      generateClaimCode,
      claimMembership,
    }),
    [
      households,
      isLoadingHouseholds,
      currentHouseholdId,
      currentHousehold,
      currentMembershipId,
      currentRole,
      canEdit,
      canManage,
      canManageFor,
      createHousehold,
      joinHousehold,
      setDefaultHousehold,
      isLoadingData,
      familyMembers,
      tasks,
      timeline,
      medications,
      appointments,
      vitalLogs,
      pendingInvites,
      refreshPendingInvites,
      notifications,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      primaryElderId,
      selectedMemberId,
      checkIn,
      updateTaskStatus,
      updateMemberRole,
      addMedication,
      updateMedication,
      removeMedication,
      confirmMedicationTaken,
      addAppointment,
      updateAppointment,
      removeAppointment,
      addVitalLog,
      triggerEmergency,
      addManagedMember,
      lookupUser,
      inviteExistingUser,
      acceptInvite,
      declineInvite,
      generateClaimCode,
      claimMembership,
    ]
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamilyContext() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamilyContext must be used within a FamilyProvider');
  }
  return context;
}
