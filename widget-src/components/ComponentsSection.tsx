
const { widget } = figma;
const { AutoLayout, Text, SVG } = widget;
import { Library } from "../types";

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
    
    // Sort and prepare entries based on component type
    let sortedEntries = Object.entries<Library>(data)
      .sort((a, b) => {
        // First sort by count (highest to lowest)
        const countDiff = b[1].count - a[1].count;
        // If counts are equal, sort alphabetically
        return countDiff !== 0 ? countDiff : a[0].localeCompare(b[0]);
      });
    
    // For external components, group by library
    if (type === 'components') {
      // Group by library name (before the "/" character)
      const groupedByLibrary: Record<string, {name: string, components: [string, Library][]}> = {};
      
      sortedEntries.forEach(([fullName, library]) => {
        const parts = fullName.split(' / ');
        const libraryName = parts[0];
        
        if (!groupedByLibrary[libraryName]) {
          groupedByLibrary[libraryName] = {
            name: libraryName,
            components: []
          };
        }
        
        groupedByLibrary[libraryName].components.push([fullName, library]);
      });
      
      // Convert grouped libraries to component entries
      return Object.values(groupedByLibrary).map(group => (
        <AutoLayout key={group.name} direction="vertical" spacing={4} width={'fill-parent'}>
          <Text fontSize={10} fontFamily="Nunito" fill="#666" fontWeight="bold">{group.name}</Text>
          
          {group.components.map(([fullName, library]) => {
            const componentName = fullName.split(' / ')[1] || fullName;
            
            return (
              <AutoLayout 
                key={fullName} 
                direction="horizontal" 
                spacing={'auto'} 
                width={'fill-parent'} 
                verticalAlignItems="center"
                padding={{ vertical: 4, horizontal: 8 }}
                hoverStyle={{ fill: '#f5f5f5' }}
                cornerRadius={4}
                onClick={() => selectLayersById(library.ids)}
              >
                <Text fontSize={10} fontFamily="Nunito" truncate={true} fill={textColor}>
                  {componentName.length > characterLength ? componentName.slice(0, characterLength) + '..' : componentName}
                </Text>
                <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="right" fill={textColor}>{`${library.count}`}</Text>
              </AutoLayout>
            );
          })}
        </AutoLayout>
      ));
    } else {
      // For local and detached components, just display the sorted list
      return sortedEntries.map(([name, library]) => (
        <AutoLayout 
          key={name} 
          direction="horizontal" 
          spacing={'auto'} 
          width={'fill-parent'} 
          verticalAlignItems="center"
          padding={{ vertical: 4, horizontal: 8 }}
          hoverStyle={{ fill: '#f5f5f5' }}
          cornerRadius={4}
          onClick={() => selectLayersById(library.ids)}
        >
          <Text fontSize={10} fontFamily="Nunito" truncate={true} fill={type === 'localComponents' ? '#f00' : textColor}>
            {name.length > characterLength ? name.slice(0, characterLength) + '..' : name}
          </Text>
          <Text fontSize={10} fontFamily="Nunito" horizontalAlignText="right" fill={type === 'localComponents' ? '#f00' : textColor}>{`${library.count}`}</Text>
        </AutoLayout>
      ));
    }
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
