


import { useEffect, useState } from "react";
import BlockActions from "./BlockActions";
import DataSection from "./chart/DataSection";
import FilterSection from "./chart/FilterSection";
import TimeSection from "./chart/TimeSection";
import { getDeviceMetrics, getDeviceProductTypes, getDevices } from "../../services/api";
import AppearanceSection from "./AppearenceSection";
import PropertySection from "./propertiesSection";
import SelectInput from "./SelectInput";

interface MetricPropertiesProps {
    selectedBlock: any;
    updateConfig: (
        id: number,
        key: string,
        value: string | boolean | number | null
    ) => void;

    updateNodeStyle: (
        id: number,
        text: string,
        value: string | number
    ) => void;

    updateDevice: (
        metricId: number,
        deviceId: string,
        deviceName: string
    ) => void;

    deleteNode: (nodeId: number) => void;

    moveNode: (
        parentContainerId: number,
        fromIndex: number,
        toIndex: number
    ) => void;

    parentId: number;
    index: number;
    isFirst: boolean;
    isLast: boolean;
}

function MetricProperties({
    selectedBlock,
    updateNodeStyle,
    updateConfig,
    updateDevice,
    moveNode,
    deleteNode,
    parentId,
    index,
    isFirst,
    isLast,
}: MetricPropertiesProps) {

    const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
    const [devices, setDevices] = useState<any[]>([]);

    const isProduction =
        selectedBlock.props.config.dataType === "production";

    const [availableProductTypes, setAvailableProductTypes] = useState<string[]>([]);    

    useEffect(() => {
        getDevices().then(setDevices);
    }, []);

    useEffect(() => {
        const deviceId = selectedBlock?.props?.config?.deviceId;

        if (!deviceId) {
            return;
        }

        if (isProduction) {
            getDeviceProductTypes(deviceId)
                .then(setAvailableProductTypes);
        } else {
            getDeviceMetrics(deviceId)
                .then(setAvailableMetrics);
        }
    }, [
        selectedBlock?.props?.config?.deviceId,
        isProduction,
    ]);



    useEffect(() => {
        if (
            isProduction ||
            availableMetrics.length === 0
        ) {
            return;
        }

        if (
            !availableMetrics.includes(
                selectedBlock.props.config.metric
            )
        ) {
            updateConfig(
                selectedBlock.id,
                "metric",
                availableMetrics[0]
            );
        }
    }, [
        availableMetrics,
        selectedBlock.id,
        selectedBlock.props.config.metric,
        isProduction,
    ]);   

    return (
        <aside className="properties w-80 bg-white border-l border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-[5px]">

            <PropertySection title="KPI Properties">

                <BlockActions
                    selectedBlock={selectedBlock}
                    moveNode={moveNode}
                    deleteNode={deleteNode}
                    parentId={parentId}
                    index={index}
                    isFirst={isFirst}
                    isLast={isLast}
                />
            <div className="flex flex-col gap-1 mb-3">
                <label className="text-sm font-medium text-slate-700">
                    Data Type
                </label>

                <SelectInput
                    value={selectedBlock.props.config.dataType}
                    onChange={(e) =>
                        updateConfig(
                            selectedBlock.id,
                            "dataType",
                            e.target.value
                        )
                    }
                    className="border rounded-md px-2 py-1 text-sm"
                >
                    <option value="telemetry">Telemetry</option>
                    <option value="production">Production</option>
                </SelectInput>
            </div>

                <DataSection
                    availableProductTypes={availableProductTypes}
                    selectedBlock={selectedBlock}
                    devices={devices}
                    availableMetrics={availableMetrics}
                    updateConfig={updateConfig}
                    updateDevice={updateDevice}
                    showSecondaryMetric={false}
                    showMetric={!isProduction}
                />

                <TimeSection
                    selectedBlock={selectedBlock}
                    updateConfig={updateConfig}
                    timeBuckedAvailable={false}
                    aggregationAvailable={true}
                />

                <FilterSection
                    selectedBlock={selectedBlock}
                    updateConfig={updateConfig}
                />

                <PropertySection title="Appearance">
                    <AppearanceSection
                        selectedBlock={selectedBlock}
                        updateNodeStyle={updateNodeStyle}
                        marginAvailable={true}
                    />
                </PropertySection>


            </PropertySection>

        </aside>
    );
}

export default MetricProperties;