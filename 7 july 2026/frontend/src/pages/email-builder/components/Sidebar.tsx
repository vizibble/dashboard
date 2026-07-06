import type { ChartType } from "../types/chart";
import SidebarButton from "./properties/SideBarButtons";

import {Type,FileText,Image,Minus,Columns2,Layout,ChartLine,ChartColumn,Gauge,MoveVertical,ChartArea, ChartBarStacked, Calendar1, Timeline} from "lucide-react";

interface SidebarProps {
  addHeading: () => void;

  addText: () => void;

  addButton: () => void;

  addSection: () => void;

  addImage: () => void;

  addSpacer: () => void;

  addDivider: () => void;

  addColumn: (count: number) => void;

  addChart: (type: ChartType) => void;

  addMetric: () => void;

  addDate: () => void;



}

function Sidebar({addDate ,addHeading, addText , addSection, addImage, addSpacer, addDivider, addColumn, addChart, addMetric}: SidebarProps) {
  return (
    <aside className="sidebar w-72 bg-white border-r border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[4px]">
      <h2 className="text-xl font-semibold mb-6">Blocks</h2>

    <div className="mb-6 flex flex-col items-center gap-[4px] w-full">
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">
            Content
        </h3>

        <SidebarButton onClick={addHeading} icon={Type}>Heading</SidebarButton>
        <SidebarButton onClick={addText} icon={FileText}>Text</SidebarButton>
        <SidebarButton onClick={addImage} icon={Image}>Image</SidebarButton>
        <SidebarButton onClick={addDivider} icon={Minus}>Divider</SidebarButton>
        <SidebarButton onClick={addSpacer} icon={MoveVertical}>Spacer</SidebarButton>
        <SidebarButton onClick={addDate} icon = {Calendar1}>Date & Time</SidebarButton>
    </div>

    <div className="mb-6 flex flex-col items-center gap-[4px] w-full">
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">
            Layout
        </h3>

        <SidebarButton onClick={addSection} icon={Layout}>Section</SidebarButton>
        <SidebarButton onClick={() => addColumn(2)} icon={Columns2}>Column</SidebarButton>
    </div>

    <div className="mb-6 flex flex-col items-center gap-[4px] w-full">
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">
            Data
        </h3>

        <SidebarButton onClick={() => addChart("line")} icon={ChartLine}>Line Chart</SidebarButton>
        <SidebarButton onClick={() => addChart("area")} icon={ChartArea}>Area Chart</SidebarButton>
        <SidebarButton onClick={() => addChart("bar")} icon={ChartColumn}>Bar Chart</SidebarButton>
        <SidebarButton onClick={() => addChart("productionChart")} icon={ChartBarStacked}>Stacked Bar</SidebarButton>
        <SidebarButton onClick={() => addChart("timeline")} icon={Timeline}>timeline</SidebarButton>
        <SidebarButton onClick={addMetric} icon={Gauge}>KPI</SidebarButton>
        
    </div>


    </aside>
  );
}

export default Sidebar;