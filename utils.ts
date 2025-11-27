import { AppData, DateColumn, PeriodEvent, Assignment } from './types';

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const formatDateDE = (dateString: string, includeYear = false): string => {
  if (!dateString || !dateString.includes('-')) {
    return 'N/A';
  }
  const [year, month, day] = dateString.split('-');
  if (includeYear) {
    return `${day}.${month}.${year}`;
  }
  return `${day}.${month}.`;
};

// Helper to calculate date columns including separators for months or gaps
export const getPlanColumns = (periodEvents: PeriodEvent[]): DateColumn[] => {
  const PRESET_DATES = [
    { date: '2025-11-21', label: '21. November (S/N)' }, 
    { date: '2025-11-22', label: '22. November 2025 (S/N)' }, 
    { date: '2025-11-23', label: '23. November 2025 (S/N)', isGroupSeparator: true },
    { date: '2025-11-28', label: '28. November 2025 (S/N)' }, 
    { date: '2025-11-29', label: '29. November 2025 (S/N)' }, 
    { date: '2025-11-30', label: '30. November 2025 (S/N)', isGroupSeparator: true },
    { date: '2025-12-05', label: '05. Dezember 2025 (S/N)' },
    { date: '2025-12-06', label: '06. Dezember 2025 (S/N)' },
    { date: '2025-12-07', label: '07. Dezember 2025 (S/N)', isGroupSeparator: true },
    { date: '2025-12-12', label: '12. Dezember 2025 (S/N)' },
    { date: '2025-12-13', label: '13. Dezember 2025 (S/N)' },
    { date: '2025-12-14', label: '14. Dezember 2025 (S/N)', isGroupSeparator: true },
    { date: '2025-12-19', label: '19. Dezember 2025 (S/N)' },
    { date: '2025-12-20', label: '20. Dezember 2025 (S/N)' },
    { date: '2025-12-21', label: '21. Dezember 2025 (S/N)', isGroupSeparator: true },
    { date: '2025-12-24', label: '24. Dezember 2025 (Heiligabend)' }, 
    { date: '2025-12-25', label: '25. Dezember 2025 (1. Weihnachtstag)' },
    { date: '2025-12-26', label: '26. Dezember 2025 (2. Weihnachtstag)' },
    { date: '2025-12-31', label: '31. Dezember 2025 (Silvester)' }, 
    { date: '2026-01-01', label: '01. Januar 2026 (Neujahr)' }, 
  ];

  const columns: DateColumn[] = [];
  let currentGroupMonth: number | null = null;
  let currentGroupYear: number | null = null;
  let lastDate: Date | null = null;

  PRESET_DATES.forEach(d => {
    const dateObj = new Date(d.date + 'T00:00:00');
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();

    let isNewGroup = false;

    // Month Separator
    if (month !== currentGroupMonth || year !== currentGroupYear) {
        const monthName = dateObj.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        columns.push({
            type: 'separator',
            date: `sep-${month}-${year}`,
            label: `--- ${monthName.toUpperCase()} ---`,
            userLabel: ''
        });
        currentGroupMonth = month;
        currentGroupYear = year;
        lastDate = null;
        isNewGroup = true;
    }

    // Gap Separator
    if (lastDate && !isNewGroup) {
        const diffTime = Math.abs(dateObj.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays > 1.5) {
            columns.push({
                type: 'separator',
                date: `gap-${d.date}`,
                label: '---',
                userLabel: ''
            });
        }
    }

    const weekday = dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
    const match = d.label.match(/\((.*?)\)/);
    const userLabel = match ? match[1] : d.label;

    columns.push({
        type: 'date',
        date: d.date,
        label: d.label,
        userLabel: userLabel,
        weekday: weekday
    });

    lastDate = dateObj;
  });

  return columns;
};

export const DRIVER_COLORS = [
    { bg: '#D1FAE5', border: '#10B981' }, 
    { bg: '#DBEAFE', border: '#3B82F6' }, 
    { bg: '#FEF3C7', border: '#F59E0B' }, 
    { bg: '#FEE2E2', border: '#EF4444' }, 
    { bg: '#E0E7FF', border: '#6366F1' }, 
    { bg: '#FCE7F3', border: '#EC4899' }, 
    { bg: '#F3E8FF', border: '#A855F7' }, 
    { bg: '#CFFAFE', border: '#06B6D4' }, 
    { bg: '#FFE4E6', border: '#F43F5E' }, 
    { bg: '#D6D3D1', border: '#78716C' }, 
];

export const generateICS = (assignments: Assignment[]): string => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Einsatzplaner//DE\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

  assignments.forEach(assignment => {
    // Format dates to YYYYMMDDTHHmmSSZ
    const dateStr = assignment.date.replace(/-/g, '');
    const startStr = assignment.startTime.replace(/:/g, '') + '00';
    const endStr = assignment.endTime.replace(/:/g, '') + '00';

    const dtStart = `${dateStr}T${startStr}`;
    const dtEnd = `${dateStr}T${endStr}`;
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = assignment.assignmentId;

    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${uid}\n`;
    icsContent += `DTSTAMP:${now}\n`;
    icsContent += `DTSTART:${dtStart}\n`;
    icsContent += `DTEND:${dtEnd}\n`;
    icsContent += `SUMMARY:Schicht: ${assignment.driver}\n`;
    icsContent += `DESCRIPTION:${assignment.description || 'Keine Bemerkung'}\n`;
    icsContent += "STATUS:CONFIRMED\n";
    icsContent += "END:VEVENT\n";
  });

  icsContent += "END:VCALENDAR";
  return icsContent;
};