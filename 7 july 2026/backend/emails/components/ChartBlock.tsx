import { Img, Section } from "@react-email/components";

interface ChartBlockProps {
    node: any;
}

export function ChartBlock({ node }: ChartBlockProps) {

    return (
        <Section
            style={{
                padding: node.props.style.padding,
            }}
        >
            <Img
                src={`cid:${node.imageCid}`}
                alt="Chart"
                width="100%"
            />
        </Section>
    );
}