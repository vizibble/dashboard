import { Section } from "@react-email/components";
import { renderNode } from "../renderNode.tsx";

interface Props {
    node: any;
}

export function SectionBlock({ node }: Props) {

    return (

        <Section>

            {node.children.map((child: any) => (
                        <div key={child.id}>
                            {renderNode(child)}
                        </div>
            ))}

        </Section>

    );

}