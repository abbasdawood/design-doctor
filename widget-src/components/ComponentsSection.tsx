
const { AutoLayout, Text, SVG } = figma.widget;
import { Library } from '../types';

interface ComponentsSectionProps {
  title: string;
  type: 'components' | 'localComponents' | 'detachedComponents';
  data: Record<string, Library>;
  iconColor: string;
  textColor?: string;
  selectLayersById: (ids: string[]) => void;
}

export function ComponentsSection(props: ComponentsSectionProps) {
  const { title, type, data, iconColor, textColor = '#333', selectLayersById } = props;
  
  const renderLibraryCounts = () => {
    const characterLength = 45;

    return Object.entries<Library>(data).map(([libraryId, library]) => (
      <AutoLayout key={libraryId} direction="horizontal" spacing={'auto'} width={'fill-parent'} verticalAlignItems="center">
        <AutoLayout direction="horizontal" spacing={4} width={'fill-parent'} verticalAlignItems="center">
          <Text fontSize={10} fontFamily="Nunito" truncate={true} fill={type === 'localComponents' ? '#f00' : textColor}>
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
        <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="right" fill={type === 'localComponents' ? '#f00' : textColor}>{`${library.count}`}</Text>
      </AutoLayout>
    ));
  };

  return (
    <AutoLayout
      direction="vertical"
      width={'fill-parent'}
      spacing={10}
    >
      <AutoLayout width={'fill-parent'} direction="horizontal" spacing={'auto'} verticalAlignItems="center">
        <AutoLayout direction="horizontal" spacing={4} verticalAlignItems="center">
          <SVG src={`
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 5.99999L2.54558 3.45441L5.09117 5.99999L2.54558 8.54558L0 5.99999Z" fill="${iconColor}" />
              <path d="M3.11128 2.88872L5.65686 0.34314L8.20245 2.88872L5.65686 5.43431L3.11128 2.88872Z" fill="${iconColor}" />
              <path d="M6.22252 5.99999L8.76811 3.45441L11.3137 5.99999L8.76811 8.54558L6.22252 5.99999Z" fill="${iconColor}" />
              <path d="M3.11128 9.11126L5.65686 6.56568L8.20245 9.11126L5.65686 11.6568L3.11128 9.11126Z" fill="${iconColor}" />
            </svg>`}></SVG>
          <Text fontFamily="Nunito" fontWeight={'bold'} fontSize={12} fill={type === 'localComponents' ? '#f00' : (type === 'detachedComponents' ? '#FF9900' : textColor)}>{title}</Text>
        </AutoLayout>
      </AutoLayout>
      {renderLibraryCounts()}
    </AutoLayout>
  );
}
