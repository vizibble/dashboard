export function formatMetricName(metric: string) {
    if (!metric) return "";

    return metric.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}