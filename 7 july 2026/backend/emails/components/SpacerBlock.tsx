import { Section } from "@react-email/components";

interface SpacerBlockProps {
    node: any;
}

export function SpacerBlock({
    node,
}: SpacerBlockProps) {

    return (
        <Section
            style={{
                height: node.props.style.height,
                backgroundColor: node.props.style.backgroundColor,
            }}
        />
    );
}