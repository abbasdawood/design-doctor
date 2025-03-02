
const { AutoLayout, Text, SVG } = figma.widget;
import { Library } from '../types';

interface ColourSectionProps {
  data: Record<string, Library>;
  selectLayersById: (ids: string[]) => void;
}

export function ColourSection(props: ColourSectionProps) {
  const { data, selectLayersById } = props;
  
  const renderLibraryCounts = () => {
    const characterLength = 45;

    return Object.entries<Library>(data).map(([libraryId, library]) => (
      <AutoLayout key={libraryId} direction="horizontal" spacing={'auto'} width={'fill-parent'} verticalAlignItems="center">
        <AutoLayout direction="horizontal" spacing={4} width={'fill-parent'} verticalAlignItems="center">
          <Text fontSize={10} fontFamily="Nunito" truncate={true} fill={'#333'}>
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
              selectLayersById(library.ids);
            }}
          >
            <Text fontSize={10} fill={'#000'} horizontalAlignText="center" fontFamily="Nunito">Select</Text>
          </AutoLayout>
        </AutoLayout>
        <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="right" fill={'#333'}>{`${library.count}`}</Text>
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
