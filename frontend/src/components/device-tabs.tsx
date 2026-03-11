import { useFetchDevices } from "@/hooks/fetch-devices";

export interface DeviceTabsProps {
    selectedDevice: string | null;
    onSelectDevice: (deviceId: string, type?: string) => void;
}

export const DeviceTabs = ({ selectedDevice, onSelectDevice }: DeviceTabsProps) => {
    const { devices, loading: isLoading } = useFetchDevices();

    // Loading
    if (isLoading) {
        return (
            <div className="flex items-center gap-3 px-1">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-9 w-32 rounded-lg bg-slate-200 animate-pulse"
                        style={{ opacity: 1 - i * 0.2 }}
                    />
                ))}
            </div>
        );
    }

    // Tab strip
    return (
        <div
            className="flex items-center gap-2 overflow-x-auto pb-1 px-1 -mx-1"
            style={{ scrollbarWidth: "none" }}
            role="tablist"
            aria-label="Device selection"
        >
            {devices?.map((d) => {
                const isActive = d.device_id === selectedDevice;
                const label = d.name || d.location;

                return (
                    <button
                        key={d.device_id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onSelectDevice(d.device_id, d.type)}
                        className={`
              relative flex items-center gap-2 px-4 py-2 cursor-pointer rounded-lg text-sm font-medium
              whitespace-nowrap shrink-0 transition-all duration-150 select-none group
              ${isActive
                                ? "bg-blue-500 text-white shadow-sm shadow-blue-200"
                                : "bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                            }
            `}
                    >
                        {/* Live dot */}
                        <span
                            className={`size-1.5 rounded-full shrink-0 transition-colors ${isActive ? "bg-green-500" : "bg-slate-300 group-hover:bg-slate-400"}`}
                        />

                        {/* Device name */}
                        <span className="max-w-[120px] truncate">{label}</span>
                        {/* Location badge */}
                        <span
                            className={`
                text-xs font-mono px-1.5 py-0.5 rounded-md shrink-0
                ${isActive
                                    ? "bg-white/20 text-white/80"
                                    : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                }
              `}
                        >
                            {d.location}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};