interface PropertySectionProps {
    title: string;
    children: React.ReactNode;
}

function PropertySection({
    title,
    children,
}: PropertySectionProps) {
    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                {title}
            </h3>

            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4">
                {children}
            </div>
        </div>
    );
}

export default PropertySection;