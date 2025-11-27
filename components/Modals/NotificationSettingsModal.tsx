import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { NotificationSettings } from '../../types';
import { Bell, Mail, Smartphone } from 'lucide-react';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  settings: NotificationSettings;
  onClose: () => void;
  onSave: (settings: NotificationSettings) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);

  if (!isOpen) return null;

  const toggleSetting = (key: keyof NotificationSettings) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full m-4">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Bell className="w-6 h-6 mr-2 text-teal-600" /> Benachrichtigungen
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
            Konfigurieren Sie hier, wie Fahrer über Änderungen informiert werden sollen.
            <br/><em className="text-xs">(Hinweis: Da dies eine lokale Browser-App ist, werden E-Mails nur simuliert).</em>
        </p>

        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                        <div className="font-medium text-gray-900">E-Mail Versand</div>
                        <div className="text-xs text-gray-500">Sende Bestätigungen per E-Mail</div>
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    checked={localSettings.emailEnabled} 
                    onChange={() => toggleSetting('emailEnabled')}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                    <Smartphone className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                        <div className="font-medium text-gray-900">Push-Nachrichten</div>
                        <div className="text-xs text-gray-500">Benachrichtigung auf Mobilgeräten</div>
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    checked={localSettings.pushEnabled} 
                    onChange={() => toggleSetting('pushEnabled')}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
            </div>

            <div className="border-t pt-4 space-y-2">
                <label className="flex items-center space-x-3 text-sm text-gray-700">
                    <input type="checkbox" checked={localSettings.notifyOnAssignment} onChange={() => toggleSetting('notifyOnAssignment')} className="rounded text-teal-600"/>
                    <span>Bei neuer Zuweisung benachrichtigen</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700">
                    <input type="checkbox" checked={localSettings.notifyOnChange} onChange={() => toggleSetting('notifyOnChange')} className="rounded text-teal-600"/>
                    <span>Bei Änderungen benachrichtigen</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700">
                    <input type="checkbox" checked={localSettings.notifyOnDelete} onChange={() => toggleSetting('notifyOnDelete')} className="rounded text-teal-600"/>
                    <span>Bei Stornierung benachrichtigen</span>
                </label>
            </div>
        </div>

        <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
            <Button onClick={() => onSave(localSettings)}>Einstellungen speichern</Button>
        </div>
      </div>
    </div>
  );
};