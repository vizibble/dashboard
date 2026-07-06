export type HistoryMode = 'instant' | 'daily' | 'monthly';

export interface UserSettings {
  alert_emails?: string[];
  history_mode?: HistoryMode;
}
