import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { EditModalState, Assignment } from '../../types';
import { generateUUID } from '../../utils';

interface EditShiftModalProps {
  isOpen: boolean;
  data: EditModalState;
  onClose: () => void;
  onSaveShift: (updatedData: EditModalState) => void;
  onSaveAssignment: (updatedData: EditModalState) => void;
  onAssignAndSave: (originalShiftId: string, newDriver: string, newDate: string, newDescription: string, slots: Partial<Assignment>[]) => void;
  existingAssignments: Assignment[];
}

export const EditShiftModal: React.FC<EditShiftModalProps> = ({
  isOpen,
  data,
  onClose,
  onSaveShift,
  onSaveAssignment,
  onAssignAndSave,
  existingAssignments
}) => {
  const [formData, setFormData] = useState<EditModalState>(data);
  const [assignmentSlots, setAssignmentSlots] = useState<{ id: string | null; start: string; end: string }[]>([]);

  useEffect(() => {
    setFormData(data);
    
    // Initialize slots logic
    if (data.type === 'shift') {
        const relevantAssignments = existingAssignments.filter(a => a.originalShiftId === data.id);
        if (relevantAssignments.length > 0) {
            setAssignmentSlots(relevantAssignments.map(a => ({
                id: a.assignmentId,
                start: a.startTime,
                end: a.endTime
            })));
        } else if (!data.isAllDay) {
            // Default slot from shift time
            setAssignmentSlots([{ id: null, start: data.startTime, end: data.endTime }]);
        } else {
            setAssignmentSlots([]);
        }
    } else {
        // For assignment editing, we just use the main form fields
        setAssignmentSlots([]);
    }
  }, [data, existingAssignments]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = () => {
    const defaultStart = !formData.isAllDay ? formData.startTime : '';
    const defaultEnd = !formData.isAllDay ? formData.endTime : '';
    setAssignmentSlots(prev => [...prev, { id: null, start: defaultStart, end: defaultEnd }]);
  };

  const handleRemoveSlot = (index: number) => {
    setAssignmentSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    setAssignmentSlots(prev => {
        const newSlots = [...prev];
        newSlots[index] = { ...newSlots[index], [field]: value };
        return newSlots;
    });
  };

  const handleAssignSave = () => {
    // Validate slots
    if (assignmentSlots.length === 0) {
        alert("Bitte definieren Sie mindestens einen Zuteilungs-Slot.");
        return;
    }
    const validSlots = assignmentSlots.filter(s => s.start && s.end);
    if (validSlots.length !== assignmentSlots.length) {
        alert("Bitte füllen Sie Start- und Endzeit für alle Slots aus.");
        return;
    }
    
    onAssignAndSave(
        formData.id!,
        formData.driver,
        formData.date,
        formData.description,
        validSlots.map(s => ({ assignmentId: s.id || generateUUID(), startTime: s.start, endTime: s.end }))
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-xl w-full m-4">
        <h3 className="text-xl font-bold text-teal-700 mb-6">
            {formData.type === 'shift' ? 'Verfügbarkeit bearbeiten & zuweisen' : 'Finale Zuteilung bearbeiten'}
        </h3>

        <div className="space-y-4 mb-6 pb-4 border-b">
            <h4 className="font-semibold text-gray-700">Basisdaten:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fahrer</label>
                    <input
                        type="text"
                        name="driver"
                        value={formData.driver}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Datum</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Bemerkungen</label>
                <textarea
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                />
            </div>
        </div>

        {formData.type === 'shift' && (
            <div className="mb-6 pb-4">
                <div className="flex justify-between items-center mb-4">
                     <h4 className="font-semibold text-gray-700">Zuteilungs-Slots (Final):</h4>
                    <button onClick={handleAddSlot} className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600">
                        + Zusatzschicht
                    </button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                    {assignmentSlots.length === 0 && <p className="text-gray-500 text-sm italic">Keine Slots. Klicken Sie auf +</p>}
                    {assignmentSlots.map((slot, idx) => (
                        <div key={idx} className="p-2 border border-gray-200 rounded-lg flex space-x-2 items-center bg-gray-50">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Von</label>
                                <input type="time" value={slot.start} onChange={(e) => handleSlotChange(idx, 'start', e.target.value)} className="w-full p-1 border rounded text-sm"/>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Bis</label>
                                <input type="time" value={slot.end} onChange={(e) => handleSlotChange(idx, 'end', e.target.value)} className="w-full p-1 border rounded text-sm"/>
                            </div>
                            <button onClick={() => handleRemoveSlot(idx)} className="text-red-500 hover:text-red-700 p-1 mt-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {formData.type === 'assignment' && (
             <div className="mb-6 pb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Zeitraum:</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Startzeit</label>
                        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg"/>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Endzeit</label>
                        <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg"/>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
            {formData.type === 'shift' ? (
                <>
                    <Button variant="primary" onClick={() => onSaveShift(formData)}>Verfügbarkeit speichern</Button>
                    <Button variant="success" className="bg-blue-600 hover:bg-blue-700" onClick={handleAssignSave}>Zuweisen & Speichern</Button>
                </>
            ) : (
                <Button variant="primary" onClick={() => onSaveAssignment(formData)}>Zuteilung speichern</Button>
            )}
        </div>
      </div>
    </div>
  );
};