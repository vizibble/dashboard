import type { Block, ButtonBlock, DateBlock, DividerBlock, HeadingBlock, ImageBlock,  SectionBlock, SpacerBlock, TextBlock } from "../types/blocks";

const style = {
        width: "100%",
        padding: 0,
        backgroundColor: "#ffffff",
        color: "#000000",
        fontSize: 16,
        fontWeight: "normal",
        fontStyle: "normal", 
        marginBottom:0, 
        marginTop:0}

export  const generateId = () => {
    return Date.now() + Math.random();
  };

export function createNode<
    TType extends string,
    TProps
>(
    type: TType,
    props: TProps
) {
    return {
        id: generateId(),
        type,
        props,
    };
}
  

export  const createSection = (child:Block|undefined):SectionBlock => ({
    id: generateId(),
    type: "section",
    props: {style:{...style, height:"100%"}},
    children: child?[child]:[]
  });

export const createHeading = ():HeadingBlock =>createNode("heading",{text: "Heading", style:{...style, fontSize:32, fontWeight:"bold", color:"#417DEC",}})

export const createText = ():TextBlock => createNode("text",{text: "Text", style});

export const createButton = ():ButtonBlock => createNode("button",{text: "click here", url:"", style:{...style, height: "20px"}});

export const createImage = ():ImageBlock => createNode("image",{alt: "place Holder image", src:"https://placehold.co/600x400", aspectRation:1, style:{...style, height:"auto"}});

export const createSpacer = ():SpacerBlock => createNode("spacer",{style:{...style, height: "40px"}});

export const createDivider = ():DividerBlock => createNode("divider",{style:{...style, height: "3px", color: "#9DA3A4",}});

export const createDate = ():DateBlock => createNode("date", {date:true, time:true, style:{...style, fontWeight:"bold", color:"gray", height:"fit-content"}})