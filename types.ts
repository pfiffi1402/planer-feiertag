export interface Shift {
  id: string;
  driver: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  isAllDay: boolean;
}

export interface Assignment {
  assignmentId: string;
  originalShiftId: string;
  driver: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

export interface PeriodEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  notifyOnAssignment: boolean;
  notifyOnChange: boolean;
  notifyOnDelete: boolean;
}

export interface AppData {
  drivers: string[];
  shifts: Shift[];
  assignments: Assignment[];
  periodEvents: PeriodEvent[];
  specialDates: Array<{ date: string; label: string; userLabel?: string }>; 
  notificationSettings?: NotificationSettings;
}

export interface DateColumn {
  date: string;
  label: string;
  userLabel: string;
  type: 'date' | 'separator';
  weekday?: string;
}

export type ModalType = 'shift' | 'assignment' | null;

export interface EditModalState {
  isOpen: boolean;
  type: ModalType;
  id: string | null;
  driver: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  isAllDay: boolean;
}