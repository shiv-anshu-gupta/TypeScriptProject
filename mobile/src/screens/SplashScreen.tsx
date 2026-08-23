import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type SplashScreenProps = {
  progress: number;
};

export function SplashScreen({ progress }: SplashScreenProps) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(barAnim, {
        toValue: Math.min(progress, 100) / 100,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [barAnim, progress, logoAnim]);

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const logoOpacity = logoAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  const fillWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      {/* Background Decorative Kirana Products Pattern */}
      <View className="absolute inset-0 opacity-10 overflow-hidden">
        <View className="absolute top-10 left-8 items-center">
          <MaterialCommunityIcons name="bottle-wine" size={48} color="#3c5a64" />
        </View>
        <View className="absolute top-32 right-12 items-center">
          <MaterialCommunityIcons name="package-variant" size={52} color="#3c5a64" />
        </View>
        <View className="absolute top-20 right-32 items-center">
          <MaterialCommunityIcons name="rice" size={44} color="#3c5a64" />
        </View>
        <View className="absolute bottom-40 left-16 items-center">
          <MaterialCommunityIcons name="basket" size={56} color="#3c5a64" />
        </View>
        <View className="absolute bottom-32 right-8 items-center">
          <MaterialCommunityIcons name="pot-steam" size={48} color="#3c5a64" />
        </View>
        <View className="absolute bottom-20 left-1/3 items-center">
          <MaterialCommunityIcons name="sack" size={40} color="#3c5a64" />
        </View>
        <View className="absolute top-1/2 left-1/4 items-center">
          <MaterialCommunityIcons name="water-boiler" size={44} color="#3c5a64" />
        </View>
        <View className="absolute top-1/3 left-12 items-center">
          <MaterialCommunityIcons name="scale-bathroom" size={40} color="#3c5a64" />
        </View>
        <View className="absolute bottom-1/3 right-1/4 items-center">
          <MaterialCommunityIcons name="bowl-mix" size={44} color="#3c5a64" />
        </View>
        <View className="absolute top-2/3 right-1/3 items-center">
          <MaterialCommunityIcons name="spray-bottle" size={48} color="#3c5a64" />
        </View>
        <View className="absolute bottom-24 right-1/3 items-center">
          <MaterialCommunityIcons name="bag-personal" size={40} color="#3c5a64" />
        </View>
        <View className="absolute top-1/4 right-1/4 items-center">
          <MaterialCommunityIcons name="cart" size={44} color="#3c5a64" />
        </View>
      </View>

      {/* Logo Section */}
      <View className="mb-12 items-center">
        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }}
        >
          {/* Logo Background */}
          <View className="h-24 w-24 items-center justify-center rounded-2xl bg-primary shadow-lg"
            style={{
              shadowColor: "#3c5a64",
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
            }}
          >
            <MaterialCommunityIcons
              name="storefront"
              size={56}
              color="#ffffff"
            />
          </View>
        </Animated.View>

        {/* Brand Name */}
        <View className="mt-6 items-center">
          <Text className="text-3xl font-bold text-primary">
            sKirana
          </Text>
          <Text className="mt-1 text-sm font-medium text-muted-foreground">
            Your local shop, on your phone
          </Text>
        </View>
      </View>

      {/* Loading Section */}
      <View className="w-full max-w-xs items-center">
        <View className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
          <Animated.View
            className="h-full rounded-full bg-primary"
            style={{ width: fillWidth }}
          />
        </View>

        <Text className="mt-4 text-sm font-semibold text-foreground">
          Loading {Math.round(progress)}%
        </Text>
      </View>
    </View>
  );
}
