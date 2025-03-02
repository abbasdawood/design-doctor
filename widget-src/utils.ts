
import { LibrariesCount } from './types';

// Initialize libraries count
export let librariesCount: LibrariesCount = {
  components: {},
  localComponents: {},
  detachedComponents: {},
  colourStyles: {},
  textStyles: {}
};

// Helpers
export function getVariableName(variableId: string) {
  return figma.variables.getVariableById(variableId)?.name;
}

export const isObjectEmpty = (objectName: any) => {
  return Object.keys(objectName).length === 0
}

// Lookup Functions
export function getFillInfo(fillInfo: any) {
  return fillInfo && fillInfo.length && fillInfo.map((f: any) => {
    let colour;

    if (f.type === 'SOLID') {
      if (f.color) {
        if (!isObjectEmpty(f.boundVariables) && !isObjectEmpty(f.boundVariables.color) && f.boundVariables.color.type === 'VARIABLE_ALIAS') {
          colour = getVariableName(f.boundVariables.color.id)
        } else if (isObjectEmpty(f.boundVariables)) {
          colour = 'Local Colour'
        }
      } else if (isObjectEmpty(f.color)) {
        colour = 'No Fill'
      }
      console.log(`
        Inferred: ${colour} | color ${JSON.stringify(f.color)}, BV ${JSON.stringify(f.boundVariables)}, BVC ${JSON.stringify(f.boundVariables.color)}
      `);
    }
    return colour;
  })
}

export function traverseAllNodes(node: BaseNode, library: 'colourStyles' | 'textStyles') {
  console.log('Traversing --> ', node.name);
  
  // Use an iterative approach instead of recursive to avoid call stack issues
  const nodesToProcess: any[] = [node];
  const batchSize = 100;
  let processed = 0;
  
  function processBatch() {
    const endIndex = Math.min(processed + batchSize, nodesToProcess.length);
    
    for (let i = processed; i < endIndex; i++) {
      const currentNode = nodesToProcess[i];
      processed++;
      
      // Process current node
      let name = getFillInfo(currentNode.fills);
      const idToAdd = currentNode.id || '';
      
      if (name != 0) {
        if (!librariesCount[library][name]) {
          librariesCount[library][name] = { count: 1, ids: [idToAdd] };
        } else {
          librariesCount[library][name].count += 1;
          librariesCount[library][name].ids.push(idToAdd);
        }
      }
      
      // Add children to process queue
      if ('children' in currentNode) {
        nodesToProcess.push(...currentNode.children);
      }
    }
    
    // If there are more nodes to process, schedule the next batch
    if (processed < nodesToProcess.length) {
      setTimeout(processBatch, 0);
    }
  }
  
  // Start processing
  processBatch();
}

export function traverseInstanceNodes(node: BaseNode) {
  console.log('Traversing --> ', node.name);
  
  // Use an iterative approach with batching to improve performance
  const nodesToProcess: any[] = [node];
  const batchSize = 100;
  let processed = 0;
  
  function processBatch() {
    const endIndex = Math.min(processed + batchSize, nodesToProcess.length);
    
    for (let i = processed; i < endIndex; i++) {
      const currentNode = nodesToProcess[i];
      processed++;
      
      if (currentNode.type === 'INSTANCE') {
        // Reduce verbose logging to improve performance
        console.log(`Processing instance: ${currentNode.name}`);
        
        const idToAdd = currentNode.id || '';
        
        // Check if the component is detached
        if (currentNode.mainComponent?.parent === null && currentNode.masterComponent?.detached) {
          let name = 'Detached Component';
          if (!librariesCount['detachedComponents'][name]) {
            librariesCount['detachedComponents'][name] = { count: 1, ids: [idToAdd] };
          } else {
            librariesCount['detachedComponents'][name].count += 1;
            librariesCount['detachedComponents'][name].ids.push(idToAdd);
          }
        } 
        // Check if it's from an external library
        else if (currentNode.mainComponent?.remote) {
          // For external components, use library name + component name
          let libraryName = currentNode.mainComponent?.remote ? 
            currentNode.mainComponent.parent?.name || 'Unknown Library' : 'Local Library';
          let name = currentNode.mainComponent?.name || 'Unknown Component';
          let fullName = `${libraryName} / ${name}`;
          
          if (!librariesCount['components'][fullName]) {
            librariesCount['components'][fullName] = { count: 1, ids: [idToAdd] };
          } else {
            librariesCount['components'][fullName].count += 1;
            librariesCount['components'][fullName].ids.push(idToAdd);
          }
        } 
        // If not detached and not from external library, it's a local component
        else {
          let name = currentNode.mainComponent?.name || 'Unknown Local Component';
          if (!librariesCount['localComponents'][name]) {
            librariesCount['localComponents'][name] = { count: 1, ids: [idToAdd] };
          } else {
            librariesCount['localComponents'][name].count += 1;
            librariesCount['localComponents'][name].ids.push(idToAdd);
          }
        }
      }
      
      // Add children to process queue, except for when its an INSTANCE
      if ('children' in currentNode && currentNode.type !== 'INSTANCE') {
        nodesToProcess.push(...currentNode.children);
      }
    }
    
    // If there are more nodes to process, schedule the next batch with setTimeout
    if (processed < nodesToProcess.length) {
      setTimeout(processBatch, 0);
    }
  }
  
  // Start processing
  processBatch();
}

export function resetCounter() {
  librariesCount = {
    components: {},
    localComponents: {},
    detachedComponents: {},
    colourStyles: {},
    textStyles: {}
  };
}

export function selectLayersById(layerIds: string[]) {
  // Clear the current selection
  figma.currentPage.selection = [];

  // Find and select each layer by its ID
  for (const layerId of layerIds) {
    const selectedLayer = figma.currentPage.findOne((node) => node.id === layerId);
    if (selectedLayer) {
      // Use the `select` method instead of directly modifying `selection`
      figma.currentPage.selection = [...figma.currentPage.selection, selectedLayer];
    } else {
      console.error("Layer not found with ID: " + layerId);
    }
  }
}
