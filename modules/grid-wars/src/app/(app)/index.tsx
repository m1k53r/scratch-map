import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import Mapbox, { FillLayer } from "@rnmapbox/maps";
import { useLocation } from "@/hooks/useLocation";
import { authClient } from "@/lib/auth-client";
import { useResume } from "@/hooks/useResume";
import { View, Button, Text, Input } from "tamagui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useRef } from "react";
import { set } from "better-auth";
import { Feature, Polygon, Point } from "geojson";
import AntDesign from "@expo/vector-icons/AntDesign";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_KEY!);

export default function Index() {
  const { data } = authClient.useSession();
  const { location, permissionStatus } = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [lobbyArea, setLobbyArea] = useState<Feature<Polygon> | null>(null);
  const [points, setPoints] = useState<[number, number][]>([]);

  let openCreateLobbyForm = () => {
    setIsFormOpen((prev) => !prev);
  };

  const handleMapPress = (e: any) => {
    if (!selectMode) return;

    const coords = e?.geometry?.coordinates;
    if (!coords) return;

    setPoints((prev) => [...prev, coords]);
  };

  let drawLobbyArea = (e: any) => {
    if (!location?.coords) return;

    setIsFormOpen(false);

    if (points.length >= 3) {
      setLobbyArea({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [points],
        },
        properties: {},
      });
      setPoints([]);
    }
  };

  if (!location) {
    return (
      <View>
        <Text>Loading location...</Text>
      </View>
    );
  }

  if (permissionStatus === "denied") {
    return (
      <View style={styles.container}>
        <Text>User didn't agree to share location</Text>
        <Button onPress={() => Linking.openSettings()}>Go to settings</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        scaleBarEnabled={false}
        onPress={handleMapPress}
      >
        <Mapbox.Camera
          zoomLevel={15}
          centerCoordinate={[
            location.coords.longitude,
            location.coords.latitude,
          ]}
        />
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
        {points && (
          <Mapbox.ShapeSource
            id="points-source"
            shape={{
              type: "FeatureCollection",
              features: points.map((coords) => ({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: coords,
                },
                properties: {},
              })),
            }}
          >
            <Mapbox.CircleLayer
              id="points-layer"
              style={{
                circleRadius: 6,
                circleColor: "red",
                circleStrokeWidth: 2,
                circleStrokeColor: "white",
              }}
            />
          </Mapbox.ShapeSource>
        )}
        {lobbyArea && (
          <Mapbox.ShapeSource id="source" shape={lobbyArea}>
            <FillLayer
              id="fill"
              style={{
                fillColor: "blue",
                fillOpacity: 0.5,
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
      {isFormOpen ? (
        <View style={styles.lobbyForm}>
          <Input placeholder="Lobby name" width={200} margin="$2" />
          <Input placeholder="Players number" width={200} margin="$2" />
          <Button
            style={styles.formButton}
            onPress={() => {
              setSelectMode(true);
              setIsFormOpen(false);
            }}
          >
            Select area
          </Button>
          <Button style={styles.formButton}>Create Lobby</Button>
        </View>
      ) : null}
      {selectMode && (
        <Button
          onPress={() => {
            drawLobbyArea(null);
            setSelectMode(false);
          }}
          style={{ position: "absolute", top: 35, alignSelf: "center" }}
          circular
        >
          <Ionicons name="checkmark" size={24} color="white" />
        </Button>
      )}
      <Button
        circular
        elevation="$4"
        size="$5"
        style={styles.fab}
        onPress={openCreateLobbyForm}
      >
        {isFormOpen ? (
          <Ionicons name="close" size={24} color="white" />
        ) : (
          <Ionicons name="play" size={24} color="white" />
        )}
      </Button>
      <Button
        circular
        elevation="$4"
        size="$5"
        style={styles.fabl}
        onPress={() => {
          setLobbyArea(null);
          setPoints([]);
        }}
      >
        <AntDesign name="clear" size={24} color="white" />
      </Button>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

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
    right: 16,
    bottom: 16,
  },
  fabl: {
    position: "absolute",
    left: 16,
    bottom: 16,
  },
  lobbyForm: {
    position: "absolute",
    bottom: 80,
    width: "100%",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
    padding: 16,
    borderRadius: 8,
    maxWidth: width - 10,
    minHeight: height - height / 5,
  },
  formButton: {
    margin: 8,
    width: width / 2,
  },
  lobbyArea: {
    backgroundColor: "rgba(255, 0, 0, 0.5)",
  },
});
