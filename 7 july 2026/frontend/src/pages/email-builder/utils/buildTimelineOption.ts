export function buildTimelineOption(timelineData: any[]) {
    if (
        !Array.isArray(timelineData) ||
        timelineData.length === 0
    ) {
        return {};
    }


const data = timelineData
    .filter(segment =>
        segment &&
        segment.start &&
        segment.end &&
        segment.state &&
        segment.label
    )
    .map(segment => [
        new Date(segment.start).getTime(),
        new Date(segment.end).getTime(),
        0,
        segment.state,
        segment.label,
        segment,
    ]);

if (data.length === 0) {
    return {};
}

    return {
        title: {
            text: "Timeline",
        },

        legend: {
    top: 5,
    right: 10,

    data: [
        "Running",
        "Stopped",
        "Power Loss",
    ],
},

tooltip: {
    trigger: "item",

    formatter: (params: any) => {
        const segment = params.value[5];

        const start = new Date(segment.start);
        const end = new Date(segment.end);

const durationMinutes =
    Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60)
    );

        const formatTime = (date: Date) =>
            date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });

        return `
            <b>${segment.label}</b><br/>
            <br/>
            <b>Start:</b> ${formatTime(start)}<br/>
            <b>End:</b> ${formatTime(end)}<br/>
            <b>Duration:</b> ${durationMinutes} min
        `;
    },
},

graphic: [
    {
        type: "group",

        left: "center",
        bottom: 10,

        children: [
            // Running
            {
                type: "rect",
                shape: {
                    x: 0,
                    y: 0,
                    width: 14,
                    height: 14,
                },
                style: {
                    fill: "#00AF68",
                },
            },
            {
                type: "text",
                style: {
                    x: 20,
                    y: 7,
                    text: "Running",
                    textVerticalAlign: "middle",
                    fill: "#333",
                    fontSize: 12,
                },
            },

            // Stopped
            {
                type: "rect",
                shape: {
                    x: 110,
                    y: 0,
                    width: 14,
                    height: 14,
                },
                style: {
                    fill: "#F4B400",
                },
            },
            {
                type: "text",
                style: {
                    x: 130,
                    y: 7,
                    text: "Stopped",
                    textVerticalAlign: "middle",
                    fill: "#333",
                    fontSize: 12,
                },
            },

            // Power Loss
            {
                type: "rect",
                shape: {
                    x: 225,
                    y: 0,
                    width: 14,
                    height: 14,
                },
                style: {
                    fill: "#EA4335",
                },
            },
            {
                type: "text",
                style: {
                    x: 245,
                    y: 7,
                    text: "Power Loss",
                    textVerticalAlign: "middle",
                    fill: "#333",
                    fontSize: 12,
                },
            },
        ],
    },
],

        xAxis: {
            type: "time",
            min: data[0]?.[0],
            max: data[data.length - 1]?.[1],
        },

        yAxis: {
            type: "category",
            data: ["Timeline"],
        },

        series: [
            {
                type: "custom",

                coordinateSystem: "cartesian2d",

                data,

                renderItem: (params: any, api: any) => {
                    const start = api.coord([api.value(0), api.value(2)]);
                    const end = api.coord([api.value(1), api.value(2)]);

                    const height = api.size([0, 1])[1] * 0.8;
                    const width = Math.max(1, Math.round(end[0] - start[0]) + 1);

                    const state = api.value(3);

                    let color = "#00AF68";

                    if (state === "stopped") {
                        color = "#F4B400";
                    }

                    if (state === "power_loss") {
                        color = "#EA4335";
                    }

                    return {
                        type: "rect",

                        shape: {
                            x: start[0],
                            y: start[1] - height / 2,
                            width,
                            height,
                        },

                        style: {
                            fill: color,
                        },

                        textContent:
                            (state !== "running" && state !== "power_loss") && height > 20
                                ? {
                                    type: "text",

                                    rotation: -Math.PI / 2,

                                    style: {
                                        text: api.value(4),

                                        fill: "#ffffff",

                                        fontSize: 11,
                                        fontWeight: "bold",

                                        textAlign: "center",
                                        textVerticalAlign: "middle",
                                    },
                                }
                                : undefined,

                        textConfig: {
                            position: "inside",
                        },
                    };
                },

                encode: {
                    x: [0, 1],
                    y: 2,
                },
            },
        ],
    };
}