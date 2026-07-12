export interface TimelineSegment {
    start: Date;
    end: Date;

    state: "running" | "stopped" | "power_loss";

    reason: string | null;

    label: string;
}

export function groupTimelineSegments(readings: any[]) {
    if (readings.length === 0) {
        return [];
    }

    const getState = (reading: any) => {
        if (reading.count > 0) {
            return "running";
        }

        return "stopped";
    };

    let currentSegment: TimelineSegment = {
        start: readings[0].timestamp,
        end: readings[0].timestamp,
        state: getState(readings[0]),
        reason: readings[0].reason ?? null,
        label:getState(readings[0]) === "running"
            ? "Running"
            : readings[0].reason ?? "Stopped"
    };

    const segments: TimelineSegment[] = [];

    readings.slice(1).forEach((reading, index) => {
        const previousReading = readings[index];
        const state = getState(reading);

        const gapMinutes =
            (new Date(reading.timestamp).getTime() -
                new Date(previousReading.timestamp).getTime()) /
            (1000 * 60);

            if (gapMinutes > 1) {
                // Finish the current segment
                currentSegment.end = new Date(new Date(previousReading.timestamp).getTime() + 60 * 1000);
                segments.push(currentSegment);

                // Create a power loss segment
                segments.push({
                    start: new Date(
                        new Date(previousReading.timestamp).getTime() + 60 * 1000
                    ),
                    end: new Date(
                        new Date(reading.timestamp).getTime()
                    ),
                    state: "power_loss",
                    reason: null,
                    label: "Power Loss",
                });

                // Start a new segment from the current reading
                currentSegment = {
                    start: reading.timestamp,
                    end: reading.timestamp,
                    state,
                    reason: reading.reason ?? null,
                    label:
                        state === "running"
                            ? "Running"
                            : reading.reason ?? "Stopped",
                };

                return;
            }    

        if (
            state === currentSegment.state &&
            reading.reason === currentSegment.reason
        ) {
            currentSegment.end = reading.timestamp;
        } else {
            currentSegment.end = new Date(new Date(previousReading.timestamp).getTime() + 60 * 1000);
            segments.push(currentSegment);

            currentSegment = {
                start: reading.timestamp,
                end: reading.timestamp,
                state,
                reason: reading.reason ?? null,
                label:state === "running"
                    ? "Running"
                    : reading.reason ?? "Stopped",                
            };
        }
    });    
    segments.push(currentSegment);

    return segments;
}