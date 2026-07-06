import type { ChartProps } from "./chart";

export interface BaseBlock {
  id: number;
  type: string;
}

export interface TextBlock extends BaseBlock {
  type: "text";

  props: {
    text: string;
    style:{}
  };
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";

  props: {
    text: string;
    style:{}
  };
}

export interface ButtonBlock extends BaseBlock {
  type: "button";

  props: {
    text: string;
    url: string;
    style:{}
  };
}

export interface ImageBlock extends BaseBlock {
    type: "image";

    props:{
        alt:string;
        src:string;
        style:{}
    };
}

export interface SpacerBlock extends BaseBlock {
    type:"spacer";

    props:{
        style:{}
    }
}

export interface DividerBlock extends BaseBlock {
    type:"divider";
    props:{
        style:{}
    }
}

export interface SectionBlock extends BaseBlock {
  type: "section";

  props: {};

  children: Block[];
}

export interface RowBlock extends BaseBlock {
  type: "row";

  props: {};

  children: Block[];
}

export interface ColumnBlock extends BaseBlock {
  type: "column";

  props: {
    width: string;
    style:{}
  };

  children: Block[];
}

export interface Chart extends BaseBlock {
  type: "chart";

  props: ChartProps;
}

export interface MetricBlock extends BaseBlock {
  type: "metric";

  props: {config:{
    deviceId: string;
    deviceName: string;
    metric: string;
    aggregation: string;
    range: string;
    rangeMode: string;
    dailyTimeFilterEnabled: boolean;
    dailyStartTime: string;
    dailyEndTime: string;
  }
  };
}

export interface DateBlock extends BaseBlock {
  type:"date";

  props:{};
}

export type Block =
  | SectionBlock
  | RowBlock
  | ColumnBlock
  | HeadingBlock
  | TextBlock
  | ButtonBlock
  | Chart
  | DateBlock
  | MetricBlock;