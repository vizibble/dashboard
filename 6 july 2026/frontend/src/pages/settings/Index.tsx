import { SettingsForm } from '@/pages/settings/components/settings-form';

export function SettingsPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div className="space-y-1 mt-6 md:mt-0">
        <h1 className="sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your preferences.</p>
      </div>
      <SettingsForm />
    </div>
  );
}
