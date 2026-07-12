import NumberInput from "../NumberInput";
import PropertySection from "../propertiesSection";
import PropertyField from "../PropertyField";
import SelectInput from "../SelectInput";

interface DataSectionProps {
    selectedBlock: any;
    devices: any[];
    availableMetrics: string[];

    updateConfig: (
        id: number,
        key: string,
        value: string|number|null|boolean
    ) => void;

    updateDevice: (
        chartId: number,
        deviceId: string,
        deviceName: string
    ) => void;

    showSecondaryMetric?: boolean;

    showThreshold?: boolean;

    showMetric?:boolean

    isTimeline?:boolean

    availableProductTypes?:string[];
}

function DataSection({availableProductTypes,selectedBlock, updateConfig, isTimeline = false,updateDevice, showMetric = true,devices, availableMetrics, showSecondaryMetric, showThreshold=false}:DataSectionProps){
return(
        <PropertySection title ="Data">
        <div>
            <PropertyField label="Device">
            <SelectInput value={selectedBlock.props.config.deviceId}
                onChange={(e) =>{const device = devices.find(d=>d.device_id === e.target.value);
                    updateDevice(selectedBlock.id, device.device_id, device.name);
                }}
                >
                {devices.map((device) => (
                    <option key={device.device_id} value={device.device_id}>
                        {device.name}
                    </option>
                ))}
            </SelectInput>                
            </PropertyField>

        </div>

        {showMetric && <div>
            <PropertyField label="Metric">
            <SelectInput value={selectedBlock.props.config.metric}
                onChange={(e) =>
                updateConfig(
                    selectedBlock.id,
                    "metric",
                    e.target.value
                )
                }
            >
            {
                availableMetrics?.map((metric: string) => (
                <option
                    key={metric}
                    value={metric}
                >
                    {metric}
                </option>
                ))
            }
            </SelectInput>                
            </PropertyField>

        </div>} 

        {(showSecondaryMetric && showMetric) && (<div>
            <PropertyField label="Secondary Metric">
            <SelectInput value={selectedBlock.props.config.secondaryMetric}
                onChange={(e) =>
                    updateConfig(
                    selectedBlock.id,
                    "secondaryMetric",
                    e.target.value )}>
                <option key={"none"} value="none">
                    None
                </option>
                {availableMetrics?.map((metric:string) => (
                    <option
                        key={metric}
                        value={metric}
                    >
                        {metric}
                    </option>
                    ))}
            </SelectInput>                
            </PropertyField>

        </div>)}

        {(!showMetric && !isTimeline) && <PropertyField label="Product">
                <SelectInput
                    value={selectedBlock.props.config.productType}
                    onChange={(e) =>
                        updateConfig(
                            selectedBlock.id,
                            "productType",
                            e.target.value
                        )
                    }
                >
                    <option value="all">All Products</option>

                    {availableProductTypes.map((product) => (
                        <option
                            key={product}
                            value={product}
                        >
                            {product}
                        </option>
                    ))}
                </SelectInput>
            </PropertyField>}

        {showThreshold && <div>
        <div>
            <PropertyField label="Minimum Threshold">
            <NumberInput
                
                value={selectedBlock.props.config.minThreshold ?? ""}
                onChange={(e) =>
                    updateConfig(
                        selectedBlock.id,
                        "minThreshold",
                        e.target.value === ""
                            ? null
                            : Number(e.target.value)
                    )
                }
            />                
            </PropertyField>

        </div>

        <div>
            <PropertyField label="Maximum Threshold">
            <NumberInput
                
                value={selectedBlock.props.config.maxThreshold ?? ""}
                onChange={(e) =>
                    updateConfig(
                        selectedBlock.id,
                        "maxThreshold",
                        e.target.value === ""
                            ? null
                            : Number(e.target.value)
                    )
                }
            />                
            </PropertyField>

        </div>
        </div>}
        </PropertySection>
)
}

export default DataSection;