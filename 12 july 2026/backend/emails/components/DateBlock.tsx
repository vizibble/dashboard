import { Section, Text } from "@react-email/components";

interface DateTimeBlockProps {
    node: any;
}

export function DateTimeBlock({
    node,
}: DateTimeBlockProps) {

    const now = new Date();

    return (
        <Section
            style={{
                backgroundColor: node.props.style.backgroundColor,
                color: node.props.style.color,
                padding: node.props.style.padding,
            }}
        >
            {node.props.date && (
                <Text
                    style={{
                        margin: 0,
                        fontSize: `${node.props.style.fontSize}px`,
                        fontWeight: node.props.style.fontWeight,
                        fontStyle: node.props.style.fontStyle,
                    }}
                >
                    {now.toLocaleDateString()}
                </Text>
            )}

            {node.props.time && (
                <Text
                    style={{
                        margin: 0,
                        fontSize: `${node.props.style.fontSize}px`,
                        fontWeight: node.props.style.fontWeight,
                        fontStyle: node.props.style.fontStyle,
                    }}
                >
                    {now.toLocaleTimeString()}
                </Text>
            )}
        </Section>
    );
}