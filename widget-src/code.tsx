const { widget } = figma;
const {
  useSyncedState,
  usePropertyMenu,
  useEffect,
  AutoLayout,
  Text,
  SVG,
  Rectangle,
} = widget;

interface LibrariesCount {
  components: Record<string, { count: number; ids: string[]; isApproved?: boolean; key?: string }>;
  localComponents: Record<string, { count: number; ids: string[]; isApproved?: boolean; key?: string }>;
  colourStyles: Record<string, { count: number; ids: string[] }>;
  textStyles: Record<string, { count: number; ids: string[] }>;
}

let librariesCount: LibrariesCount = {
  components: {},
  localComponents: {},
  colourStyles: {},
  textStyles: {},
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
  return Object.keys(objectName).length === 0;
};

// Lookup Functions
function getFillInfo(fillInfo: any) {
  if (!fillInfo || !fillInfo.length) return [];

  return fillInfo
    .map((f: any) => {
      let colour;

      if (f.type === "SOLID") {
        // Check if boundVariables exists and has valid color data
        if (
          f.boundVariables &&
          f.boundVariables.color &&
          !isObjectEmpty(f.boundVariables.color) &&
          f.boundVariables.color.type === "VARIABLE_ALIAS"
        ) {
          colour =
            getVariableName(f.boundVariables.color.id) || "Unknown Variable";
        }
        // If valid color property exists - ensure they're not NaN
        else if (
          f.color &&
          typeof f.color.r === "number" && !isNaN(f.color.r) &&
          typeof f.color.g === "number" && !isNaN(f.color.g) &&
          typeof f.color.b === "number" && !isNaN(f.color.b)
        ) {
          colour = "Local Colour";
        }
        // No valid color
        else {
          colour = "No Fill";
        }

        /* Safer logging that won't cause issues if properties are undefined */
        console.log(`Inferred: ${colour}`);
      }
      return colour;
    })
    .filter(Boolean); // Remove any undefined values
}

