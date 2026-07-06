interface PropertyFieldProps {
    label: string;
    children: React.ReactNode;
}

function PropertyField({
    label,
    children,
}: PropertyFieldProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
                {label}
            </label>

            {children}
        </div>
    );
}

export default PropertyField;