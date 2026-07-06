import type { LucideIcon } from "lucide-react";

interface SidebarButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    icon: LucideIcon;
    isFirst?:boolean
    isLast?:boolean
}

function SidebarButton({
    children,
    onClick,
    icon: Icon,
    isFirst,
    isLast,
}: SidebarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={isFirst || isLast}
            className="
                shadow-sm
                w-[90%]
                mx-auto
                flex
                items-center
                justify-center
                gap-2
                px-4
                py-3

                rounded-xl

                border-2
                border-slate-300

                bg-white

                text-slate-700
                font-semibold

                hover:bg-slate-50
                hover:border-slate-400
                hover:text-slate-900

                transition-all
                duration-150
            "
        >
            <Icon size={20} />

            <span>{children}</span>
        </button>
    );
}

export default SidebarButton;