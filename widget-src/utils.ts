
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
  
  // Process the current node
  let name = getFillInfo(node.fills);
  const idToAdd = node.id || '';
  
  if (name != 0) {
    if (!librariesCount[library][name]) {
      librariesCount[library][name] = { count: 1, ids: [idToAdd] };
    } else {
      librariesCount[library][name].count += 1;
      librariesCount[library][name].ids.push(idToAdd);
    }
  }
  
  // If node has children, process them
  if ('children' in node) {
    for (const child of node.children) {
      traverseAllNodes(child, library);
    }
  }
}

export async function traverseInstanceNodes(node: BaseNode) {
  console.log('Traversing --> ', node.name);
  
  if (node.type === 'INSTANCE') {
    const idToAdd = node.id || '';
    
    // Use getMainComponentAsync instead of directly accessing mainComponent
    const mainComponent = await node.getMainComponentAsync();
    
    // Check if the component is detached
    if (mainComponent?.parent === null && node.masterComponent?.detached) {
      let name = 'Detached Component';
      if (!librariesCount['detachedComponents'][name]) {
        librariesCount['detachedComponents'][name] = { count: 1, ids: [idToAdd] };
      } else {
        librariesCount['detachedComponents'][name].count += 1;
        librariesCount['detachedComponents'][name].ids.push(idToAdd);
      }
    } 
    // Check if it's from an external library
    else if (mainComponent?.remote) {
      // For external components, use library name + component name
      let libraryName = mainComponent?.remote ? 
        mainComponent.parent?.name || 'Unknown Library' : 'Local Library';
      let name = mainComponent?.name || 'Unknown Component';
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
      let name = mainComponent?.name || 'Unknown Local Component';
      if (!librariesCount['localComponents'][name]) {
        librariesCount['localComponents'][name] = { count: 1, ids: [idToAdd] };
      } else {
        librariesCount['localComponents'][name].count += 1;
        librariesCount['localComponents'][name].ids.push(idToAdd);
      }
    }
  }
  
  // We still need to traverse children (unless it's an INSTANCE)
  if ('children' in node && node.type !== 'INSTANCE') {
    for (const child of node.children) {
      await traverseInstanceNodes(child);
    }
  }
}

export function resetCounter() {
  // Create a fresh object to avoid any reference issues
  librariesCount = {
    components: {},
    localComponents: {},
    detachedComponents: {},
    colourStyles: {},
    textStyles: {}
  };
  
  // Log the reset to verify
  console.log("Counter reset complete", JSON.stringify(librariesCount));
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
