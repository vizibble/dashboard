import type { ChartBlock } from "../../types/blocks";

interface ChartInfoProps {
    block: ChartBlock
}

function ChartInfo ({block}:ChartInfoProps){
            return (<div>
                <h3>📊{block.props.config.deviceName}</h3> 
                <div>
                    timeBucket:{block.props.config.timeBucket}
                </div> 
                <div>
                    Aggregation:{block.props.config.aggregation}
                </div> 
                <div>
                    rangeMode:{block.props.config.rangeMode}
                </div>              
                <div>
                    range:{block.props.config.range}
                </div>                         
                <div>
                    Metric Model:{block.props.config.metric}
                </div>
                <div>
                    SecondaryMetric Model:{block.props.config.secondaryMetric}
                </div>                  
                <div>
                    device:{block.props.config.deviceId}
                </div> 
            </div>);
}

export default ChartInfo;

