const { widget } = figma
const { useSyncedState, usePropertyMenu, AutoLayout, Text, SVG } = widget

interface LibrariesCount {
  components: { [key: string]: number };
  colourStyles: { [key: string]: number };
  textStyles: { [key: string]: number };
}

// Guard Functions
const isFillStrokeNode = (node: SceneNode): node is RectangleNode | EllipseNode | PolygonNode | StarNode | VectorNode | TextNode => {
  return 'fillStyleId' in node || 'strokeStyleId' in node;
};


// Helpers
const getLibraryInfo = async (node: any) => {
  const componentKey = node.mainComponent.key;
  console.log('Looking up for ', node.mainComponent.key);
  const publishStatus: string = await figma.clientStorage.getAsync(componentKey);
  if (publishStatus) {
    // If the publish status includes library information, you can extract it here
    console.log(`Library Info: ${publishStatus}`);
    return publishStatus; // This might include library information
  } else {
    return 'Not found';
  }
}

const getStyleInfo = async (styleId: any) => {
  if (!styleId) return null;

  let style;
  if (styleId.startsWith('S:')) {
    // Fetching local style information
    style = figma.getStyleById(styleId);
  } else {
    // Fetching remote style information (limited details available)
    // You may attempt to fetch more details if the API allows
    style = figma.getStyleById(styleId);
  }

  if (style) {
    return style.name      // Any other relevant properties
  } else {
    return 'Unknown Style';
  }
};


