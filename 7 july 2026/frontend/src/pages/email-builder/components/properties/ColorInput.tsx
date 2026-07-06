import type { InputHTMLAttributes } from "react";

interface ColorInputProps
    extends InputHTMLAttributes<HTMLInputElement> {}

function ColorInput({
    className = "",
    value,
    ...props
}: ColorInputProps) {
    return (
        <div
            className={`
                flex
                items-center
                gap-3
                rounded-md
                border
                border-slate-300
                bg-white
                px-3
                py-2
                shadow-sm
                ${className}
            `}
        >
            <input
                type="color"
                value={value}
                {...props}
                className="
                    h-8
                    w-8
                    cursor-pointer
                    border-0
                    bg-transparent
                    p-0
                "
            />

            <span className="text-sm text-slate-700 font-mono">
                {value}
            </span>
        </div>
    );
}

export default ColorInput;