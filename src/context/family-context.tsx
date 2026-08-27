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
  hasAccount: boolean;
  membershipState: 'active' | 'pending';
  // Raw "last check-in ever" timestamp — the server never resets this daily
  // (see household-member.model.js on the backend). Never format/compare
  // this field directly in a screen: always go through isCheckedInToday()/
  // checkInTime() in utils/member-status.ts, which gate on today's local
  // date. Reading it raw is exactly how a stale check-in from a previous
  // day would render next to an "awaiting check-in" badge as if it were
  // today's.
  lastCheckInAt: string | null;
};

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
  relatedType: 'checkin' | 'medication' | 'appointment' | 'vitals' | 'custom';
};

export type FamilyEvent = {
  id: string;
  title: string;
  time: string;
  detail: string;
  type: 'check-in' | 'medication' | 'task' | 'appointment' | 'vitals' | 'emergency';
  occurredAt: string;
};

export type Medication = {
  id: string;
  memberId: string;
  name: string;
  dosage: string;
  reason?: string;
  schedule: string[];
  notes?: string;
  active: boolean;
  lastTakenAt?: string;
};

export type Appointment = {
  id: string;
  memberId: string;
  title: string;
  date: string;
  time: string;
  hospital: string;
  doctor?: string;
  department?: string;
  notes?: string;
  medicationNote?: string;
  linkedMedicationIds: string[];
  reminderEnabled: boolean;
};

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

export type HouseholdSummary = {
  id: string;
  name: string;
  inviteCode: string;
  role: MemberRole;
  membershipId: string;
  kind: HouseholdKind;
  isDefault: boolean;
};

type FamilyContextValue = {
  households: HouseholdSummary[];
  isLoadingHouseholds: boolean;
  currentHouseholdId: string | null;
  setCurrentHouseholdId: (id: string | null) => void;
  currentHousehold: HouseholdSummary | null;
  currentMembershipId: string | null;
  currentRole: MemberRole | null;
  canEdit: boolean;
  canManage: boolean;
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
  setDefaultHousehold: (householdId: string) => Promise<void>;

  isLoadingData: boolean;
  familyMembers: FamilyMember[];
  tasks: FamilyTask[];
  timeline: FamilyEvent[];
  medications: Medication[];
  appointments: Appointment[];
  vitalLogs: VitalLog[];

  pendingInvites: PendingInvite[];
  refreshPendingInvites: () => Promise<void>;

  notifications: ApiNotification[];
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  primaryElderId: string;

  selfMemberId: string;

  resolveDefaultMemberId: (explicitMemberId?: string) => string;

  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;

  checkIn: (memberId?: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: FamilyTask['status']) => Promise<void>;
  updateMemberRole: (memberId: string, role: HouseholdRole) => Promise<void>;

  addMedication: (input: Omit<Medication, 'id' | 'lastTakenAt'>) => Promise<string>;
  updateMedication: (id: string, patch: Partial<Omit<Medication, 'id'>>) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  confirmMedicationTaken: (id: string, extra?: { image?: string; photoTakenAt?: string }) => Promise<void>;

  addAppointment: (input: Omit<Appointment, 'id'>) => Promise<string>;
  updateAppointment: (id: string, patch: Partial<Omit<Appointment, 'id'>>) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;

  addVitalLog: (input: Omit<VitalLog, 'id'>) => Promise<void>;

  triggerEmergency: (message?: string) => Promise<void>;

  addManagedMember: (input: {
    displayName: string;
    relation: string;
    role: Extract<HouseholdRole, 'elder' | 'viewer'>;
    birthday?: string | null;
    gender?: string | null;
  }) => Promise<string>;

  lookupUser: (query: { code: string } | { email: string }) => Promise<householdsApi.ApiUserLookup>;
  inviteExistingUser: (
    userId: string,
    role: Exclude<HouseholdRole, 'owner'>,
    displayName: string,
    relation: string
  ) => Promise<void>;
  acceptInvite: (householdId: string, membershipId: string) => Promise<void>;
  declineInvite: (householdId: string, membershipId: string) => Promise<void>;

  generateClaimCode: (memberId: string) => Promise<string>;
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
  lastCheckInAt: member.lastCheckInAt,
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
      const active = mine.filter(({ membership }) => membership.membershipState !== 'pending');
      const summaries = active.map(toSummary);
      setHouseholds(summaries);
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

  const householdNotifications = useMemo(
    () => notifications.filter((item) => item.householdId === null || item.householdId === currentHouseholdId),
    [notifications, currentHouseholdId]
  );

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

  const selfMemberId = currentMembershipId ?? primaryElderId;

  const resolveDefaultMemberId = useCallback(
    (explicitMemberId?: string) =>
      explicitMemberId ?? (currentRole === 'Elder' ? (currentMembershipId ?? primaryElderId) : primaryElderId),
    [currentRole, currentMembershipId, primaryElderId]
  );

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

  const checkIn = useCallback(async (memberId?: string) => {
    const target = memberId ?? currentMembershipId;
    if (!currentHouseholdId || !target) return;
    await householdsApi.checkIn(currentHouseholdId, target);
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
      notifications: householdNotifications,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,

      primaryElderId,
      selfMemberId,
      resolveDefaultMemberId,
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
      householdNotifications,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      primaryElderId,
      selfMemberId,
      resolveDefaultMemberId,
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