function traverseAllNodes(
  node: BaseNode,
  library: "colourStyles" | "textStyles",
) {
  console.log("Traversing --> ", node.name);

  function traverse(node: any) {
    let count = 0;

    let name = getFillInfo(node.fills);
    const idToAdd = node.id || ""; // Provide a default value ('') if layerId is undefined

    if (name != 0) {
      if (!librariesCount[library][name]) {
        count++;
        librariesCount[library][name] = { count: count, ids: [idToAdd] };
      } else {
        librariesCount[library][name].count += 1;
        librariesCount[library][name].ids.push(idToAdd);
      }
    }

    if ("children" in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }
  traverse(node);
}

function traverseInstanceNodes(node: BaseNode) {
  console.log("Traversing --> ", node.name);

  function traverse(node: any) {
    if (node.type === "INSTANCE") {
      // Check if it's an instance with a main component
      console.log(
        `Node --> ${node.name}\n 
           Node type --> ${node.type}\n 
           Node Parent Type --> ${node.parent?.type}\n 
           Node Main Component --> ${node.mainComponent}\n
           Node Main Component Name --> ${node.mainComponent?.name}\n
           Node Main Component Parent --> ${node.mainComponent?.parent}\n
           Node Main Component Parent Name --> ${node.mainComponent?.parent?.name}\n
           Node Main Component Remote --> ${node.mainComponent?.remote}`,
      );

      let count = 0;
      let localCount = 0;

      // Handle potential null/undefined values safely
      if (!node.mainComponent) return;

      let name = node.masterComponent?.detached
        ? "Detached Parent"
        : node.mainComponent?.parent?.name || node.mainComponent?.name;
      const idToAdd = node.id || "";

      // Get the component key for remote components
      const componentKey = node.mainComponent?.key || "";

      if (node.mainComponent.remote) {
        // Access from global state since we're outside the Widget component
        const storedKeys = figma.root.getPluginData("approvedLibraryKeys");
        const approvedKeys = storedKeys ? JSON.parse(storedKeys) : [];
        
        // Check if we're filtering by approved library keys and if this component is in the approved list
        const isApproved =
          approvedKeys.length === 0 ||
          approvedKeys.includes(componentKey);

        // Add a tag to the name to indicate if it's approved or not
        const taggedName = isApproved ? `✅ ${name}` : `❌ ${name}`;

        if (!librariesCount["components"][taggedName]) {
          count++;
          librariesCount["components"][taggedName] = {
            count: count,
            ids: [idToAdd],
            isApproved: isApproved,
            key: componentKey,
          };
        } else {
          librariesCount["components"][taggedName].count += 1;
          librariesCount["components"][taggedName].ids.push(idToAdd);
        }
      } else {
        if (!librariesCount["localComponents"][name]) {
          localCount++;
          librariesCount["localComponents"][name] = {
            count: localCount,
            ids: [idToAdd],
            isApproved: false,
            key: "",
          };
        } else {
          librariesCount["localComponents"][name].count += 1;
          librariesCount["localComponents"][name].ids.push(idToAdd);
        }
      }
    }

    // Traverse all nodes, except for when its an INSTANCE of a COMPONENT
    if ("children" in node && node.type !== "INSTANCE") {
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
    textStyles: {},
  };
}

function selectLayersById(layerIds: string[]) {
  // Clear the current selection
  figma.currentPage.selection = [];

  // Find and select each layer by its ID
  for (const layerId of layerIds) {
    const selectedLayer = figma.currentPage.findOne(
      (node) => node.id === layerId,
    );
    if (selectedLayer) {
      // Use the `select` method instead of directly modifying `selection`
      figma.currentPage.selection = [
        ...figma.currentPage.selection,
        selectedLayer,
      ];
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
  const updatedKeys =
    (await figma.clientStorage.getAsync("approvedComponentKeys")) || [];

  if (updatedKeys.length === 0) {
    // In a real implementation, you might want to show a UI to select which libraries to include
    // For now, we'll just include all components from all libraries
    for (const library of libraries) {
      try {
        // This is a simplified example - in a real scenario you might want to fetch components
        // more selectively or from a predefined list
        const libraryComponents = await figma.teamLibrary.getComponentDataAsync(
          library.key,
        );
        libraryComponents.forEach((component) => {
          componentKeys.push(component.key);
        });
      } catch (error) {
        console.error(
          `Error loading components from library ${library.name}:`,
          error,
        );
      }
    }

    // Store the keys for future use
    await figma.clientStorage.setAsync("approvedComponentKeys", componentKeys);
  }

  return updatedKeys.length > 0 ? updatedKeys : componentKeys;
}

const Widget = () => {
  const [totalComponentCount, setTotalComponentCount] = useSyncedState(
    "totalComponentCount",
    0,
  );
  const [totalColourStyleCount, setTotalColourStyleCount] = useSyncedState(
    "totalColourStyleCount",
    0,
  );
  // const [totalTextStyleCount, setTotalTextStyleCount] = useSyncedState('totalTextStyleCount', 0);

  const [libraryCounts, setLibraryCounts] = useSyncedState("libraryCounts", {
    components: {},
    colourStyles: {},
    textStyles: {},
    localComponents: {},
  });
  const [localComponentsCount, setLocalComponentsCount] = useSyncedState(
    "localComponentsCount",
    0,
  );

  const [isLoading, setIsLoading] = useSyncedState("isLoading", false);
  const [progress, setProgress] = useSyncedState("progress", {
    current: 0,
    total: 0,
    message: "",
  });
  const [approvedLibraryKeys, setApprovedLibraryKeys] = useSyncedState(
    "approvedLibraryKeys",
    [],
  );

  const [unknowns, setUnknowns] = useSyncedState("unknowns", 0);
  const [activeSection, setActiveSection] = useSyncedState(
    "activeSection",
    "components",
  );
  let uk = 0;

  const countStuffOnCurrentPage = async () => {
    setIsLoading(true);
    resetCounter();

    // Run the analysis in the background
    setTimeout(async () => {
      try {
        const currentPage = figma.currentPage;
        const sections = currentPage.findAllWithCriteria({
          types: ["SECTION"],
        });

        setProgress({
          current: 0,
          total: sections.length,
          message: "Finding sections...",
        });
        figma.skipInvisibleInstanceChildren = true;

        for (let i = 0; i < sections.length; i++) {
          const node = sections[i];
          setProgress({
            current: i + 1,
            total: sections.length,
            message: `Processing section: ${node.name} (${i + 1}/${sections.length})`,
          });

          console.log("Traversing ", node.name);

          // Process components first
          traverseInstanceNodes(node);

          // Then process color styles
          traverseAllNodes(node, "colourStyles");
        }

        setTotalComponentCount(
          totalComponentCount +
            Object.values(librariesCount["components"]).reduce(
              (a, b) => a + b.count,
              0,
            ),
        );
        setLocalComponentsCount(
          localComponentsCount +
            Object.values(librariesCount["localComponents"]).reduce(
              (a, b) => a + b.count,
              0,
            ),
        );
        setTotalColourStyleCount(
          totalColourStyleCount +
            Object.values(librariesCount["colourStyles"]).reduce(
              (a, b) => a + b.count,
              0,
            ),
        );
        setLibraryCounts(librariesCount);

        console.log(`Library Instance Counts: `, librariesCount);
        console.log(
          `Total Local Instances: ${Object.values(librariesCount["localComponents"]).reduce((a, b) => a + b.count, 0)}`,
        );

        setProgress({
          current: sections.length,
          total: sections.length,
          message: "Analysis complete!",
        });
      } catch (error) {
        console.error("Error during analysis:", error);
        setProgress({ current: 0, total: 0, message: "Error during analysis" });
      } finally {
        setIsLoading(false);
      }
    }, 100); // Small delay to allow UI to update first
  };

  usePropertyMenu(
    [
      {
        itemType: "action",
        propertyName: "reset",
        tooltip: "Reset",
        icon: `<svg width="22" height="15" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9026 1.43168C12.1936 1.47564 12.4822 1.54098 12.7663 1.62777L12.7719 1.62949C14.0176 2.0114 15.109 2.78567 15.8858 3.83854L15.8918 3.84665C16.5473 4.73808 16.9484 5.78867 17.058 6.88508L14.0863 4.88858L13.3259 6.02047L17.3852 8.74774L17.9079 9.09894L18.2994 8.60571L21.0056 5.19662L19.9376 4.34879L18.3531 6.34479C18.3424 6.27511 18.3306 6.20563 18.3179 6.13636C18.1135 5.02233 17.6601 3.96334 16.9851 3.04274L16.9791 3.03462C16.0303 1.74427 14.6956 0.794984 13.1714 0.326388L13.1658 0.32466C12.8171 0.217755 12.4627 0.137298 12.1055 0.0832198C10.899 -0.0994351 9.66061 0.0188515 8.50099 0.435448L8.4947 0.437711C7.42511 0.823053 6.46311 1.44778 5.6774 2.25801C5.38576 2.55876 5.11841 2.88506 4.87886 3.23416C4.85856 3.26376 4.83845 3.29351 4.81854 3.32343L5.94262 4.08294L5.94802 4.07484C5.96253 4.0531 5.97717 4.03146 5.99195 4.00993C6.71697 2.95331 7.75331 2.15199 8.95541 1.72013L8.9617 1.71788C9.33245 1.58514 9.71301 1.48966 10.098 1.43156C10.6957 1.34135 11.3039 1.34123 11.9026 1.43168ZM3.70034 6.39429L0.994141 9.80338L2.06217 10.6512L3.64663 8.65521C3.65741 8.72489 3.66916 8.79437 3.68187 8.86364C3.88627 9.97767 4.33964 11.0367 5.01467 11.9573L5.02063 11.9654C5.96945 13.2557 7.30418 14.205 8.82835 14.6736L8.83398 14.6753C9.18281 14.7823 9.53732 14.8628 9.89464 14.9168C11.101 15.0994 12.3393 14.9811 13.4988 14.5646L13.5051 14.5623C14.5747 14.1769 15.5367 13.5522 16.3224 12.742C16.614 12.4413 16.8813 12.115 17.1209 11.7659C17.1412 11.7363 17.1613 11.7065 17.1812 11.6766L16.0571 10.9171L16.0518 10.9252C16.0372 10.9469 16.0225 10.9686 16.0078 10.9902C15.2827 12.0467 14.2464 12.848 13.0444 13.2799L13.0381 13.2821C12.6673 13.4149 12.2868 13.5103 11.9018 13.5684C11.3041 13.6587 10.6958 13.6588 10.0971 13.5683C9.8062 13.5244 9.51754 13.459 9.23347 13.3722L9.22784 13.3705C7.98212 12.9886 6.89078 12.2143 6.11393 11.1615L6.10795 11.1534C5.45247 10.2619 5.05138 9.21133 4.94181 8.11492L7.91342 10.1114L8.6739 8.97953L4.61459 6.25226L4.09188 5.90106L3.70034 6.39429Z" fill="white"/>
          </svg>
          `,
      },
    ],
    () => {
      countStuffOnCurrentPage();
    },
  );

  const renderLibraryCounts = (
    type: "components" | "colourStyles" | "textStyles" | "localComponents",
  ) => {
    const characterLength = 45;

    return Object.entries<Library>(libraryCounts[type]).map(
      ([libraryId, library]) => (
        <AutoLayout
          key={libraryId}
          direction="horizontal"
          spacing={"auto"}
          width={"fill-parent"}
          verticalAlignItems="center"
          padding={{ vertical: 8, horizontal: 12 }}
          fill={type === "localComponents" ? "#FFF0F0" : "#FFFFFF"}
          cornerRadius={4}
          hoverStyle={{
            fill: type === "localComponents" ? "#FFE5E5" : "#F5F5F5",
          }}
          onClick={() => {
            selectLayersById(library.ids);
          }}
        >
          <Text
            fontSize={12}
            fontFamily="Nunito"
            truncate={true}
            fill={type === "localComponents" ? "#F00" : "#333"}
            width={260}
          >
            {libraryId.length > characterLength
              ? libraryId.slice(0, characterLength) + ".."
              : libraryId}
          </Text>
          <Text
            fontSize={12}
            fontFamily="Nunito"
            horizontalAlignText="right"
            fill={type === "localComponents" ? "#F00" : "#333"}
          >
            {`${library.count}`}
          </Text>
        </AutoLayout>
      ),
    );
  };

  const showCoverage = (type: "components" | "colours" | "text") => {
    if (type === "components") {
      console.log(totalComponentCount, localComponentsCount, unknowns);
      const coverage =
        (totalComponentCount - localComponentsCount - unknowns) /
        totalComponentCount;
      const coverageString = (100 * coverage).toFixed(2);
      return `${coverageString}`;
    } else return "N/A";
  };

  // Fetch approved library keys when the widget is first loaded
  useEffect(() => {
    const fetchApprovedKeys = async () => {
      const keys = await loadApprovedComponentKeys();
      setApprovedLibraryKeys(keys);
      // Store in plugin data for access from outside the component
      figma.root.setPluginData("approvedLibraryKeys", JSON.stringify(keys));
    };

    fetchApprovedKeys();
  }, []);

  // Render sidebar item
  const renderSidebarItem = (id: string, label: string, icon: string) => (
    <AutoLayout
      direction="horizontal"
      spacing={8}
      padding={{ vertical: 12, horizontal: 16 }}
      width={"fill-parent"}
      verticalAlignItems="center"
      fill={activeSection === id ? "#F0F0F5" : "transparent"}
      cornerRadius={4}
      onClick={() => setActiveSection(id)}
      hoverStyle={{
        fill: "#F0F0F5",
      }}
    >
      <SVG src={icon} />
      <Text
        fontSize={14}
        fontFamily="Nunito"
        fontWeight={activeSection === id ? "bold" : "normal"}
      >
        {label}
      </Text>
    </AutoLayout>
  );

  // Loading state UI
  if (isLoading) {
    return (
      <AutoLayout
        direction="vertical"
        width={1440}
        height={900}
        verticalAlignItems={"center"}
        horizontalAlignItems={"center"}
        padding={16}
        cornerRadius={16}
        fill={"#FFFFFF"}
        stroke={"#E6E6E6"}
      >
        <AutoLayout
          direction="vertical"
          spacing={24}
          padding={24}
          width={400}
          verticalAlignItems={"center"}
          horizontalAlignItems={"center"}
          fill={"#FFFFFF"}
          cornerRadius={8}
          effect={{
            type: "drop-shadow",
            color: { r: 0, g: 0, b: 0, a: 0.1 },
            offset: { x: 0, y: 2 },
            blur: 4,
            spread: 0,
          }}
        >
          <Text fontSize={24} fontFamily="Nunito" fontWeight={"bold"}>
            🩺 Design Doctor
          </Text>

          <AutoLayout direction="vertical" spacing={16} width={"fill-parent"}>
            <Text
              fontSize={16}
              fontFamily="Nunito"
              horizontalAlignText="center"
            >
              {progress.message}
            </Text>

            <AutoLayout
              width={"fill-parent"}
              height={8}
              fill="#f3f3f3"
              cornerRadius={4}
            >
              <AutoLayout
                width={(progress.current / Math.max(progress.total, 1)) * 100}
                height={8}
                fill="#C869EF"
                cornerRadius={4}
              />
            </AutoLayout>

            <Text
              fontSize={14}
              fontFamily="Nunito"
              horizontalAlignText="center"
            >
              {progress.current} of {progress.total} sections processed
            </Text>
          </AutoLayout>
        </AutoLayout>
      </AutoLayout>
    );
  }

  // Main UI - Redesigned layout with hero component coverage
  return (
    <AutoLayout
      direction="vertical"
      width={1440}
      height={900}
      cornerRadius={16}
      fill={"#FFFFFF"}
      stroke={"#E6E6E6"}
      overflow="hidden"
    >
      {/* Header with title and controls */}
      <AutoLayout
        direction="horizontal"
        width={"fill-parent"}
        padding={24}
        spacing={"auto"}
        verticalAlignItems="center"
        fill={"#FAFAFA"}
        stroke={"#E6E6E6"}
        strokeAlign="inside"
      >
        <Text fontSize={28} fontFamily="Nunito" fontWeight={"bold"}>
          🩺 Design Doctor
        </Text>

        <AutoLayout
          direction="horizontal"
          spacing={16}
          verticalAlignItems="center"
        >
          <AutoLayout
            padding={{ vertical: 8, horizontal: 16 }}
            stroke={"#f3f3f3"}
            fill={"#fafafa"}
            strokeWidth={1}
            horizontalAlignItems={"center"}
            cornerRadius={8}
            verticalAlignItems="center"
            onClick={async () => {
              await figma.clientStorage.setAsync("approvedComponentKeys", []);
              const keys = await loadApprovedComponentKeys();
              setApprovedLibraryKeys(keys);
            }}
          >
            <Text
              fontSize={14}
              fill={"#000"}
              horizontalAlignText="center"
              fontFamily="Nunito"
            >
              Configure Libraries
            </Text>
          </AutoLayout>

          <AutoLayout
            padding={{ vertical: 8, horizontal: 16 }}
            stroke={"#f3f3f3"}
            fill={"#C869EF"}
            strokeWidth={1}
            horizontalAlignItems={"center"}
            cornerRadius={8}
            verticalAlignItems="center"
            onClick={() => {
              countStuffOnCurrentPage();
            }}
          >
            <Text
              fontSize={14}
              fill={"#FFF"}
              horizontalAlignText="center"
              fontFamily="Nunito"
              fontWeight={"bold"}
            >
              Run Analysis
            </Text>
          </AutoLayout>
        </AutoLayout>
      </AutoLayout>

      {/* Hero section with component coverage */}
      <AutoLayout
        direction="vertical"
        width={"fill-parent"}
        padding={48}
        spacing={24}
        horizontalAlignItems="center"
        fill={"#F8F5FF"}
      >
        <Text fontSize={18} fontFamily="Nunito" fill="#666">
          Components Coverage
        </Text>
        <Text
          fontSize={72}
          fontFamily="Nunito"
          fontWeight={"bold"}
          fill="#C869EF"
        >
          {showCoverage("components")}%
        </Text>
        <Text fontSize={16} fontFamily="Nunito" fill="#666">
          {approvedLibraryKeys.length} approved component keys loaded
        </Text>
      </AutoLayout>

      {/* Navigation tabs */}
      <AutoLayout
        direction="horizontal"
        width={"fill-parent"}
        padding={{ horizontal: 32, vertical: 0 }}
        spacing={8}
        fill={"#FFFFFF"}
      >
        <AutoLayout
          padding={{ vertical: 16, horizontal: 24 }}
          fill={activeSection === "components" ? "#F0F0F5" : "transparent"}
          cornerRadius={{
            topLeft: 8,
            topRight: 8,
            bottomLeft: 0,
            bottomRight: 0,
          }}
          onClick={() => setActiveSection("components")}
          hoverStyle={{ fill: "#F0F0F5" }}
        >
          <Text
            fontSize={16}
            fontFamily="Nunito"
            fontWeight={activeSection === "components" ? "bold" : "normal"}
          >
            Remote Components
          </Text>
        </AutoLayout>

        <AutoLayout
          padding={{ vertical: 16, horizontal: 24 }}
          fill={activeSection === "localComponents" ? "#F0F0F5" : "transparent"}
          cornerRadius={{
            topLeft: 8,
            topRight: 8,
            bottomLeft: 0,
            bottomRight: 0,
          }}
          onClick={() => setActiveSection("localComponents")}
          hoverStyle={{ fill: "#F0F0F5" }}
        >
          <Text
            fontSize={16}
            fontFamily="Nunito"
            fontWeight={activeSection === "localComponents" ? "bold" : "normal"}
          >
            Local Components
          </Text>
        </AutoLayout>

        <AutoLayout
          padding={{ vertical: 16, horizontal: 24 }}
          fill={activeSection === "colourStyles" ? "#F0F0F5" : "transparent"}
          cornerRadius={{
            topLeft: 8,
            topRight: 8,
            bottomLeft: 0,
            bottomRight: 0,
          }}
          onClick={() => setActiveSection("colourStyles")}
          hoverStyle={{ fill: "#F0F0F5" }}
        >
          <Text
            fontSize={16}
            fontFamily="Nunito"
            fontWeight={activeSection === "colourStyles" ? "bold" : "normal"}
          >
            Color Styles
          </Text>
        </AutoLayout>
      </AutoLayout>

      <Rectangle width={"fill-parent"} height={1} fill={"#E6E6E6"} />

      {/* Content area */}
      <AutoLayout
        direction="vertical"
        width={"fill-parent"}
        height={"fill-parent"}
        padding={32}
        spacing={24}
      >
        {/* Section header */}
        <AutoLayout
          direction="horizontal"
          spacing={8}
          width={"fill-parent"}
          verticalAlignItems="center"
        >
          <Text fontSize={20} fontFamily="Nunito" fontWeight={"bold"}>
            {activeSection === "components"
              ? "Remote Components"
              : activeSection === "localComponents"
                ? "Local Components"
                : "Color Styles"}
          </Text>
          <Text fontSize={14} fontFamily="Nunito" fill="#666">
            {activeSection === "components"
              ? `(${Object.keys(libraryCounts.components).length} unique)`
              : activeSection === "localComponents"
                ? `(${Object.keys(libraryCounts.localComponents).length} unique)`
                : `(${Object.keys(libraryCounts.colourStyles).length} unique)`}
          </Text>
        </AutoLayout>

        {/* Columns header */}
        <AutoLayout
          direction="horizontal"
          spacing={"auto"}
          width={"fill-parent"}
          padding={{ horizontal: 12, vertical: 8 }}
          verticalAlignItems="center"
        >
          <Text
            fontSize={14}
            fontFamily="Nunito"
            fontWeight={"bold"}
            fill="#666"
            width={260}
          >
            Name
          </Text>
          <Text
            fontSize={14}
            fontFamily="Nunito"
            fontWeight={"bold"}
            fill="#666"
          >
            Count
          </Text>
        </AutoLayout>

        {/* Component list - with columns layout */}
        <AutoLayout
          direction="vertical"
          spacing={4}
          width={"fill-parent"}
          height={"fill-parent"}
          padding={{ bottom: 32 }}
        >
          {renderLibraryCounts(activeSection as any)}
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
};

widget.register(Widget);
