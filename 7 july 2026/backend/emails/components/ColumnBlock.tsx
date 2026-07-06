import { Column } from "@react-email/components";
import { renderNode } from "../renderNode.tsx";

interface Props {
    node: any;
}

export function ColumnBlock({ node }: Props) {

    return (

<Column>

    {node.children.length > 0
        ? node.children.map((child: any) =>
              renderNode(child)
          )
        : <span>&nbsp;</span>}

</Column>

    );

}