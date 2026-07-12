import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";

import { renderNode } from "./renderNode.tsx";

interface ReportEmailProps {
    template: any;
}

export function ReportEmail({
    template,
}: ReportEmailProps) {

    return (<Container style={{fontFamily:"sans-serif"}}>
            {template.blocks.map((block: any) => (
                <div key={block.id}>
                    {renderNode(block)}
                </div>
            ))}
        </Container>
    );
}

export default ReportEmail;