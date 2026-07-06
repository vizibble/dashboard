import type { LucideIcon } from "lucide-react";

interface ToolButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    icon: LucideIcon;
    isFirst?:boolean
    isLast?:boolean
}

function ToolButton({
    children,
    onClick,
    icon: Icon,
    isFirst,
    isLast,
}: ToolButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={isFirst || isLast}
            className="
                w-[90%]
                mx-auto
                flex
                items-center
                justify-center
                gap-2
                px-2
                py-2

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
                shadow-lg
            "
        >
            <Icon size={20} />

            <span>{children}</span>
        </button>
    );
}

export default ToolButton;