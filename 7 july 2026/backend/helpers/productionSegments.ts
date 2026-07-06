export function groupProductionSegments(readings: Reading[]) {
        if (readings.length === 0) {
            return [];
        }

    const segments = [];
    let currentSegment = {
        type: readings[0].type,
        start: readings[0].timestamp,
        end: readings[0].timestamp,
        sum: readings[0].count,
        count: 1,
        min: readings[0].count,
        max: readings[0].count,
    };

    readings.slice(1).forEach((reading)=>{
        if(reading.type === currentSegment.type){
            currentSegment.end = reading.timestamp;
            currentSegment.sum += reading.count;
            currentSegment.count++;

            currentSegment.min = Math.min(currentSegment.min, reading.count);
            currentSegment.max = Math.max(currentSegment.max, reading.count);
        }else{
            segments.push(currentSegment);
            currentSegment = {
                type: reading.type,
                start: reading.timestamp,
                end: reading.timestamp,
                sum: reading.count,
                count: 1,
                min: reading.count,
                max: reading.count,
            };
        }
    });
    segments.push(currentSegment);

    return segments;
}

function getBucketLabel(
    date: Date,
    timeBucket: string
) {
    switch (timeBucket) {

        case "hour":
            return `${String(date.getHours()).padStart(2, "0")}:00`;

        case "day":
            return date.toISOString().split("T")[0];

        case "week": {
            const firstDay = new Date(date.getFullYear(), 0, 1);

            const days =
                Math.floor(
                    (date.getTime() - firstDay.getTime())
                    / 86400000
                );

            const week =
                Math.ceil((days + firstDay.getDay() + 1) / 7);

            return `${date.getFullYear()}-W${week}`;
        }

        case "month":
            return date.toLocaleString("default", {
                month: "short",
                year: "numeric",
            });

        case "quarter": {
            const quarter =
                Math.floor(date.getMonth() / 3) + 1;

            return `Q${quarter} ${date.getFullYear()}`;
        }

        case "year":
            return `${date.getFullYear()}`;

        default:
            return `${String(date.getHours()).padStart(2, "0")}:00`;
    }
}

export function groupSegmentsByBucket(segments: any[], timeBucket:string) {
    if(segments.length == 0){
        return [];
    }

    const buckets = [];
    let currentBucket = {
        label: getBucketLabel(
            new Date(segments[0].start),
            timeBucket
        ),
        segments: [segments[0]],
    };

    segments.slice(1).forEach((segment)=>{
        const label = getBucketLabel(
            new Date(segment.start),
            timeBucket
        );

        if (label === currentBucket.label){
            currentBucket.segments.push(segment);
        }
        else{
            buckets.push(currentBucket);
            currentBucket = {
                label,
                segments: [segment],
            };
        }
    });
    buckets.push(currentBucket);

    return buckets;

}

export function buildStackedChartData(
    hours: any[],
    aggregation: "sum" | "avg" | "min" | "max"
) {
    if(hours.length == 0){return {
        data: [],
        stacks: [],
    };}

    const data = []
    const stacks = []

    let segmentID = 0;
    hours.forEach((hour)=>{
        const row: any = {
            hour: hour.hour,
        };    
    
        hour.segments.forEach((segment)=>{
            let value = 0;
            switch (aggregation) {
                case "sum":
                    value = segment.sum;
                    break;

                case "avg":
                    value = segment.sum / segment.count;
                    break;

                case "min":
                    value = segment.min;
                    break;

                case "max":
                    value = segment.max;
                    break;
            }
            row[`segment${segmentID}`] = value;
            const key = `segment${segmentID}`;
            if (!stacks.find(s => s.key === key)) {
                stacks.push({
                    key,
                    type: segment.type,
                });
            }
            segmentID++;
        })

        data.push(row);
    })

    return {data, stacks};
}