import { SectionBlock } from "./components/SectionBlock.tsx";
import { RowBlock } from "./components/RowBlock.tsx";
import { ColumnBlock } from "./components/ColumnBlock.tsx";
import { TextBlock } from "./components/TextBlock.tsx";
import {HeadingBlock} from "./components/HeadingBlock.tsx"
import { MetricBlock } from "./components/MetricBlock.tsx";
import { ChartBlock } from "./components/ChartBlock.tsx";
import { ImageBlock } from "./components/ImageBlock.tsx";
import { DateTimeBlock } from "./components/DateBlock.tsx";
import { SpacerBlock } from "./components/SpacerBlock.tsx";
import { DividerBlock } from "./components/DividerBlock.tsx";

export function renderNode(node: any) {

    switch (node.type) {

        case "section":
            return (<SectionBlock node={node} />);

        case "row":
            return <RowBlock node={node} />;

        case "column":
            return <ColumnBlock node={node} />;

        case "text":
            return <TextBlock node={node} />;
         
        case "heading":
            return <HeadingBlock node={node} />;    

        case "metric":
            return <MetricBlock node={node} />;

        case "chart":
            return <ChartBlock node={node} />;

        case "image":
            return <ImageBlock node={node} />;

        case "date":
            return <DateTimeBlock node={node} />
        
        case "spacer":
            return <SpacerBlock node={node} />
        
        case "divider":
            return <DividerBlock node={node} />
        
        default:
            return null;
    }

}