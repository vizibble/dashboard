export interface BaseNode {
  id: number;
  type: string;
  props: any;
}

export interface SectionNode
  extends BaseNode {

  type: "section";

  children: NodeType[];
}

export interface RowNode
  extends BaseNode {

  type: "row";

  children: ColumnNode[];
}

export interface ColumnNode
  extends BaseNode {

  type: "column";

  children: NodeType[];
}

export type NodeType =
  | SectionNode
  | RowNode
  | ColumnNode;
//   | TextNode
//   | HeadingNode
//   | ButtonNode
//   | ImageNode
//   | SpacerNode
//   | DividerNode;