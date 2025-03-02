
import { widget } from "figma";
const { AutoLayout, Text, SVG } = widget;
import { Library } from "../types";

interface ColourSectionProps {
  data: Record<string, Library>;
  selectLayersById: (ids: string[]) => void;
}

export function ColourSection(props: ColourSectionProps) {
  const { data, selectLayersById } = props;
  
  const renderLibraryCounts = () => {
    const characterLength = 45;
    
    return Object.entries<Library>(data)
      .sort((a, b) => {
        // First by count (highest to lowest)
        const countDiff = b[1].count - a[1].count;
        // If counts are equal, sort alphabetically
        return countDiff !== 0 ? countDiff : a[0].localeCompare(b[0]);
      })
      .map(([colorName, color]) => (
        <AutoLayout 
          key={colorName} 
          direction="horizontal" 
          spacing={'auto'} 
          width={'fill-parent'} 
          verticalAlignItems="center"
          padding={{ vertical: 4, horizontal: 8 }}
          hoverStyle={{ fill: '#f5f5f5' }}
          cornerRadius={4}
          onClick={() => selectLayersById(color.ids)}
        >
          <Text fontSize={10} fontFamily="Nunito" truncate={true}>
            {colorName.length > characterLength ? colorName.slice(0, characterLength) + '..' : colorName}
          </Text>
          <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="right">{`${color.count}`}</Text>
        </AutoLayout>
      ));
  };

  return (
    <AutoLayout direction="vertical" spacing={10} width={'fill-parent'} padding={16}>
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
      </AutoLayout>
      {renderLibraryCounts()}
    </AutoLayout>
  );
}
