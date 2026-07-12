import { Resizable } from "re-resizable";
import { useState } from "react";

interface ResizableBlockProps {
    selected:boolean;
    children: React.ReactNode;
    width: number;
    height: number;
    onResize: (size:{width: number, height: number}) => void;
}

function ResizableBlock({children,width,height,onResize, selected}: ResizableBlockProps) {
    const [isResizing, setIsResizing] = useState(false);
    return (
        <Resizable className="transition-shadow duration-150"
            size={{
                width,
                height,
            }}
            enable={{bottomRight:true}}
            onResizeStart={(e)=>{setIsResizing(true)}}
            onResizeStop={(e, direction, elementRef) => {
                setIsResizing(false);
                onResize({width:elementRef.offsetWidth, height:elementRef.offsetHeight});
            }}
             style={{
                boxShadow:
                selected
                    ? "0 0 0 2px #2563eb"
                    : undefined,
                opacity: isResizing ? 0.7 : 1,
            }}
        >
            {children}
        </Resizable>
    );
}

export default ResizableBlock;