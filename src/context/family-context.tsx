import React, { createContext, useContext, useMemo, useState } from 'react';

import { addDays, formatTime, toDateKey } from '@/utils/date';

export type MemberRole = 'Owner' | 'Caregiver' | 'Elder' | 'Viewer';
export type MemberStatus = 'normal' | 'monitor' | 'urgent';

export type FamilyMember = {
  id: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  detail: string;
  relation: string;
};

export type FamilyTask = {
  id: string;
  title: string;
  detail: string;
  status: 'pending' | 'in-progress' | 'done';
  owner: string;
};

export type FamilyEvent = {
  id: string;
  title: string;
  time: string;
  detail: string;
  type: 'check-in' | 'medication' | 'task' | 'appointment' | 'vitals' | 'emergency';
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
  /** ISO timestamp of the last confirmed dose, if any. */
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

type FamilyContextValue = {
  familyMembers: FamilyMember[];
  tasks: FamilyTask[];
  timeline: FamilyEvent[];
  medications: Medication[];
  appointments: Appointment[];
  vitalLogs: VitalLog[];

  /** The family's Elder member — used as the default "me" on elder-facing screens. */
  primaryElderId: string;

  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;

  updateTaskStatus: (taskId: string, status: FamilyTask['status']) => void;
  /** `time` is stamped automatically from the current clock — callers only supply what happened. */
  addTimelineEvent: (event: Omit<FamilyEvent, 'id' | 'time'>) => void;

  addMedication: (input: Omit<Medication, 'id' | 'lastTakenAt'>) => string;
  updateMedication: (id: string, patch: Partial<Omit<Medication, 'id'>>) => void;
  removeMedication: (id: string) => void;
  confirmMedicationTaken: (id: string) => void;

  addAppointment: (input: Omit<Appointment, 'id'>) => string;
  updateAppointment: (id: string, patch: Partial<Omit<Appointment, 'id'>>) => void;
  removeAppointment: (id: string) => void;

  addVitalLog: (input: Omit<VitalLog, 'id'>) => void;
};

const initialMembers: FamilyMember[] = [
  { id: 'mom', name: 'แม่สมใจ', role: 'Elder', status: 'normal', detail: 'Check-in 08:32', relation: 'แม่' },
  { id: 'dad', name: 'พ่อประสิทธิ์', role: 'Elder', status: 'monitor', detail: 'ยา 12:00 ยังไม่ยืนยัน', relation: 'พ่อ' },
  { id: 'brother', name: 'พี่เกษม', role: 'Caregiver', status: 'normal', detail: 'รับผิดชอบดูแลวันนี้', relation: 'พี่' },
];

const initialTasks: FamilyTask[] = [
  { id: 'checkin', title: 'Check-in', detail: 'แม่สมใจยืนยันแล้ว', status: 'done', owner: 'แม่สมใจ' },
  { id: 'medication', title: 'Medication', detail: 'ยา 08:00 กำลังรอยืนยัน', status: 'pending', owner: 'พี่เกษม' },
  { id: 'appointment', title: 'Appointment', detail: 'นัดตรวจ 14:00 พร้อม checklist', status: 'in-progress', owner: 'พี่เกษม' },
];

const initialTimeline: FamilyEvent[] = [
  { id: 'event-1', title: 'Check-in completed', time: '08:32', detail: 'แม่สมใจยืนยันว่าปกติดี', type: 'check-in' },
  { id: 'event-2', title: 'Medication confirmation', time: '08:45', detail: 'Photo confirmation ถูกเพิ่มแล้ว', type: 'medication' },
  { id: 'event-3', title: 'Family task assigned', time: '10:20', detail: 'พี่เกษมรับผิดชอบจัดเตรียมโรงพยาบาล', type: 'task' },
];

const initialMedications: Medication[] = [
  {
    id: 'med-amlodipine',
    memberId: 'mom',
    name: 'Amlodipine',
    dosage: '5 mg · 1 เม็ด',
    reason: 'ควบคุมความดันโลหิต',
    schedule: ['08:00'],
    notes: 'ทานหลังอาหารเช้า',
    active: true,
  },
  {
    id: 'med-metformin',
    memberId: 'mom',
    name: 'Metformin',
    dosage: '500 mg · 1 เม็ด',
    reason: 'ควบคุมเบาหวาน',
    schedule: ['08:00', '18:00'],
    notes: 'ทานพร้อมอาหารเพื่อลดอาการระคายเคืองกระเพาะ',
    active: true,
  },
  {
    id: 'med-aspirin',
    memberId: 'dad',
    name: 'Aspirin',
    dosage: '81 mg · 1 เม็ด',
    reason: 'ป้องกันเส้นเลือดอุดตัน',
    schedule: ['12:00'],
    active: true,
  },
];

const initialAppointments: Appointment[] = [
  {
    id: 'apt-checkup',
    memberId: 'mom',
    title: 'ตรวจสุขภาพประจำปี',
    date: toDateKey(addDays(new Date(), 2)),
    time: '09:00',
    hospital: 'โรงพยาบาลกรุงเทพ ชั้น 4',
    doctor: 'นพ. พงศ์',
    department: 'อายุรกรรม',
    medicationNote: 'แพทย์อาจปรับยาความดันหลังผลตรวจ',
    linkedMedicationIds: ['med-amlodipine'],
    reminderEnabled: true,
  },
  {
    id: 'apt-dental',
    memberId: 'dad',
    title: 'ตรวจฟัน',
    date: toDateKey(addDays(new Date(), 5)),
    time: '13:00',
    hospital: 'คลินิกทันตกรรมสุขใจ',
    doctor: 'ทพญ. อร',
    department: 'ทันตกรรม',
    notes: 'งดอาหารก่อนตรวจ 1 ชั่วโมง',
    linkedMedicationIds: [],
    reminderEnabled: false,
  },
];

const initialVitalLogs: VitalLog[] = [
  {
    id: 'vital-1',
    memberId: 'mom',
    recordedAt: addDays(new Date(), -1).toISOString(),
    systolic: 128,
    diastolic: 82,
    sugar: 98,
    note: 'รู้สึกปกติดี',
  },
];

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [familyMembers] = useState(initialMembers);
  const [tasks, setTasks] = useState(initialTasks);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [medications, setMedications] = useState(initialMedications);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [vitalLogs, setVitalLogs] = useState(initialVitalLogs);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMembers[0].id);

  const primaryElderId = useMemo(
    () => familyMembers.find((member) => member.role === 'Elder')?.id ?? familyMembers[0].id,
    [familyMembers]
  );

  const updateTaskStatus = (taskId: string, status: FamilyTask['status']) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const addTimelineEvent: FamilyContextValue['addTimelineEvent'] = (event) => {
    setTimeline((current) => [{ ...event, id: createId('event'), time: formatTime(new Date()) }, ...current]);
  };

  const addMedication: FamilyContextValue['addMedication'] = (input) => {
    const id = createId('med');
    setMedications((current) => [...current, { ...input, id }]);
    return id;
  };

  const updateMedication: FamilyContextValue['updateMedication'] = (id, patch) => {
    setMedications((current) => current.map((med) => (med.id === id ? { ...med, ...patch } : med)));
  };

  const removeMedication = (id: string) => {
    setMedications((current) => current.filter((med) => med.id !== id));
  };

  const confirmMedicationTaken = (id: string) => {
    const target = medications.find((med) => med.id === id);
    if (!target) return;

    setMedications((current) =>
      current.map((med) => (med.id === id ? { ...med, lastTakenAt: new Date().toISOString() } : med))
    );
    addTimelineEvent({
      title: `ยืนยันทานยา: ${target.name}`,
      detail: target.dosage,
      type: 'medication',
    });
  };

  const addAppointment: FamilyContextValue['addAppointment'] = (input) => {
    const id = createId('apt');
    setAppointments((current) => [...current, { ...input, id }]);
    addTimelineEvent({
      title: `เพิ่มนัดหมาย: ${input.title}`,
      detail: `${input.hospital} · ${input.date}`,
      type: 'appointment',
    });
    return id;
  };

  const updateAppointment: FamilyContextValue['updateAppointment'] = (id, patch) => {
    setAppointments((current) => current.map((apt) => (apt.id === id ? { ...apt, ...patch } : apt)));
  };

  const removeAppointment = (id: string) => {
    setAppointments((current) => current.filter((apt) => apt.id !== id));
  };

  const addVitalLog: FamilyContextValue['addVitalLog'] = (input) => {
    setVitalLogs((current) => [{ ...input, id: createId('vital') }, ...current]);
    addTimelineEvent({
      title: 'บันทึกสุขภาพใหม่',
      detail: [
        input.systolic && input.diastolic ? `ความดัน ${input.systolic}/${input.diastolic}` : null,
        input.sugar ? `น้ำตาล ${input.sugar}` : null,
        input.weight ? `น้ำหนัก ${input.weight} กก.` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      type: 'vitals',
    });
  };

  const value = useMemo(
    () => ({
      familyMembers,
      tasks,
      timeline,
      medications,
      appointments,
      vitalLogs,
      primaryElderId,
      selectedMemberId,
      setSelectedMemberId,
      updateTaskStatus,
      addTimelineEvent,
      addMedication,
      updateMedication,
      removeMedication,
      confirmMedicationTaken,
      addAppointment,
      updateAppointment,
      removeAppointment,
      addVitalLog,
    }),
    [familyMembers, tasks, timeline, medications, appointments, vitalLogs, primaryElderId, selectedMemberId]
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
