import {
  AppState,
  Button,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Mapbox from "@rnmapbox/maps";
import { useLocation } from "@/hooks/useLocation";
import { authClient } from "@/lib/auth-client";
import { useResume } from "@/hooks/useResume";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_KEY!);

export default function Index() {
  const { data } = authClient.useSession();
  const { location, permissionStatus } = useLocation();

  if (permissionStatus === "denied") {
    return (
      <View style={styles.container}>
        <Text>User didn't agree to share location</Text>
        <Button
          title="Go to settings"
          onPress={() => Linking.openSettings()}
        ></Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map} scaleBarEnabled={false}>
        {location && (
          <Mapbox.MarkerView
            coordinate={[location.coords.longitude, location.coords.latitude]}
            style={{ display: "flex" }}
          >
            <Pressable style={styles.markerBox}>
              {data?.user.image && (
                <Image
                  source={{ uri: data.user.image }}
                  style={styles.avatar}
                ></Image>
              )}
            </Pressable>
          </Mapbox.MarkerView>
        )}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  markerBox: {
    flex: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "red",
  },
  avatar: {
    borderRadius: 100,
    width: 32,
    height: 32,
  },
  fab: {
    position: "absolute",
    right: 8,
    bottom: 8,
  },
});
