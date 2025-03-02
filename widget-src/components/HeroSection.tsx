const { widget } = figma;
const { AutoLayout, Text, SVG, useSyncedState, useEffect } = widget;

interface HeroSectionProps {
  coverage: string;
  onRunAgain: () => void;
}

export function HeroSection(props: HeroSectionProps) {
  const { coverage, onRunAgain } = props;
  const [isLoading, setIsLoading] = useSyncedState("isLoading", false);
  const [loadingMessage, setLoadingMessage] = useSyncedState("loadingMessage", "");
  
  // Quirky loading messages
  const loadingMessages = [
    "Counting pixels... so many pixels! 🔍",
    "Inspecting component DNA... 🧬",
    "Hunting for rogue components... 🕵️‍♀️",
    "Calling the design police... 👮‍♂️",
    "Performing component surgery... 🩺",
    "Diagnosing design ailments... 🤒",
    "Searching for design vitamins... 💊",
    "Taking the design's temperature... 🌡️",
    "Checking component pulse... ❤️",
    "Writing a design prescription... 📝"
  ];

  // Function to change message periodically during loading
  useEffect(() => {
    if (isLoading) {
      let interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setLoadingMessage(loadingMessages[randomIndex]);
      }, 2000);
      
      // Initial loading message
      setLoadingMessage(loadingMessages[0]);
      
      return () => {
        clearInterval(interval);
      };
    }
  });

  // Start loading when Run Again is clicked
  const handleRunAgain = () => {
    setIsLoading(true);
    setLoadingMessage(loadingMessages[0]);
    onRunAgain();
  };

  // Determine colors based on coverage percentage
  const getCoverageStyles = () => {
    const coverageNum = parseFloat(coverage);
    
    if (coverageNum >= 80) {
      return {
        textColor: "#1D8A4B", // Dark green
        backgroundColor: "#E6F5EC", // Light green background
        iconColor: "#4CAF50"
      };
    } else if (coverageNum >= 30) {
      return {
        textColor: "#CD8D00", // Dark yellow
        backgroundColor: "#FFF8E5", // Light yellow background
        iconColor: "#F5B000"
      };
    } else {
      return {
        textColor: "#D13438", // Dark red
        backgroundColor: "#FDEEEE", // Light red background
        iconColor: "#E74C3C"
      };
    }
  };

  const { textColor, backgroundColor, iconColor } = getCoverageStyles();

  return (
    <AutoLayout
      direction="vertical"
      spacing={8}
      padding={16}
      width={200}
      height={"fill-parent"}
      verticalAlignItems={"start"}
      horizontalAlignItems={"center"}
      fill={isLoading ? "#f9f9f9" : backgroundColor}
      cornerRadius={8}
    >
      <Text
        fontSize={18}
        horizontalAlignText={"center"}
        fontFamily="Nunito"
        fontWeight={"bold"}
      >
        🩺 Design Doctor
      </Text>

      <AutoLayout
        direction="vertical"
        spacing={4}
        verticalAlignItems={"center"}
        horizontalAlignItems={"center"}
        padding={{ top: 16, bottom: 16 }}
      >
        {isLoading ? (
          <AutoLayout
            direction="vertical"
            spacing={16}
            verticalAlignItems={"center"}
            horizontalAlignItems={"center"}
            width={"fill-parent"}
          >
            {/* Spinner animation */}
            <SVG
              src={`<svg width="40" height="40" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#C869EF" stroke-width="5" stroke-dasharray="80 30">
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0 25 25"
                    to="360 25 25"
                    dur="1s"
                    repeatCount="indefinite"/>
                </circle>
              </svg>`}
            />
            <Text
              fontSize={12}
              fontFamily="Nunito"
              horizontalAlignText={"center"}
              width={180}
              fill={"#666"}
            >
              {loadingMessage}
            </Text>
          </AutoLayout>
        ) : (
          <>
            <Text fontSize={10} fontFamily="Nunito" fill={textColor}>
              Components Coverage
            </Text>
            <Text
              fontSize={48}
              fontFamily="Nunito"
              fontWeight={"bold"}
              fill={textColor}
            >
              {coverage}%
            </Text>
          </>
        )}

        <AutoLayout
          padding={{ vertical: 4, horizontal: 8 }}
          stroke={isLoading ? "#f3f3f3" : backgroundColor}
          fill={isLoading ? "#fafafa" : "#FFFFFF"}
          strokeWidth={1}
          horizontalAlignItems={"center"}
          cornerRadius={14}
          verticalAlignItems="center"
          onClick={handleRunAgain}
        >
          <Text
            fontSize={10}
            fill={isLoading ? "#000" : textColor}
            horizontalAlignText="center"
            fontFamily="Nunito"
          >
            {isLoading ? "Running..." : "Run Again"}
          </Text>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
}
