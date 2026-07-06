interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    
}

function TextInput(props: TextInputProps) {
    return (
        <input
            {...props}
            className="
                w-full
                rounded-md
                border
                border-slate-300
                px-3
                py-2
                text-sm
                shadow-sm
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                focus:border-blue-500
            "
        />
    );
}

export default TextInput;