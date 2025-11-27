import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from './components/ui/Button';
import { PlanTable } from './components/PlanTable';
import { EditShiftModal } from './components/Modals/EditShiftModal';
import { NotificationSettingsModal } from './components/Modals/NotificationSettingsModal';
import { AppData, Shift, Assignment, PeriodEvent, EditModalState, ModalType, NotificationSettings } from './types';
import { generateUUID, getPlanColumns, formatDateDE, generateICS } from './utils';
import { Save, Upload, Trash2, Calendar, UserPlus, Clock, Bell, Download, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY = 'driverPlanerDataV7';

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
    emailEnabled: false,
    pushEnabled: false,
    notifyOnAssignment: true,
    notifyOnChange: true,
    notifyOnDelete: true
};

const App: React.FC = () => {
  // State
  const [data, setData] = useState<AppData>({
    drivers: [],
    shifts: [],
    assignments: [],
    periodEvents: [],
    specialDates: [],
    notificationSettings: DEFAULT_NOTIFICATIONS
  });

  // UI State
  const [newDriverName, setNewDriverName] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [shiftForm, setShiftForm] = useState({
    driver: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    isAllDay: false
  });
  const [pendingShifts, setPendingShifts] = useState<Omit<Shift, 'id'>[]>([]);
  
  // Admin State
  const [newEvent, setNewEvent] = useState({ name: '', start: '', end: '' });

  // Modal State
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false, type: null, id: null, driver: '', date: '', startTime: '', endTime: '', description: '', isAllDay: false
  });
  
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  // Collapsible State - Added drivers and shifts
  const [collapsedSections, setCollapsedSections] = useState({
    drivers: false,
    shifts: false,
    availability: true,
    final: true,
    admin: true
  });

  // --- Persistence ---
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure notification settings exist
        if (!parsed.notificationSettings) {
            parsed.notificationSettings = DEFAULT_NOTIFICATIONS;
        }
        setData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  const saveData = (newData: AppData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Einsatzplan_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const exportCalendar = () => {
    const icsContent = generateICS(data.assignments);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Einsatzplan_Kalender_${new Date().toISOString().slice(0, 10)}.ics`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (parsed.drivers) {
            saveData({ ...data, ...parsed }); 
            alert("Daten erfolgreich importiert!");
          }
        } catch (err) {
          alert("Fehler beim Importieren der Datei.");
        }
      };
      reader.readAsText(file);
    }
  };

  // --- Notification Simulation ---
  const simulateNotification = (driver: string, action: 'assignment' | 'change' | 'delete') => {
    const s = data.notificationSettings || DEFAULT_NOTIFICATIONS;
    
    // Check global toggles
    if (!s.emailEnabled && !s.pushEnabled) return;
    
    // Check specific action toggles
    if (action === 'assignment' && !s.notifyOnAssignment) return;
    if (action === 'change' && !s.notifyOnChange) return;
    if (action === 'delete' && !s.notifyOnDelete) return;

    const channels = [];
    if (s.emailEnabled) channels.push("E-Mail");
    if (s.pushEnabled) channels.push("Push-Nachricht");
    
    const messages = {
        assignment: `Neue Schichtzuweisung für ${driver}.`,
        change: `Schichtplanänderung für ${driver}.`,
        delete: `Schichtstornierung für ${driver}.`
    };

    alert(`[SIMULATION]\n${messages[action]}\nGesendet via: ${channels.join(', ')}`);
  };

  // --- Logic: Drivers ---
  const addDriver = () => {
    if (!newDriverName.trim()) return;
    if (data.drivers.includes(newDriverName)) {
        alert("Fahrer existiert bereits.");
        return;
    }
    saveData({ ...data, drivers: [...data.drivers, newDriverName] });
    setNewDriverName('');
  };

  const deleteDriver = () => {
    if (!selectedDriver) return;
    const hasShifts = data.shifts.some(s => s.driver === selectedDriver);
    const hasAssignments = data.assignments.some(a => a.driver === selectedDriver);
    if (hasShifts || hasAssignments) {
        alert("Fahrer kann nicht gelöscht werden, da Schichten vorhanden sind.");
        return;
    }
    if (window.confirm(`Fahrer ${selectedDriver} wirklich löschen?`)) {
        saveData({ ...data, drivers: data.drivers.filter(d => d !== selectedDriver) });
        setSelectedDriver('');
    }
  };

  // --- Logic: Shifts ---
  const addPendingShift = () => {
    if (!shiftForm.driver || !shiftForm.date) return alert("Fahrer und Datum erforderlich.");
    if (!shiftForm.isAllDay && (!shiftForm.startTime || !shiftForm.endTime)) return alert("Zeit erforderlich.");

    setPendingShifts([...pendingShifts, { ...shiftForm }]);
    setShiftForm({ ...shiftForm, description: '', startTime: '', endTime: '', isAllDay: false });
  };

  const commitPendingShifts = () => {
    const newShifts = pendingShifts.map(s => ({ ...s, id: generateUUID() }));
    saveData({ ...data, shifts: [...data.shifts, ...newShifts] });
    setPendingShifts([]);
  };

  // --- Logic: Admin Events ---
  const addEvent = () => {
    if (!newEvent.name || !newEvent.start || !newEvent.end) return;
    const evt: PeriodEvent = {
        id: generateUUID(),
        name: newEvent.name,
        startDate: newEvent.start,
        endDate: newEvent.end
    };
    saveData({ ...data, periodEvents: [...data.periodEvents, evt] });
    setNewEvent({ name: '', start: '', end: '' });
  };

  const deleteEvent = (id: string) => {
    saveData({ ...data, periodEvents: data.periodEvents.filter(e => e.id !== id) });
  };

  // --- Logic: Modal & Editing ---
  const handleCellClick = (items: (Shift | Assignment)[], type: ModalType) => {
    const item = items[0];
    if (!item) return;

    setEditModal({
        isOpen: true,
        type,
        id: type === 'shift' ? (item as Shift).id : (item as Assignment).assignmentId,
        driver: item.driver,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        description: item.description,
        isAllDay: 'isAllDay' in item ? (item as Shift).isAllDay : false
    });
  };

  const saveEditedShift = (modalData: EditModalState) => {
    const idx = data.shifts.findIndex(s => s.id === modalData.id);
    if (idx === -1) return;
    
    const updatedShifts = [...data.shifts];
    updatedShifts[idx] = {
        ...updatedShifts[idx],
        driver: modalData.driver,
        date: modalData.date,
        description: modalData.description
    };
    
    let updatedDrivers = data.drivers;
    if (!data.drivers.includes(modalData.driver)) {
        updatedDrivers = [...data.drivers, modalData.driver];
    }
    
    saveData({ ...data, shifts: updatedShifts, drivers: updatedDrivers });
    setEditModal({ ...editModal, isOpen: false });
    // Note: Availability change is usually not notified unless it affects assignment, but could be.
  };

  const saveEditedAssignment = (modalData: EditModalState) => {
    const idx = data.assignments.findIndex(a => a.assignmentId === modalData.id);
    if (idx === -1) return;

    const updated = [...data.assignments];
    updated[idx] = {
        ...updated[idx],
        driver: modalData.driver,
        date: modalData.date,
        startTime: modalData.startTime,
        endTime: modalData.endTime,
        description: modalData.description
    };

    saveData({ ...data, assignments: updated });
    setEditModal({ ...editModal, isOpen: false });
    simulateNotification(modalData.driver, 'change');
  };

  const assignAndSave = (originalShiftId: string, newDriver: string, newDate: string, newDescription: string, slots: Partial<Assignment>[]) => {
    const filteredAssignments = data.assignments.filter(a => a.originalShiftId !== originalShiftId);
    
    const newAssignments: Assignment[] = slots.map(slot => ({
        assignmentId: slot.assignmentId || generateUUID(),
        originalShiftId,
        driver: newDriver,
        date: newDate,
        startTime: slot.startTime!,
        endTime: slot.endTime!,
        description: newDescription
    }));

    const shiftIdx = data.shifts.findIndex(s => s.id === originalShiftId);
    const updatedShifts = [...data.shifts];
    if (shiftIdx > -1) {
        updatedShifts[shiftIdx] = { ...updatedShifts[shiftIdx], driver: newDriver, date: newDate, description: newDescription };
    }

    saveData({ ...data, shifts: updatedShifts, assignments: [...filteredAssignments, ...newAssignments] });
    setEditModal({ ...editModal, isOpen: false });
    
    if (newAssignments.length > 0) {
        simulateNotification(newDriver, 'assignment');
    }
  };
  
  const saveNotifications = (settings: NotificationSettings) => {
    saveData({ ...data, notificationSettings: settings });
    setNotificationModalOpen(false);
  };

  const columns = getPlanColumns(data.periodEvents);

  // Helper for Headers
  const renderSectionHeader = (title: string, icon: React.ReactNode, sectionKey: keyof typeof collapsedSections) => (
    <div 
        className="flex justify-between items-center cursor-pointer border-b pb-2 mb-4 hover:bg-gray-50 transition p-2 rounded"
        onClick={() => setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
    >
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            {icon} <span className="ml-2">{title}</span>
        </h2>
        {collapsedSections[sectionKey] ? <ChevronDown className="text-gray-500"/> : <ChevronUp className="text-gray-500"/>}
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 font-inter bg-gray-100">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4 md:mb-0">🚐 Einsatzplaner</h1>
        
        <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => setNotificationModalOpen(true)} className="flex items-center text-sm">
                <Bell className="w-4 h-4 mr-2"/> Benachrichtigungen
            </Button>
            <Button variant="outline" onClick={exportCalendar} className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2"/> Kalender-Export (.ics)
            </Button>
            <Button variant="secondary" onClick={exportData} className="flex items-center text-sm">
                <Save className="w-4 h-4 mr-2"/> Backup
            </Button>
            <label className="flex items-center px-4 py-2 bg-white text-gray-700 font-bold rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer shadow-sm transition text-sm">
                <Upload className="w-4 h-4 mr-2"/> Restore
                <input type="file" className="hidden" onChange={importData} accept=".json" />
            </label>
        </div>
      </header>

      {/* DRIVER MANAGEMENT */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {renderSectionHeader("Fahrer verwalten", <UserPlus className="text-teal-600"/>, 'drivers')}
        
        {!collapsedSections.drivers && (
            <>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input 
                        type="text" 
                        placeholder="Neuer Fahrer Name" 
                        value={newDriverName} 
                        onChange={e => setNewDriverName(e.target.value)} 
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    <Button onClick={addDriver}>Hinzufügen</Button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center pt-4 border-t">
                    <select 
                        value={selectedDriver} 
                        onChange={e => setSelectedDriver(e.target.value)}
                        className="flex-grow w-full p-3 border border-gray-300 rounded-lg"
                    >
                        <option value="">Fahrer zum Löschen wählen...</option>
                        {data.drivers.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <Button variant="danger" disabled={!selectedDriver} onClick={deleteDriver} className="whitespace-nowrap">
                        <Trash2 className="w-4 h-4 mr-2 inline" /> Löschen
                    </Button>
                </div>
            </>
        )}
      </div>

      {/* SHIFT CREATION */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {renderSectionHeader("Schicht anlegen (Verfügbarkeit)", <Clock className="text-teal-600"/>, 'shifts')}

        {!collapsedSections.shifts && (
            <>
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fahrer</label>
                        <select 
                            value={shiftForm.driver}
                            onChange={e => setShiftForm({...shiftForm, driver: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                            <option value="">Wählen...</option>
                            {data.drivers.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                        <select 
                            value={shiftForm.date}
                            onChange={e => setShiftForm({...shiftForm, date: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                            <option value="">Wählen...</option>
                            {columns.filter(c => c.type !== 'separator').map(c => (
                                <option key={c.date} value={c.date}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 w-full md:w-1/3 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
                            <input type="time" disabled={shiftForm.isAllDay} value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})} className="w-full p-3 border rounded-lg"/>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
                            <input type="time" disabled={shiftForm.isAllDay} value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})} className="w-full p-3 border rounded-lg"/>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center mb-4">
                    <input 
                        id="allday" 
                        type="checkbox" 
                        checked={shiftForm.isAllDay} 
                        onChange={e => setShiftForm({...shiftForm, isAllDay: e.target.checked})}
                        className="w-4 h-4 text-teal-600 rounded"
                    />
                    <label htmlFor="allday" className="ml-2 text-sm font-medium text-gray-900">Ganztägig</label>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="Bemerkung (z.B. Frühschicht)" 
                        value={shiftForm.description} 
                        onChange={e => setShiftForm({...shiftForm, description: e.target.value})}
                        className="flex-grow p-3 border rounded-lg"
                    />
                    <Button onClick={addPendingShift} className="whitespace-nowrap">+ Zur Liste</Button>
                </div>

                {pendingShifts.length > 0 && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
                        <h3 className="font-bold text-gray-700 mb-2">Zu speichern:</h3>
                        <ul className="space-y-2 mb-4">
                            {pendingShifts.map((s, i) => (
                                <li key={i} className="flex justify-between bg-white p-2 rounded shadow-sm border">
                                    <span>{s.driver} | {s.date} | {s.isAllDay ? '24h' : `${s.startTime}-${s.endTime}`}</span>
                                    <button onClick={() => setPendingShifts(pendingShifts.filter((_, idx) => idx !== i))} className="text-red-500 font-bold">×</button>
                                </li>
                            ))}
                        </ul>
                        <Button fullWidth onClick={commitPendingShifts}>Alle anlegen</Button>
                    </div>
                )}
            </>
        )}
      </div>

      {/* PLANS */}
      <PlanTable 
        id="availability"
        title="Verfügbarkeiten Übersicht"
        data={data}
        columns={columns}
        mode="availability"
        onCellClick={handleCellClick}
        isCollapsed={collapsedSections.availability}
        toggleCollapse={() => setCollapsedSections(prev => ({ ...prev, availability: !prev.availability }))}
      />

      <PlanTable 
        id="final"
        title="Finaler Einsatzplan"
        data={data}
        columns={columns}
        mode="final"
        onCellClick={handleCellClick}
        isCollapsed={collapsedSections.final}
        toggleCollapse={() => setCollapsedSections(prev => ({ ...prev, final: !prev.final }))}
      />

      {/* ADMIN */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {renderSectionHeader("Admin: Events", <Calendar className="text-teal-600"/>, 'admin')}
        
        {!collapsedSections.admin && (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500">Event Name</label>
                        <input type="text" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Start</label>
                        <input type="date" value={newEvent.start} onChange={e => setNewEvent({...newEvent, start: e.target.value})} className="w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Ende</label>
                        <input type="date" value={newEvent.end} onChange={e => setNewEvent({...newEvent, end: e.target.value})} className="w-full p-2 border rounded"/>
                    </div>
                </div>
                <Button onClick={addEvent} variant="secondary" className="mb-6">Event hinzufügen</Button>

                <ul className="divide-y">
                    {data.periodEvents.map(e => (
                        <li key={e.id} className="py-2 flex justify-between items-center">
                            <span><strong>{e.name}</strong> ({formatDateDE(e.startDate)} - {formatDateDE(e.endDate)})</span>
                            <button onClick={() => deleteEvent(e.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </li>
                    ))}
                    {data.periodEvents.length === 0 && <li className="text-gray-500 italic">Keine Events.</li>}
                </ul>
            </div>
        )}
      </div>

      {/* MODALS */}
      <EditShiftModal 
        isOpen={editModal.isOpen}
        data={editModal}
        onClose={() => setEditModal({ ...editModal, isOpen: false })}
        onSaveShift={saveEditedShift}
        onSaveAssignment={saveEditedAssignment}
        onAssignAndSave={assignAndSave}
        existingAssignments={data.assignments}
      />

      <NotificationSettingsModal
        isOpen={notificationModalOpen}
        settings={data.notificationSettings || DEFAULT_NOTIFICATIONS}
        onClose={() => setNotificationModalOpen(false)}
        onSave={saveNotifications}
      />
    </div>
  );
};

export default App;