function Widget() {
  const [totalComponentCount, setTotalComponentCount] = useSyncedState('totalComponentCount', 0);
  const [totalColourStyleCount, setTotalColourStyleCount] = useSyncedState('totalColourStyleCount', 0);
  // const [totalTextStyleCount, setTotalTextStyleCount] = useSyncedState('totalTextStyleCount', 0);

  const [libraryCounts, setLibraryCounts] = useSyncedState('libraryCounts', { components: {}, colourStyles: {}, textStyles: {} });
  const [localComponentsCount, setLocalComponentsCount] = useSyncedState('localComponentsCount', 0);

  const [unknowns, setUnknowns] = useSyncedState('unknowns', 0);
  let uk = 0;

  const countStuffOnCurrentPage = async () => {
    const currentPage = figma.currentPage;
    let totalLocalInstanceCount = 0;
    let librariesCount: LibrariesCount = {
      components: {},
      colourStyles: {},
      textStyles: {}
    };

    // Helper function to increment count
    const incrementCount = (library: 'components' | 'colourStyles' | 'textStyles', name: string) => {
      if (library === 'components' && (name === 'Deleted Parent' || name === 'Unknown Parent')) {
        uk++;
        setUnknowns(uk);
      }
      librariesCount[library][name] = (librariesCount[library][name] || 0) + 1;
    };

    for (const node of currentPage.findAll()) {
      // First find the sections
      if (node.type === 'SECTION') {
        console.log('Traversing ', node.name)
        for (const child of node.children) {
          console.log('Traversing ', child.name)
          if (child.type === 'FRAME') {
            for (const grandchild of child.children) {
              console.log('Traversing ', grandchild.name)
              if (grandchild.type === 'INSTANCE') {
                // const libraryName = await getLibraryInfo(node);
                if (grandchild.mainComponent?.remote) {
                  let key = grandchild.mainComponent ? (grandchild.mainComponent.parent ? grandchild.mainComponent.parent.name : 'Deleted Parent') : 'Unknown Parent';
                  // let system = await getLibraryInfo(grandchild);
                  // if(system){
                  // incrementCount('components', `${system} - ${key}`);
                  // } else {
                  incrementCount('components', key);
                  // }
                }
                else {
                  totalLocalInstanceCount++;
                }
              }

              // Check for color styles
              if (isFillStrokeNode(grandchild)) {
                if (grandchild.fillStyleId) {
                  // Assuming getStyleInfo returns the style's library name
                  const fillStyleLibrary = await getStyleInfo(grandchild.fillStyleId);
                  if (fillStyleLibrary) incrementCount('colourStyles', fillStyleLibrary);
                }

                if (grandchild.strokeStyleId) {
                  const strokeStyleLibrary = await getStyleInfo(grandchild.strokeStyleId);
                  if (strokeStyleLibrary) incrementCount('colourStyles', strokeStyleLibrary);
                }
              }

              // Check for text styles
              // if ('textStyleId' in grandchild) {
              //   if (grandchild.type === 'TEXT' && grandchild.textStyleId) {
              //     const textStyleLibrary = await getStyleInfo(grandchild.textStyleId);
              //     if (textStyleLibrary) incrementCount('textStyles', textStyleLibrary);
              //   }
              // }
            }
          }

        }
      }

    }

    setTotalComponentCount(totalLocalInstanceCount + Object.values(librariesCount['components']).reduce((a, b) => a + b, 0));
    setTotalColourStyleCount(totalColourStyleCount + Object.values(librariesCount['colourStyles']).reduce((a, b) => a + b, 0));
    // setTotalTextStyleCount(totalTextStyleCount + Object.values(librariesCount['textStyles']).reduce((a, b) => a + b, 0));
    setLibraryCounts(librariesCount);
    setLocalComponentsCount(totalLocalInstanceCount);

    console.log(`Library Instance Counts: `, librariesCount);
    console.log(`Total Local Instances: ${totalLocalInstanceCount}`);
  };


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

  const renderLibraryCounts = (type: 'components' | 'colourStyles' | 'textStyles') => {
    return Object.entries(libraryCounts[type]).map(([libraryName, count]) => (
      <AutoLayout key={libraryName} direction="horizontal" spacing={'auto'} width={'fill-parent'} verticalAlignItems="center">
        <Text fontSize={10} fontFamily="Nunito">{libraryName}</Text>
        <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="right">{`${count}`}</Text>
      </AutoLayout>
    ));
  };

  const showCoverage = (type: 'components' | 'colours' | 'text') => {
    if (type === 'components') {
      const coverage = (totalComponentCount - localComponentsCount - unknowns) / totalComponentCount
      const coverageString = (100 * coverage).toFixed(2)
      return `${coverageString}`;
    }
    else
      return 'N/A';
  }


  return (
    <AutoLayout
      direction="vertical"
      minWidth={320}
      height={'hug-contents'}
      verticalAlignItems={'center'}
      spacing={32}
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
          <Text fontSize={10} fill={'#000'} horizontalAlignText="center" fontFamily="Nunito">Run Again</Text>
        </AutoLayout>
      </AutoLayout>
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
          <AutoLayout direction="horizontal" spacing={'auto'} width={'fill-parent'} verticalAlignItems="center">
            <Text fontSize={10} fontFamily="Nunito" fill={'#f00'}>Local Components</Text>
            <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="right" fill={'#f00'}>{localComponentsCount}</Text>
          </AutoLayout>
        </AutoLayout>


      </AutoLayout>
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
      {/* <AutoLayout direction="vertical" spacing={10} width={'fill-parent'}>
        <AutoLayout width={'fill-parent'} direction="horizontal" spacing={'auto'} verticalAlignItems="center">
          <AutoLayout direction="horizontal" spacing={4} verticalAlignItems="center">
            <SVG src={`
            <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.0117188 0.945312H7.23633L7.24805 3.36523H6.90234C6.78906 2.50195 6.46484 1.91797 5.92969 1.61328C5.62891 1.44531 5.17969 1.35352 4.58203 1.33789V7.6543C4.58203 8.0957 4.6582 8.38867 4.81055 8.5332C4.9668 8.67773 5.28906 8.75 5.77734 8.75V9.05469H1.5V8.75C1.96875 8.75 2.2793 8.67773 2.43164 8.5332C2.58789 8.38477 2.66602 8.0918 2.66602 7.6543V1.33789C2.08008 1.35352 1.63086 1.44531 1.31836 1.61328C0.744141 1.92578 0.419922 2.50977 0.345703 3.36523H0L0.0117188 0.945312Z" fill="black"/>
            </svg>            
            `}></SVG>
            <Text fontFamily="Nunito" fontWeight={'bold'} fontSize={12}>Text Styles</Text>
          </AutoLayout>
          <Text fontFamily="Nunito" horizontalAlignText="right" fontWeight={'bold'} fontSize={12}>
            {showCoverage('colours')}
          </Text>
        </AutoLayout>
        {renderLibraryCounts('textStyles')}
      </AutoLayout> */}
    </AutoLayout>
  )
}

widget.register(Widget);
