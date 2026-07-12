import { Row } from "@react-email/components";
import { renderNode } from "../renderNode.tsx";

interface Props {
    node: any;
}

export function RowBlock({ node }: Props) {

    return (

<Row>

    {node.children.map((child: any) =>
        renderNode(child)
    )}

</Row>

    );

}