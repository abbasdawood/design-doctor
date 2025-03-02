const { widget } = figma
const { useSyncedState, usePropertyMenu, useEffect, AutoLayout, Text, SVG } = widget

interface LibrariesCount {
  components: Record<string, { count: number; ids: string[] }>;
  localComponents: Record<string, { count: number; ids: string[] }>;
  colourStyles: Record<string, { count: number; ids: string[] }>;
  textStyles: Record<string, { count: number; ids: string[] }>;
}

let librariesCount: LibrariesCount = {
  components: {},
  localComponents: {},
  colourStyles: {},
  textStyles: {}
};

interface Library {
  ids: string[];
  name?: string;
  count: number;
  isApproved?: boolean;
  key?: string;
}

// Helpers
function getVariableName(variableId: string) {
  return figma.variables.getVariableById(variableId)?.name;
}

const isObjectEmpty = (objectName: any) => {
  return Object.keys(objectName).length === 0
}

// Lookup Functions
function getFillInfo(fillInfo: any) {

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

function traverseAllNodes(node: BaseNode, library: 'colourStyles' | 'textStyles') {
  console.log('Traversing --> ', node.name);

  function traverse(node: any) {
    let count = 0;

    let name = getFillInfo(node.fills);
    const idToAdd = node.id || ''; // Provide a default value ('') if layerId is undefined

    if(name != 0){
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

function traverseInstanceNodes(node: BaseNode) {
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

      // Handle potential null/undefined values safely
      if (!node.mainComponent) return;
      
      let name = node.masterComponent?.detached ? 'Detached Parent' : (node.mainComponent?.parent?.name || node.mainComponent?.name);
      const idToAdd = node.id || ''; 
      
      // Get the component key for remote components
      const componentKey = node.mainComponent?.key || '';

      if (node.mainComponent.remote) {
        // Check if we're filtering by approved library keys and if this component is in the approved list
        const isApproved = approvedLibraryKeys.length === 0 || approvedLibraryKeys.includes(componentKey);
        
        // Add a tag to the name to indicate if it's approved or not
        const taggedName = isApproved ? `✅ ${name}` : `❌ ${name}`;
        
        if (!librariesCount['components'][taggedName]) {
          count++;
          librariesCount['components'][taggedName] = { 
            count: count, 
            ids: [idToAdd],
            isApproved: isApproved,
            key: componentKey
          };
        } else {
          librariesCount['components'][taggedName].count += 1;
          librariesCount['components'][taggedName].ids.push(idToAdd);
        }
      } else {
        if (!librariesCount['localComponents'][name]) {
          localCount++;
          librariesCount['localComponents'][name] = { 
            count: localCount, 
            ids: [idToAdd],
            isApproved: false,
            key: ''
          };
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

function resetCounter() {
  librariesCount = {
    components: {},
    localComponents: {},
    colourStyles: {},
    textStyles: {}
  };
}

function selectLayersById(layerIds: string[]) {
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

async function loadApprovedComponentKeys() {
  // Get all available libraries
  const libraries = await figma.teamLibrary.getAvailableLibrariesAsync();
  
  // Create an array to store component keys
  const componentKeys: string[] = [];
  
  // For demonstration, we'll prompt the user to select libraries to include
  // In a real implementation, you might load this from a configuration
  const updatedKeys = await figma.clientStorage.getAsync('approvedComponentKeys') || [];
  
  if (updatedKeys.length === 0) {
    // In a real implementation, you might want to show a UI to select which libraries to include
    // For now, we'll just include all components from all libraries
    for (const library of libraries) {
      try {
        // This is a simplified example - in a real scenario you might want to fetch components 
        // more selectively or from a predefined list
        const libraryComponents = await figma.teamLibrary.getComponentDataAsync(library.key);
        libraryComponents.forEach(component => {
          componentKeys.push(component.key);
        });
      } catch (error) {
        console.error(`Error loading components from library ${library.name}:`, error);
      }
    }
    
    // Store the keys for future use
    await figma.clientStorage.setAsync('approvedComponentKeys', componentKeys);
  }
  
  return updatedKeys.length > 0 ? updatedKeys : componentKeys;
}

function Widget() {
  const [totalComponentCount, setTotalComponentCount] = useSyncedState('totalComponentCount', 0);
  const [totalColourStyleCount, setTotalColourStyleCount] = useSyncedState('totalColourStyleCount', 0);
  // const [totalTextStyleCount, setTotalTextStyleCount] = useSyncedState('totalTextStyleCount', 0);

  const [libraryCounts, setLibraryCounts] = useSyncedState('libraryCounts', { components: {}, colourStyles: {}, textStyles: {} , localComponents:{}});
  const [localComponentsCount, setLocalComponentsCount] = useSyncedState('localComponentsCount', 0);
  
  const [isLoading, setIsLoading] = useSyncedState('isLoading', false);
  const [progress, setProgress] = useSyncedState('progress', { current: 0, total: 0, message: '' });
  const [approvedLibraryKeys, setApprovedLibraryKeys] = useSyncedState('approvedLibraryKeys', []);
  
  const [unknowns, setUnknowns] = useSyncedState('unknowns', 0);
  let uk = 0;

  const countStuffOnCurrentPage = async () => {
    setIsLoading(true);
    resetCounter();
    
    // Run the analysis in the background
    setTimeout(async () => {
      try {
        const currentPage = figma.currentPage;
        const sections = currentPage.findAllWithCriteria({ types: ['SECTION'] });
        
        setProgress({ current: 0, total: sections.length, message: 'Finding sections...' });
        figma.skipInvisibleInstanceChildren = true;
        
        for (let i = 0; i < sections.length; i++) {
          const node = sections[i];
          setProgress({ 
            current: i + 1, 
            total: sections.length, 
            message: `Processing section: ${node.name} (${i + 1}/${sections.length})` 
          });
          
          console.log('Traversing ', node.name);
          
          // Process components first
          traverseInstanceNodes(node);
          
          // Then process color styles
          traverseAllNodes(node, 'colourStyles');
        }
        
        setTotalComponentCount(totalComponentCount + Object.values(librariesCount['components']).reduce((a, b) => a + b.count, 0));
        setLocalComponentsCount(localComponentsCount + Object.values(librariesCount['localComponents']).reduce((a, b) => a + b.count, 0));
        setTotalColourStyleCount(totalColourStyleCount + Object.values(librariesCount['colourStyles']).reduce((a, b) => a + b.count, 0));
        setLibraryCounts(librariesCount);
        
        console.log(`Library Instance Counts: `, librariesCount);
        console.log(`Total Local Instances: ${Object.values(librariesCount['localComponents']).reduce((a, b) => a + b.count, 0)}`);
        
        setProgress({ current: sections.length, total: sections.length, message: 'Analysis complete!' });
      } catch (error) {
        console.error('Error during analysis:', error);
        setProgress({ current: 0, total: 0, message: 'Error during analysis' });
      } finally {
        setIsLoading(false);
      }
    }, 100); // Small delay to allow UI to update first
  }



  usePropertyMenu(
    [
      {
        itemType: 'action',
        propertyName: 'reset',
        tooltip: 'Reset',
        icon: `<svg width="22" height="15" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9026 1.43168C12.1936 1.47564 12.4822 1.54098 12.7663 1.62777L12.7719 1.62949C14.0176 2.0114 15.109 2.78567 15.8858 3.83854L15.8918 3.84665C16.5473 4.73808 16.9484 5.78867 17.058 6.88508L14.0863 4.88858L13.3259 6.02047L17.3852 8.74774L17.9079 9.09894L18.2994 8.60571L21.0056 5.19662L19.9376 4.34879L18.3531 6.34479C18.3424 6.27511 18.3306 6.20563 18.3179 6.13636C18.1135 5.02233 17.6601 3.96334 16.9851 3.04274L16.9791 3.03462C16.0303 1.74427 14.6956 0.794984 13.1714 0.326388L13.1658 0.32466C12.8171 0.217755 12.4627 0.137298 12.1055 0.0832198C10.899 -0.0994351 9.66061 0.0188515 8.50099 0.435448L8.4947 0.437711C7.42511 0.823053 6.46311 1.44778 5.6774 2.25801C5.38576 2.55876 5.11841 2.88506 4.87886 3.23416C4.85856 3.26376 4.83845 3.29351 4.81854 3.32343L5.94262 4.08294L5.94802 4.07484C5.96253 4.0531 5.97717 4.03146 5.99195 4.00993C6.71697 2.95331 7.75331 2.15199 8.95541 1.72013L8.9617 1.71788C9.33245 1.58514 9.71301 1.48966 10.098 1.43156C10.6957 1.34135 11.3039 1.34123 11.9026 1.43168ZM3.70034 6.39429L0.994141 9.80338L2.06217 10.6512L3.64663 8.65521C3.65741 8.72489 3.66916 8.79437 3.68187 8.86364C3.88627 9.97767 4.33964 11.0367 5.01467 11.9573L5.02063 11.9654C5.96945 13.2557 7.30418 14.205 8.82835 14.6736L8.83398 14.6753C9.18281 14.7823 9.53732 14.8628 9.89464 14.9168C11.101 15.0994 12.3393 14.9811 13.4988 14.5646L13.5051 14.5623C14.5747 14.1769 15.5367 13.5522 16.3224 12.742C16.614 12.4413 16.8813 12.115 17.1209 11.7659C17.1412 11.7363 17.1613 11.7065 17.1812 11.6766L16.0571 10.9171L16.0518 10.9252C16.0372 10.9469 16.0225 10.9686 16.0078 10.9902C15.2827 12.0467 14.2464 12.848 13.0444 13.2799L13.0381 13.2821C12.6673 13.4149 12.2868 13.5103 11.9018 13.5684C11.3041 13.6587 10.6958 13.6588 10.0971 13.5683C9.8062 13.5244 9.51754 13.459 9.23347 13.3722L9.22784 13.3705C7.98212 12.9886 6.89078 12.2143 6.11393 11.1615L6.10795 11.1534C5.45247 10.2619 5.05138 9.21133 4.94181 8.11492L7.91342 10.1114L8.6739 8.97953L4.61459 6.25226L4.09188 5.90106L3.70034 6.39429Z" fill="white"/>
          </svg>
          `,
      },
    ],
    () => {
      countStuffOnCurrentPage()
    },
  )

  const renderLibraryCounts = (type: 'components' | 'colourStyles' | 'textStyles' | 'localComponents') => {

    const characterLength = 45;

    return Object.entries<Library>(libraryCounts[type]).map(([libraryId, library]) => (
      <AutoLayout key={libraryId} direction="horizontal" spacing={'auto'} width={'fill-parent'} verticalAlignItems="center">
        <AutoLayout direction="horizontal" spacing={4} width={'fill-parent'} verticalAlignItems="center">
          <Text fontSize={10} fontFamily="Nunito" truncate={true} fill={type === 'localComponents' ? '#f00':'#333'}>
            {libraryId.length > characterLength ? libraryId.slice(0, characterLength) + '..' : libraryId}
          </Text>
          <AutoLayout
            padding={{ vertical: 4, horizontal: 8 }}
            stroke={'#f3f3f3'}
            fill={'#fafafa'}
            strokeWidth={1}
            horizontalAlignItems={'center'}
            cornerRadius={14}
            verticalAlignItems="center"
            onClick={() => {
              selectLayersById(library.ids)
            }}
          >
            <Text fontSize={10} fill={'#000'} horizontalAlignText="center" fontFamily="Nunito">Select</Text>
          </AutoLayout>
        </AutoLayout>
        <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="right" fill={type === 'localComponents' ? '#f00':'#333'}>{`${library.count}`}</Text>
      </AutoLayout>
    ));
  };

  const showCoverage = (type: 'components' | 'colours' | 'text') => {
    if (type === 'components') {
      console.log(totalComponentCount, localComponentsCount, unknowns)
      const coverage = (totalComponentCount - localComponentsCount - unknowns) / totalComponentCount
      const coverageString = (100 * coverage).toFixed(2)
      return `${coverageString}`;
    }
    else
      return 'N/A';
  }


  // Fetch approved library keys when the widget is first loaded
  useEffect(() => {
    const fetchApprovedKeys = async () => {
      const keys = await loadApprovedComponentKeys();
      setApprovedLibraryKeys(keys);
    };
    
    fetchApprovedKeys();
  }, []);

  // Loading state UI
  if (isLoading) {
    return (
      <AutoLayout
        direction="vertical"
        minWidth={320}
        height={'hug-contents'}
        verticalAlignItems={'center'}
        spacing={24}
        padding={16}
        cornerRadius={16}
        fill={'#FFFFFF'}
        stroke={'#E6E6E6'}
      >
        <AutoLayout
          horizontalAlignItems={'center'}
          spacing={'auto'}
          width={'fill-parent'}
          verticalAlignItems="center"
        >
          <Text fontSize={18} horizontalAlignText={'left'} fontFamily="Nunito" fontWeight={'bold'}>🩺 Design Doctor</Text>
          <Text fontSize={10} fontFamily="Nunito" fill="#666">Analyzing...</Text>
        </AutoLayout>
        
        <AutoLayout direction="vertical" spacing={8} width={'fill-parent'}>
          <Text fontSize={12} fontFamily="Nunito">{progress.message}</Text>
          
          <AutoLayout width={'fill-parent'} height={8} fill="#f3f3f3" cornerRadius={4}>
            <AutoLayout 
              width={`${(progress.current / Math.max(progress.total, 1)) * 100}%`} 
              height={8} 
              fill="#C869EF" 
              cornerRadius={4}
            />
          </AutoLayout>
          
          <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="center">
            {progress.current} of {progress.total} sections processed
          </Text>
        </AutoLayout>
      </AutoLayout>
    );
  }

  // Main UI
  return (
    <AutoLayout
      direction="vertical"
      minWidth={320}
      height={'hug-contents'}
      verticalAlignItems={'center'}
      spacing={24}
      padding={16}
      cornerRadius={16}
      fill={'#FFFFFF'}
      stroke={'#E6E6E6'}
    >
      <AutoLayout
        horizontalAlignItems={'center'}
        spacing={'auto'}
        width={'fill-parent'}
        verticalAlignItems="center"
      >
        <Text fontSize={18} horizontalAlignText={'left'} fontFamily="Nunito" fontWeight={'bold'}>🩺 Design Doctor</Text>
        <AutoLayout
          padding={{vertical:4, horizontal:8}}
          stroke={'#f3f3f3'}
          fill={'#fafafa'}
          strokeWidth={1}
          horizontalAlignItems={'center'}
          cornerRadius={14}
          verticalAlignItems="center"
          onClick={() => {
            countStuffOnCurrentPage()
          }}>
          <Text fontSize={10} fill={'#000'} horizontalAlignText="center" fontFamily="Nunito">Run Analysis</Text>
        </AutoLayout>
      </AutoLayout>
      
      {/* Library Configuration */}
      <AutoLayout direction="vertical" spacing={8} width={'fill-parent'}>
        <AutoLayout width={'fill-parent'} direction="horizontal" spacing={'auto'} verticalAlignItems="center">
          <Text fontFamily="Nunito" fontWeight={'bold'} fontSize={12}>Library Configuration</Text>
          <AutoLayout
            padding={{vertical:4, horizontal:8}}
            stroke={'#f3f3f3'}
            fill={'#fafafa'}
            strokeWidth={1}
            horizontalAlignItems={'center'}
            cornerRadius={14}
            verticalAlignItems="center"
            onClick={async () => {
              // In a real implementation, you'd show a UI for selecting libraries
              // For this example, we'll reset the list to force re-fetching
              await figma.clientStorage.setAsync('approvedComponentKeys', []);
              const keys = await loadApprovedComponentKeys();
              setApprovedLibraryKeys(keys);
            }}>
            <Text fontSize={10} fill={'#000'} horizontalAlignText="center" fontFamily="Nunito">Configure</Text>
          </AutoLayout>
        </AutoLayout>
        <Text fontSize={10} fontFamily="Nunito" fill="#666">
          {approvedLibraryKeys.length} approved component keys loaded
        </Text>
      </AutoLayout>
      
      {/* Components Section */}
      <AutoLayout direction="vertical" spacing={10} width={'fill-parent'}>
        <AutoLayout
          direction="vertical" width={'fill-parent'} spacing={10}
        >
          <AutoLayout width={'fill-parent'} direction="horizontal" spacing={'auto'} verticalAlignItems="center">
            <AutoLayout direction="horizontal" spacing={4} verticalAlignItems="center">
              <SVG src={`
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 5.99999L2.54558 3.45441L5.09117 5.99999L2.54558 8.54558L0 5.99999Z" fill="#C869EF" />
              <path d="M3.11128 2.88872L5.65686 0.34314L8.20245 2.88872L5.65686 5.43431L3.11128 2.88872Z" fill="#C869EF" />
              <path d="M6.22252 5.99999L8.76811 3.45441L11.3137 5.99999L8.76811 8.54558L6.22252 5.99999Z" fill="#C869EF" />
              <path d="M3.11128 9.11126L5.65686 6.56568L8.20245 9.11126L5.65686 11.6568L3.11128 9.11126Z" fill="#C869EF" />
            </svg>`}></SVG>
              <Text fontFamily="Nunito" fontWeight={'bold'} fontSize={12}>Components Coverage</Text>
            </AutoLayout>
            <Text fontFamily="Nunito" horizontalAlignText="right" fontWeight={'bold'} fontSize={12}>
              {showCoverage('components')} %
            </Text>
          </AutoLayout>
          {renderLibraryCounts('components')}
          <Text fill={'#f00'} fontSize={12} horizontalAlignText={'left'} fontFamily="Nunito" fontWeight={'bold'}>🔻 Local Components</Text>
          {renderLibraryCounts('localComponents')}
        </AutoLayout>
      </AutoLayout>
      
      {/* Colors Section */}
      <AutoLayout direction="vertical" spacing={10} width={'fill-parent'}>
        <AutoLayout width={'fill-parent'} direction="horizontal" spacing={'auto'} verticalAlignItems="center">
          <AutoLayout direction="horizontal" spacing={4} verticalAlignItems="center">
            <SVG src={`
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="3.6" height="3.6" fill="#EF8B8B"/>
            <rect x="4.3999" width="3.6" height="3.6" fill="#369EFF"/>
            <rect x="4.3999" y="4.40002" width="3.6" height="3.6" fill="#FFB966"/>
            <rect y="4.40002" width="3.6" height="3.6" fill="#66DB9A"/>
            </svg>
            `}></SVG>
            <Text fontFamily="Nunito" fontWeight={'bold'} fontSize={12}>Colours </Text>
          </AutoLayout>
          <Text fontFamily="Nunito" horizontalAlignText="right" fontWeight={'bold'} fontSize={12}>
            {showCoverage('colours')}
          </Text>
        </AutoLayout>
        {renderLibraryCounts('colourStyles')}
      </AutoLayout>
    </AutoLayout>
  )
}


widget.register(Widget);
