import type { InputHTMLAttributes, ReactNode } from "react";

interface CheckboxInputProps
    extends InputHTMLAttributes<HTMLInputElement> {
    label: ReactNode;
}

function CheckboxInput({
    label,
    className = "",
    ...props
}: CheckboxInputProps) {
    return (
        <label
            className={`
                flex
                items-center
                gap-3
                cursor-pointer
                select-none
                text-sm
                font-medium
                text-slate-700
                ${className}
            `}
        >
            <input
                type="checkbox"
                {...props}
                className="
                    h-4
                    w-4
                    rounded
                    border-slate-300
                    text-blue-600
                    focus:ring-2
                    focus:ring-blue-500/20
                "
            />

            <span>{label}</span>
        </label>
    );
}

export default CheckboxInput;