const { widget } = figma;
const { useSyncedState, usePropertyMenu, AutoLayout } = widget;

import { LibrariesCount } from "./types";
import {
  resetCounter,
  traverseInstanceNodes,
  traverseAllNodes,
  selectLayersById,
  librariesCount as globalLibrariesCount,
} from "./utils";
import { HeroSection } from "./components/HeroSection";
import { ComponentsSection } from "./components/ComponentsSection";

function Widget() {
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
    detachedComponents: {},
  } as LibrariesCount);
  const [localComponentsCount, setLocalComponentsCount] = useSyncedState(
    "localComponentsCount",
    0,
  );
  const [detachedComponentsCount, setDetachedComponentsCount] = useSyncedState(
    "detachedComponentsCount",
    0,
  );

  const [unknowns, setUnknowns] = useSyncedState("unknowns", 0);
  let uk = 0;

  const [isLoading, setIsLoading] = useSyncedState("isLoading", false);

  // Function to reset all data
  const resetData = () => {
    setTotalComponentCount(0);
    setTotalColourStyleCount(0);
    setLocalComponentsCount(0);
    setDetachedComponentsCount(0);
    setUnknowns(0);
    setLibraryCounts({
      components: {},
      colourStyles: {},
      textStyles: {},
      localComponents: {},
      detachedComponents: {},
    });
    resetCounter();
  };

  const countStuffOnCurrentPage = async () => {
    const currentPage = figma.currentPage;
    
    // Set loading state to true and ensure clean state  
    setIsLoading(true);
    
    // Make sure we reset everything
    resetCounter();
    
    // Log the reset for verification
    console.log("Reset completed, starting new analysis");

    figma.skipInvisibleInstanceChildren = true;
    
    // Find all sections on the page
    const sections = currentPage.findAllWithCriteria({
      types: ["SECTION"],
    });
    
    // Process all sections immediately (original approach)
    for (const section of sections) {
      console.log("Traversing ", section.name);
      traverseInstanceNodes(section);
      traverseAllNodes(section, "colourStyles");
    }
    
    // Calculate totals
    const externalComponentCount = Object.values(globalLibrariesCount["components"]).reduce(
      (a: number, b: { count: number; ids: string[] }) => a + b.count,
      0
    );
    
    const localCount = Object.values(globalLibrariesCount["localComponents"]).reduce(
      (a: number, b: { count: number; ids: string[] }) => a + b.count,
      0
    );
    
    const detachedCount = Object.values(globalLibrariesCount["detachedComponents"]).reduce(
      (a: number, b: { count: number; ids: string[] }) => a + b.count,
      0
    );
    
    const colourStyleCount = Object.values(globalLibrariesCount["colourStyles"]).reduce(
      (a: number, b: { count: number; ids: string[] }) => a + b.count,
      0
    );
    
    // Update all counts at once
    setTotalComponentCount(externalComponentCount);
    setLocalComponentsCount(localCount);
    setDetachedComponentsCount(detachedCount);
    setTotalColourStyleCount(colourStyleCount);
    setLibraryCounts({...globalLibrariesCount});
    
    console.log(`Library Instance Counts: `, globalLibrariesCount);
    console.log(`Total External Components: ${externalComponentCount}`);
    console.log(`Total Local Instances: ${localCount}`);
    console.log(`Total Detached Instances: ${detachedCount}`);
    
    // Set loading state back to false after computation is done
    setIsLoading(false);
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
    (e) => {
      if (e.propertyName === "reset") {
        resetData();
        setIsLoading(true);
        // After a small delay, run the analysis again
        setTimeout(() => {
          countStuffOnCurrentPage();
        }, 500);
      }
    },
  );

  const showCoverage = (type: "components" | "colours" | "text") => {
    if (type === "components") {
      // Log current counts for debugging
      console.log(
        "Coverage calculation:",
        "External:", totalComponentCount,
        "Local:", localComponentsCount,
        "Detached:", detachedComponentsCount,
        "Unknowns:", unknowns,
      );
      
      // Calculate total components
      const total = 
        totalComponentCount + localComponentsCount + detachedComponentsCount;
      
      // Calculate coverage according to README formula:
      // (External Components) / (External Components + Local Components + Detached Components) * 100
      const coverage = 
        total > 0 ? totalComponentCount / total : 0;
      
      // Format to 2 decimal places
      return (coverage * 100).toFixed(2);
    } else return "N/A";
  };

  return (
    <AutoLayout
      direction="horizontal"
      width={"hug-contents"}
      height={"hug-contents"}
      verticalAlignItems={"start"}
      spacing={16}
      padding={16}
      cornerRadius={16}
      fill={"#FFFFFF"}
      stroke={"#E6E6E6"}
    >
      <HeroSection
        coverage={showCoverage("components")}
        onRunAgain={() => {
          resetData();
          countStuffOnCurrentPage();
        }}
      />
      <AutoLayout direction="horizontal" spacing={16} width={1040}>
        <ComponentsSection
          title="External Components"
          type="components"
          data={libraryCounts.components}
          iconColor="#C869EF"
          selectLayersById={selectLayersById}
        />
        <ComponentsSection
          title="Local Components"
          type="localComponents"
          data={libraryCounts.localComponents}
          iconColor="#f00"
          textColor="#f00"
          selectLayersById={selectLayersById}
        />
        <ComponentsSection
          title="Detached Components"
          type="detachedComponents"
          data={libraryCounts.detachedComponents}
          iconColor="#FF9900"
          textColor="#FF9900"
          selectLayersById={selectLayersById}
        />
        <ComponentsSection
          title="Colours"
          type="components"
          data={libraryCounts.colourStyles}
          iconColor="#66DB9A"
          selectLayersById={selectLayersById}
        />
      </AutoLayout>
    </AutoLayout>
  );
}

widget.register(Widget);
