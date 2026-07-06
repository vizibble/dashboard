import type { Block } from "../types/blocks";

export const findNodeById:any|null = (
  nodes: any[],
  targetId: number|null
) => {
      for (const node of nodes){
        if (node.id === targetId) {
            return {...node};
        }
        if (node.children && node.children.length > 0){
            const found:{} = findNodeById(node.children, targetId);
            if (found) {return found;}
        }
      }
      return null;
};

export const findNodeMetaById:any|null = (
  nodes: any[],
  targetId: number| null,
  parentContainerId: number | null = null
) => {
  for(const [index, node] of nodes.entries()){
    if(node.id === targetId){
      return {...node, parentContainerId, index}
    }
    if(node.children && node.children.length > 0){
      const nodeWithMeta:any|null = findNodeMetaById(node.children, targetId, node.id)
      if (nodeWithMeta) return nodeWithMeta;
    }
  }
  return null;
}

export const insertNodeIntoContainer = (
  nodes: any[],
  containerId: number|null,
  newNode:any
):Block[] => {
  const updatedNodes = nodes.map((node) => {
    if(node.id === containerId){
      return {...node, children:[...node.children, newNode]}
    }
    if(node.children && node.children.length > 0){
      const updatedChildren = insertNodeIntoContainer(node.children, containerId, newNode);
      return {...node, children:updatedChildren}
    }
    return node;
  })

  return updatedNodes;
}

export const deleteNodeById = (
  nodes: any[],
  targetId: number
):Block[] => {
  const updatedNodes = nodes.map((node) => {
    if(node.id === targetId){
      return null;
    }
    if(node.children && node.children.length > 0){
      const updatedChildren = deleteNodeById(node.children, targetId);
      return {...node, children:updatedChildren}
    }
    return node
  }).filter((node)=>(node !== null))

  return updatedNodes
}

export const removeEmptyRows = (
  nodes: any[],
):Block[] => {
  const updatedNodes = nodes.map((node) => {
    if(node.type === "row" && node.children.length == 0){
      return null;
    }
    if(node.children && node.children.length > 0){
      const updatedChildren = removeEmptyRows(node.children);
      return {...node, children:updatedChildren}
    }
    return node
  }).filter((node)=>(node !== null))

  return updatedNodes
}

export const updateNodePropById = (nodes: any[], targetId: number, prop:string, value:string|number):Block[] => {
    const updatedNodes = nodes.map((node) => {
      if(node.id === targetId){
        return {...node, props:{...node.props, [prop]:value}}
      }
      if(node.children && node.children.length > 0){
        const updatedChildren = updateNodePropById(node.children, targetId, prop, value);
        return {...node, children:updatedChildren}
      }
      return node
    });

    return updatedNodes
}

export const updateDeviceById = (nodes: Block[], chartId: number, deviceId:string, deviceName:string):Block[] => {
    const updatedNodes = nodes.map((node:Block) => {
      if(node.id === chartId){
        return {...node, props:{...node.props, config:{...node.props.config, deviceId:deviceId, deviceName:deviceName}}}
      }
      if(node.children && node.children.length > 0){
        const updatedChildren = updateDeviceById(node.children, chartId, deviceId, deviceName);
        return {...node, children:updatedChildren}
      }
      return node
    });

    return updatedNodes
}

export const updateConfigById = (nodes: any[], metricId: number, configName:string, value:string|boolean|number|null):Block[] => {
    const updatedNodes = nodes.map((node) => {
      if(node.id === metricId){
        return {...node, props:{...node.props, config:{...node.props.config, [configName]:value}}}
      }
      if(node.children && node.children.length > 0){
        const updatedChildren = updateConfigById(node.children, metricId, configName, value);
        return {...node, children:updatedChildren}
      }
      return node
    });

    return updatedNodes
}

export const updateNodeStyleById = (nodes: any[], nodeId: number, styleName:string, value:string|number):Block[] => {
    const updatedNodes = nodes.map((node) => {
      if(node.id === nodeId){
        return {...node, props:{...node.props, style:{...node.props.style, [styleName]:value}}}
      }
      if(node.children && node.children.length > 0){
        const updatedChildren = updateNodeStyleById(node.children, nodeId, styleName, value);
        return {...node, children:updatedChildren}
      }
      return node
    });

    return updatedNodes
}

export const updateNodeStylesById = (nodes: any[], nodeId: number, width: string|number, height:string|number):Block[] => {
    const updatedNodes = nodes.map((node) => {
      if(node.id === nodeId){
        return {...node, props:{...node.props, style:{...node.props.style, width:width, height:height}}}
      }
      if(node.children && node.children.length > 0){
        const updatedChildren = updateNodeStylesById(node.children, nodeId,width, height);
        return {...node, children:updatedChildren}
      }
      return node
    });

    return updatedNodes
}

export const moveNodeWithinContainer = (
  nodes: any[],
  containerId: number,
  fromIndex: number,
  toIndex: number
) => {
  const updatedNodes:any[] = nodes.map((node) => {
    if(containerId === node.id){
      const children = [...node.children]
      if (toIndex < 0 || toIndex >= children.length) {
        return node;
      }
      const childNode = children[fromIndex]
      children.splice(fromIndex, 1);
      children.splice(toIndex, 0, childNode);
      return {...node, children:children}
    }
    if(node.children && node.children.length > 0){
      const updatedChildren = moveNodeWithinContainer(node.children, containerId, fromIndex, toIndex);
      return {...node, children:updatedChildren}
    }
    return node
  })

  return updatedNodes;
}

export const moveNodeAcrossContainers = (
  nodes: any[],
  targetContainerId: number,
  targetId: number
) => {
  const nodeToMove = findNodeById(nodes, targetId);
  const whereToMove = findNodeById(nodes, targetContainerId);
  if(nodeToMove.type === "column" && whereToMove.type === "section"){//workaround
    return nodes;
  }
  const updatedNodes = deleteNodeById(nodes, targetId);
  const newUpdatedNodes = insertNodeIntoContainer(updatedNodes, targetContainerId, nodeToMove);
  return newUpdatedNodes;
}

export const moveSectionInBlock = (
  nodes: any[],
  fromIndex: number,
  toIndex: number
) => {
  const updatedNodes = [...nodes];
  const section = updatedNodes[fromIndex];
  updatedNodes.splice(fromIndex, 1);
  updatedNodes.splice(toIndex, 0, section);
  return updatedNodes;
}


