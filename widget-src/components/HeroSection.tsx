
const { AutoLayout, Text } = figma.widget;

interface HeroSectionProps {
  coverage: string;
  onRunAgain: () => void;
}

export function HeroSection(props: HeroSectionProps) {
  const { coverage, onRunAgain } = props;
  
  return (
    <AutoLayout
      direction="vertical"
      spacing={8}
      padding={16}
      width={200}
      height={'fill-parent'}
      verticalAlignItems={'start'}
      horizontalAlignItems={'center'}
      fill={'#f9f9f9'}
      cornerRadius={8}
    >
      <Text fontSize={18} horizontalAlignText={'center'} fontFamily="Nunito" fontWeight={'bold'}>🩺 Design Doctor</Text>

      <AutoLayout
        direction="vertical"
        spacing={4}
        verticalAlignItems={'center'}
        horizontalAlignItems={'center'}
        padding={{ top: 16, bottom: 16 }}
      >
        <Text fontSize={10} fontFamily="Nunito">Components Coverage</Text>
        <Text fontSize={48} fontFamily="Nunito" fontWeight={'bold'} fill={'#C869EF'}>
          {coverage}%
        </Text>
        
        <AutoLayout
          padding={{ vertical: 4, horizontal: 8 }}
          stroke={'#f3f3f3'}
          fill={'#fafafa'}
          strokeWidth={1}
          horizontalAlignItems={'center'}
          cornerRadius={14}
          verticalAlignItems="center"
          onClick={onRunAgain}>
          <Text fontSize={10} fill={'#000'} horizontalAlignText="center" fontFamily="Nunito">Run Again</Text>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
}
