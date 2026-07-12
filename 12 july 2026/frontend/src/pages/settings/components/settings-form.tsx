import { Mail, X, Plus, Loader } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useUserSettings } from '@/pages/settings/hooks/use-user-settings';
import type { HistoryMode } from '@/pages/settings/types/types';

export function SettingsForm() {
  const {
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
  } = useUserSettings();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-xl border-dashed bg-slate-50/50">
        <Spinner className="size-6 text-primary mb-3" />
        <span className="text-sm font-medium text-slate-500">
          Fetching your preferences...
        </span>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={saveSettings}>
      <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden transition-all duration-300">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-xl text-slate-800">
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 relative">
              <div className="flex gap-2 relative pr-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="new-email"
                  className="w-full pl-10 h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                  type="email"
                  value={newEmail}
                  placeholder="alerts@example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button
                  className="h-11 border-slate-200 px-4 shrink-0 transition-colors shadow-none"
                  type="button"
                  variant="outline"
                  onClick={addEmail}
                >
                  <Plus className="size-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {alertEmails.length !== 0 &&
                alertEmails.map((email) => (
                  <div
                    key={email}
                    className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {email}
                    </span>
                    <Button
                      className="text-slate-400 hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 shrink-0"
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmail(email)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
            </div>

            <p className="text-xs text-slate-500 pt-2 border-t">
              Threshold breaches will be sent to all active email addresses
              listed above.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden transition-all duration-300">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-xl text-slate-800">
            Dashboard Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Select
              value={historyMode}
              onValueChange={(val: HistoryMode) => setHistoryMode(val)}
            >
              <SelectTrigger className="w-full h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors">
                <SelectValue placeholder="Select view mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">
                  <div className="cursor-pointer">Instant</div>
                </SelectItem>
                <SelectItem value="daily">
                  <div className="cursor-pointer">Daily</div>
                </SelectItem>
                <SelectItem value="monthly">
                  <div className="cursor-pointer">Monthly</div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Set default view mode for the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end border-t pt-5">
        <Button
          className="h-11 px-8 rounded-full shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/25 transition-all w-full sm:w-auto text-base font-medium"
          type="submit"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>Save</>
          )}
        </Button>
      </div>
    </form>
  );
}
