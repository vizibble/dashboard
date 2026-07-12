export function formatXAxisLabel(
    date: Date,
    range: string,
    aggregation: string,
    timeBucket: string
) {

    if (aggregation === "none") {
        switch (range) {

            case "last_1_hour":
            case "last_3_hours":
            case "last_6_hours":
            case "last_12_hours":
            case "last_24_hours":
                return formatTime(date)

            case "last_7_days":
            case "last_15_days":
            case "last_30_days":
                return formatDay(date)

            case "last_90_days":
            case "last_180_days":
                return formatMonth(date)

            case "last_365_days":
                return formatYear(date)
        }
    }

    switch (timeBucket) {
        case "second":
            return formatTimeWithSeconds(date)
        case "minute":
        case "hour":
            return formatTime(date)
        case "day":
        case "week":
            return formatDay(date)
        case "month":
            return formatMonth(date)
        case "quarter":
            return formatQuarter(date)
        case "year":
            return formatYear(date)
        default:
            return date.toLocaleString();
    }

}

const formatTimeWithSeconds = (date: Date) =>
    date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

const formatDay = (date: Date) =>
    date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
    });

const formatMonth = (date: Date) =>
    date.toLocaleDateString([], {
        month: "short",
        year: "2-digit",
    });

const formatQuarter = (date: Date) =>
    `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;

const formatYear = (date: Date) =>
    date.getFullYear().toString();