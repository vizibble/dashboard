interface NumberInputProps
    extends InputHTMLAttributes<HTMLInputElement> {}

function NumberInput({
    className = "",
    ...props
}: NumberInputProps) {
    return (
        <input
            
            {...props}
            className={`
                w-full
                rounded-md
                border
                border-slate-300
                bg-white
                px-3
                py-2
                text-sm
                text-slate-700
                shadow-sm
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-500/20
                ${className}
            `}
        />
    );
}

export default NumberInput;