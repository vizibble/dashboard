import { Section, Text } from "@react-email/components";

interface MetricBlockProps {
    node: any;
}

export function MetricBlock({ node }: MetricBlockProps) {

    let title = node.props.config.metric;

    if (node.props.config.dataType === "production") {

        const labels: Record<string, string> = {
            sum: "Total Production",
            avg: "Average Production",
            min: "Minimum Production",
            max: "Maximum Production",
        };

        title = labels[node.props.config.aggregation];
    }

    return (
        <Section
            style={{
                backgroundColor: node.props.style.backgroundColor,
                color: node.props.style.color,
                padding: node.props.style.padding,
                textAlign: "center",
            }}
        >
            <Text
                style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "500",
                }}
            >
                {title || "No Metric Selected"}
            </Text>

            <Text
                style={{
                    margin: "12px 0",
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#00AF68",
                }}
            >
                {node.data != null
                    ? Number(node.data.value).toFixed(4)
                    : "--"}
            </Text>

            <Text
                style={{
                    margin: 0,
                    color: "#666",
                    fontSize: "16px",
                    fontWeight:"500",
                }}
            >
                {node.props.config.aggregation}
            </Text>
        </Section>
    );
}