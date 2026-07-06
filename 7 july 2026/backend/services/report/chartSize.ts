export function resolveChartSize(style: any) {

    const width =
        style.width === "100%"
            ? 800
            : parseInt(style.width);

    const height =
        style.height
            ? parseInt(style.height)
            : 400;

    return {
        width,
        height,
    };
}