import React, { createContext, useContext, useMemo, useState } from 'react';

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
  type: 'check-in' | 'medication' | 'task' | 'appointment';
};

type FamilyContextValue = {
  familyMembers: FamilyMember[];
  tasks: FamilyTask[];
  timeline: FamilyEvent[];
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  updateTaskStatus: (taskId: string, status: FamilyTask['status']) => void;
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

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [familyMembers] = useState(initialMembers);
  const [tasks, setTasks] = useState(initialTasks);
  const [timeline] = useState(initialTimeline);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMembers[0].id);

  const updateTaskStatus = (taskId: string, status: FamilyTask['status']) => {
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const value = useMemo(
    () => ({
      familyMembers,
      tasks,
      timeline,
      selectedMemberId,
      setSelectedMemberId,
      updateTaskStatus,
    }),
    [familyMembers, tasks, timeline, selectedMemberId]
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
