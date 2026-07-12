export function isEmptyChartOption(option: any): boolean {
    return (
        !option ||
        Object.keys(option).length === 0
    );
}