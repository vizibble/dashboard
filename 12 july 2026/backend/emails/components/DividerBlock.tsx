import { Hr } from "@react-email/components";

interface DividerBlockProps {
    node: any;
}

export function DividerBlock({
    node,
}: DividerBlockProps) {

    return (
        <Hr
            style={{
                border: "none",

                backgroundColor: node.props.style.color,

                height: node.props.style.height,

                width: node.props.style.width,

                marginTop: node.props.style.marginTop,

                marginBottom: node.props.style.marginBottom,
            }}
        />
    );
}