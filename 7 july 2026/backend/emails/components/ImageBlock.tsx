import { Img, Section } from "@react-email/components";

interface ImageBlockProps {
    node: any;
}

export function ImageBlock({
    node,
}: ImageBlockProps) {

    return (
        <Section
            style={{
                padding: node.props.style.padding,
                marginTop: node.props.style.marginTop,
                marginBottom: node.props.style.marginBottom,
                width: node.props.style.width,
            }}
        >
            <Img
                src={node.props.src}
                alt={node.props.alt ?? "Image"}
                style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                }}
            />
        </Section>
    );
}