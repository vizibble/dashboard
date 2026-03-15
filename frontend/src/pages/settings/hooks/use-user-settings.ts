import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  fetchUserSettings,
  updateUserSettings,
} from '@/pages/settings/api/settings-api';
import type { HistoryMode } from '@/pages/settings/types/types';

export function useUserSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertEmails, setAlertEmails] = useState<string[]>([]);
  const [historyMode, setHistoryMode] = useState<HistoryMode>('instant');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchUserSettings();
        setAlertEmails(settings.alert_emails || []);
        setHistoryMode(settings.history_mode || 'instant');
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const addEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email.');
      return;
    }
    if (alertEmails.includes(newEmail)) {
      toast.error('Email already added.');
      return;
    }
    setAlertEmails((prev) => [...prev, newEmail]);
    setNewEmail('');
  };

  const removeEmail = (emailToRemove: string) => {
    setAlertEmails((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const saveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateUserSettings({
        alert_emails: alertEmails,
        history_mode: historyMode,
      });
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    alertEmails,
    newEmail,
    setNewEmail,
    addEmail,
    removeEmail,
    historyMode,
    setHistoryMode,
    saveSettings,
  };
}
