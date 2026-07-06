export function collectAttachments(
    node: any,
    attachments: any[]
) {

    const containerTypes = [
        "section",
        "row",
        "column",
    ];

    if (containerTypes.includes(node.type)) {

        for (const child of node.children) {
            collectAttachments(child, attachments);
        }

        return;
    }

    if (node.type === "chart") {

    attachments.push({

        filename: `${node.imageCid}.png`,

        content: node.imageBuffer,

        cid: node.imageCid,

    });

}

}