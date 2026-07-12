export interface TimelineSummary {
    runningMinutes: number;
    stoppedMinutes: number;
    powerLossMinutes: number;

    availability: number;

    reasons: {
        label: string;
        minutes: number;
    }[];
}

export function buildTimelineSummary(
    segments: any[]
): TimelineSummary {
let runningMinutes = 0;
let stoppedMinutes = 0;
let powerLossMinutes = 0;

segments.forEach(segment => {

    const minutes =
        (new Date(segment.end).getTime() -
            new Date(segment.start).getTime()) /
        (1000 * 60);

    if (segment.state === "running") {
        runningMinutes += minutes;
    }

    if (segment.state === "stopped") {
        stoppedMinutes += minutes;
    }

    if (segment.state === "power_loss") {
        powerLossMinutes += minutes;
    }
});

return {
    runningMinutes,
    stoppedMinutes,
    powerLossMinutes,

    availability: 0,

    reasons: [],
};
}