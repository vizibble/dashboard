import { Heading, Section } from "@react-email/components";

interface HeadingBlockProps {
    node: any;
}

export function HeadingBlock({
    node,
}: HeadingBlockProps) {

    return (
        <Section
            style={{
                backgroundColor: node.props.style.backgroundColor,
                padding: node.props.style.padding,
                marginTop: node.props.style.marginTop,
                marginBottom: node.props.style.marginBottom,
            }}
        >
            <Heading
                style={{
                    margin: 0,
                    color: node.props.style.color,
                    fontSize: `${node.props.style.fontSize}px`,
                    fontWeight: node.props.style.fontWeight,
                    fontStyle: node.props.style.fontStyle,
                }}
            >
                {node.props.text}
            </Heading>
        </Section>
    );
}