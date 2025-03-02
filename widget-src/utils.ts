
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

  function traverse(node: any) {
    let count = 0;

    let name = getFillInfo(node.fills);
    const idToAdd = node.id || ''; // Provide a default value ('') if layerId is undefined

    if (name != 0) {
      if (!librariesCount[library][name]) {
        count++;
        librariesCount[library][name] = { count: count, ids: [idToAdd] };
      } else {
        librariesCount[library][name].count += 1;
        librariesCount[library][name].ids.push(idToAdd);
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }
  traverse(node);
}

export function traverseInstanceNodes(node: BaseNode) {
  console.log('Traversing --> ', node.name);

  function traverse(node: any) {
    if (node.type === 'INSTANCE') {
      // Check if it's an instance with a main component
      console.log(
        `Node --> ${node.name}\n 
           Node type --> ${node.type}\n 
           Node Parent Type --> ${node.parent?.type}\n 
           Node Main Component --> ${node.mainComponent}\n
           Node Main Component Name --> ${node.mainComponent?.name}\n
           Node Main Component Parent --> ${node.mainComponent?.parent}\n
           Node Main Component Parent Name --> ${node.mainComponent?.parent?.name}\n
           Node Main Component Remote --> ${node.mainComponent?.remote}`
      );

      let count = 0;
      let localCount = 0;
      let detachedCount = 0;
      const idToAdd = node.id || ''; // Provide a default value ('') if layerId is undefined

      // Check if the component is detached
      if (node.mainComponent?.parent === null && node.masterComponent?.detached) {
        let name = 'Detached Component';
        if (!librariesCount['detachedComponents'][name]) {
          detachedCount++;
          librariesCount['detachedComponents'][name] = { count: detachedCount, ids: [idToAdd] };
        } else {
          librariesCount['detachedComponents'][name].count += 1;
          librariesCount['detachedComponents'][name].ids.push(idToAdd);
        }
      } 
      // Check if it's from an external library
      else if (node.mainComponent?.remote) {
        // For external components, use library name + component name
        let libraryName = node.mainComponent?.remote ? node.mainComponent.parent?.name || 'Unknown Library' : 'Local Library';
        let name = node.mainComponent?.name || 'Unknown Component';
        let fullName = `${libraryName} / ${name}`;
        
        if (!librariesCount['components'][fullName]) {
          count++;
          librariesCount['components'][fullName] = { count: count, ids: [idToAdd] };
        } else {
          librariesCount['components'][fullName].count += 1;
          librariesCount['components'][fullName].ids.push(idToAdd);
        }
      } 
      // If not detached and not from external library, it's a local component
      else {
        let name = node.mainComponent?.name || 'Unknown Local Component';
        if (!librariesCount['localComponents'][name]) {
          localCount++;
          librariesCount['localComponents'][name] = { count: localCount, ids: [idToAdd] };
        } else {
          librariesCount['localComponents'][name].count += 1;
          librariesCount['localComponents'][name].ids.push(idToAdd);
        }
      }
    }

    // Traverse all nodes, except for when its an INSTANCE of a COMPONENT
    if ('children' in node && node.type !== 'INSTANCE') {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  // Start traversal from the root of the document
  traverse(node);
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
