import {updateConfigById, updateDeviceById, updateNodePropById, updateNodeStyleById, updateNodeStylesById } from "../utils/tree";

export function useEditor(
  blocks: any[],
  setBlocks: React.Dispatch<React.SetStateAction<any[]>>,    
){

  const updateNodeProp = (
    nodeId: number,
    propName: string,
    value: string|number
  ) => {
    setBlocks(updateNodePropById(blocks, nodeId, propName, value));
  };

  const updateConfig = (
    chartId: number,
    configName: string,
    value: string|boolean|number|null
  ) => {
    setBlocks(updateConfigById(blocks, chartId, configName, value));
  };

  const updateNodeStyle = (
    nodeId: number,
    styleName: string,
    value: string|number
  ) => {
    setBlocks(updateNodeStyleById(blocks, nodeId, styleName, value));
  };

  const updateDevice = (
    chartId: number,
    deviceId: string,
    deviceName: string,
  ) => {
    setBlocks(updateDeviceById(blocks, chartId, deviceId, deviceName));
  }

  const updateNodeStyles = (nodeId: number, width: string | number, height:string|number) => {
      setBlocks(
          updateNodeStylesById(blocks, nodeId, width, height)
      );
  };

  return {updateNodeProp, updateConfig, updateDevice, updateNodeStyle, updateNodeStyles}
}