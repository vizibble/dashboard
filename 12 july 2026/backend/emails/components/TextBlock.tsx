import { Section, Text } from "@react-email/components";

interface TextBlockProps {
    node: any;
}

export function TextBlock({
    node,
}: TextBlockProps) {

    return (
        <Section
            style={{
                width: node.props.style.width,
                backgroundColor: node.props.style.backgroundColor,
                padding: node.props.style.padding,
                marginTop: node.props.style.marginTop,
                marginBottom: node.props.style.marginBottom,
            }}
        >
            <Text
                style={{
                    margin: 0,
                    color: node.props.style.color,
                    fontSize: `${node.props.style.fontSize}px`,
                    fontWeight: node.props.style.fontWeight,
                    fontStyle: node.props.style.fontStyle,
                }}
            >
                {node.props.text}
            </Text>
        </Section>
    );
}