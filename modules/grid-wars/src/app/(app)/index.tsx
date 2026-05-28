import Mapbox, { FillLayer } from "@rnmapbox/maps";
import { useLocation } from "@/hooks/useLocation";
import { authClient } from "@/lib/auth-client";
import { useResume } from "@/hooks/useResume";
import {
  Toast,
  toast,
  useToastItem,
  useToasts,
  type ToastPosition,
  type ToastT,
} from "@tamagui/toast/v2";
import { View, Button, Text, Input, Image, YStack, XStack } from "tamagui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useRef, useEffect } from "react";
import { set } from "better-auth";
import { Feature, Polygon, Point } from "geojson";
import AntDesign from "@expo/vector-icons/AntDesign";
import { client } from "@/lib/api-client";
import {
  AppState,
  Dimensions,
  Linking,
  Pressable,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/stores/useTheme";
import { useLobby } from "@/stores/useLobby";
import * as turf from "@turf/turf";
import { lobby } from "../../../../api/src/db/schema";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_KEY!);

export default function Index() {
  const { data } = authClient.useSession();
  const [timeLimit, setTimeLimit] = useState("");
  const [membersLimit, setMembersLimit] = useState("");
  const { location, permissionStatus } = useLocation();
  const [formMode, setFormMode] = useState<
    "open" | "closed" | "select_area" | "waiting_for_players"
  >("closed");
  const [lobbyArea, setLobbyArea] = useState<Feature<Polygon> | null>(null);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [myLobby, setMyLobby] = useState("");
  const [lobbyMembers, setLobbyMembers] = useState<string[]>([]);
  const { theme } = useTheme();
  const lobbies = useLobby((state) => state.lobbies);
  const [prevLobbyId, setPrevLobbyId] = useState("");

  useEffect(() => {
    if (!location || !lobbies) return;

    const myLocation: [number, number] = [
      location.coords.longitude,
      location.coords.latitude,
    ];

    for (const lobby of lobbies) {
      const area: Polygon = {
        type: "Polygon",
        coordinates: [lobby.coordinates],
      };
      const inside = turf.booleanPointInPolygon(myLocation, area);

      if (inside && lobby.hostId !== data?.user.id) {
        if (prevLobbyId !== lobby.id) {
          toast("Do you want to join lobby?", {
            description: lobby.id,
          });
          setFormMode("waiting_for_players");
          setLobbyMembers([lobby.hostId, data?.user.id || ""]);

          setPrevLobbyId(lobby.id);
        }
        return;
      }
    }
    setPrevLobbyId("");
    return;
  }, [location, lobbies, prevLobbyId]);

  let createLobby = async () => {
    const closedPolygon = [...points, points[0]];
    const res = await client["create-lobby"].post({
      hostId: data?.user.id!,
      isPublic: false,
      coordinates: closedPolygon,
      membersLimit: Number(membersLimit),
      timeLimit: Number(timeLimit),
    });
    console.log(res.data);

    if (res.data.success) {
      console.log(res.data);
      setMyLobby(res.data.id as string);
      setFormMode("waiting_for_players");
      const initialMembers = await getLobbyMembers();
      const currentUserId = data?.user.id;

      if (currentUserId && !initialMembers.includes(currentUserId)) {
        setLobbyMembers([currentUserId, ...initialMembers]);
      } else {
        setLobbyMembers(initialMembers);
      }

      setTimeLimit(0);
      setMembersLimit(0);
      setPoints([]);
      setLobbyArea(null);
    }
  };

  let deleteLobby = async () => {
    const res = await client["delete-lobby"].post({
      lobbyId: myLobby,
    });
    setFormMode("closed");

    console.log(res.data);
  };

  let leaveLobby = () => {
    // TODO: add endpoint to leave lobby
    // TODO: actually, also remove "delete-lobby" endpoint and make it
    // so that an empty lobby will get removed by the backend.
    // the next person will become the host, when previous host leaves
    setFormMode("closed");
  };

  let startGame = () => {};

  let getLobbyMembers = async () => {
    const res = await client["get-lobby-members"].post({
      lobbyId: myLobby,
    });
    console.log(res.data);
    return (res.data?.members as string[]) ?? [];
  };

  const handleMapPress = (e: any) => {
    if (formMode != "select_area") return;

    const coords = e?.geometry?.coordinates;
    if (!coords) return;

    setPoints((prev) => [...prev, coords]);
  };

  let drawLobbyArea = (e: any) => {
    if (!location?.coords) return;

    setFormMode("select_area");

    const closedPolygon = [...points, points[0]];

    if (points.length >= 3) {
      setLobbyArea({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [closedPolygon],
        },
        properties: {},
      });
    }
  };

  const formatMembers = (memberId) => {
    if (memberId === lobbyMembers[0] && memberId === data.user.id) {
      return `${data?.user.name} (You / Host)`;
    } else if (memberId === lobbyMembers[0]) {
      return `${memberId} (Host)`;
    } else if (memberId === data.user.id) {
      return `${data?.user.name} (You)`;
    } else return memberId;
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
    <Toast position="top-center" theme={theme} visibleToasts={1}>
      <ToastList />
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
          {lobbies.map((lobby) => (
            <Mapbox.ShapeSource
              key={lobby.id}
              id={`lobby-${lobby.id}`}
              shape={{
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [lobby.coordinates],
                },
                properties: {},
              }}
            >
              <FillLayer
                id={`fill-${lobby.id}`}
                style={{
                  fillColor: "red",
                  fillOpacity: 0.4,
                }}
              />
            </Mapbox.ShapeSource>
          ))}
          {location && (
            <Mapbox.MarkerView
              coordinate={[location.coords.longitude, location.coords.latitude]}
              style={{ display: "flex" }}
            >
              <Pressable style={styles.markerBox}>
                {data?.user.image && (
                  <Image src={data.user.image} style={styles.avatar}></Image>
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
        {formMode === "open" && (
          <View
            style={styles.lobbyForm}
            backgroundColor={theme === "dark" ? "black" : "white"}
          >
            <Input
              value={timeLimit}
              onChangeText={setTimeLimit}
              backgroundColor={theme === "dark" ? "gray" : "white"}
              placeholder="Time limit"
              width={200}
              margin="$2"
              placeholderTextColor={theme === "dark" ? "white" : "black"}
              keyboardType="numeric"
            />

            <Input
              value={membersLimit}
              onChangeText={setMembersLimit}
              backgroundColor={theme === "dark" ? "gray" : "white"}
              placeholder="Players number"
              width={200}
              margin="$2"
              placeholderTextColor={theme === "dark" ? "white" : "black"}
              keyboardType="numeric"
            />

            <Button
              style={styles.formButton}
              onPress={() => setFormMode("select_area")}
            >
              Select area
            </Button>

            <Button style={styles.formButton} onPress={createLobby}>
              Create Lobby
            </Button>
          </View>
        )}
        {formMode === "waiting_for_players" && (
          <View
            style={styles.lobbyForm}
            backgroundColor={theme === "dark" ? "#121212" : "#f5f5f5"}
          >
            <Text
              fontSize="$6"
              fontWeight="bold"
              marginBottom="$3"
              color={theme === "dark" ? "white" : "black"}
            >
              Lobby: Waiting for players...
            </Text>

            <Text fontSize="$3" color="gray" marginBottom="$4">
              Lobby ID: {myLobby}
            </Text>

            <YStack
              width="100%"
              gap="$2"
              paddingHorizontal="$4"
              style={{ flex: 1, maxHeight: 300 }}
            >
              {!lobbyMembers || lobbyMembers?.length === 0 ? (
                <Text color="gray" textAlign="center" marginVertical="$4">
                  No players inside yet...
                </Text>
              ) : (
                lobbyMembers?.map((memberId, index) => (
                  <XStack
                    key={index}
                    backgroundColor={theme === "dark" ? "#222" : "white"}
                    padding="$3"
                    borderRadius="$4"
                    alignItems="center"
                    gap="$3"
                    elevation="$1"
                  >
                    <Ionicons name="person" size={20} color="red" />
                    <Text
                      color={theme === "dark" ? "white" : "black"}
                      fontWeight="500"
                    >
                      {formatMembers(memberId)}
                    </Text>
                  </XStack>
                ))
              )}
            </YStack>

            {lobbyMembers[0] === data?.user.id && (
              <Button
                theme="red"
                style={styles.formButton}
                marginTop="$4"
                onPress={startGame}
              >
                Start game
              </Button>
            )}

            <Button
              theme="red"
              style={styles.formButton}
              marginTop="$4"
              onPress={
                lobbyMembers[0] === data?.user.id ? deleteLobby : leaveLobby
              }
            >
              {lobbyMembers[0] === data?.user.id
                ? "Close Lobby"
                : "Leave lobby"}
            </Button>
          </View>
        )}

        <Button
          circular
          elevation="$4"
          size="$5"
          style={styles.fab}
          onPress={() => {
            if (formMode === "closed") {
              setFormMode("open");
              return;
            }

            if (formMode === "open") {
              setFormMode("select_area");
              return;
            }

            if (formMode === "select_area") {
              drawLobbyArea(null);
              setFormMode("open");
              return;
            }

            if (formMode === "waiting_for_players") {
              setFormMode("closed");
              return;
            }
          }}
        >
          {formMode === "closed" && (
            <Ionicons
              name="play"
              size={24}
              color={theme === "dark" ? "white" : "black"}
            />
          )}

          {(formMode === "open" || formMode === "waiting_for_players") && (
            <Ionicons
              name="close"
              size={24}
              color={theme === "dark" ? "white" : "black"}
            />
          )}

          {formMode === "select_area" && (
            <Ionicons
              name="checkmark"
              size={24}
              color={theme === "dark" ? "white" : "black"}
            />
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
          <AntDesign
            name="clear"
            size={24}
            color={theme === "dark" ? "white" : "black"}
          />
        </Button>
        <Button
          circular
          elevation="$4"
          size="$5"
          style={styles.fabd}
          onPress={() => {
            deleteLobby();
          }}
        >
          <Ionicons
            name="remove"
            size={24}
            color={theme === "dark" ? "white" : "black"}
          />
        </Button>
      </View>
    </Toast>
  );
}

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
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
  fabd: {
    position: "absolute",
    left: 76,
    bottom: 16,
  },
  lobbyForm: {
    position: "absolute",
    bottom: 80,
    width: "100%",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
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

function ToastList() {
  const { toasts } = useToasts();
  const { theme } = useTheme();
  const { data } = authClient.useSession();

  let joinLobby = async (lobbyId: string) => {
    const res = await client["join-lobby"].post({
      lobbyId: lobbyId,
      joinerId: data?.user.id!,
    });
    console.log(lobbyId);
    console.log(res);
  };

  return (
    <View margin={16}>
      {toasts.map((t, index) => (
        <Toast.Item
          key={t.id}
          toast={t}
          index={index}
          animation="bouncy"
          enterStyle={{
            opacity: 0,
            y: -25,
            scale: 0.9,
          }}
          exitStyle={{
            opacity: 0,
            y: -20,
            scale: 0.95,
          }}
          opacity={1}
          y={0}
          scale={1}
          borderRadius="$6"
          padding="$4"
          borderWidth={1}
          elevation="$6"
          theme={theme}
        >
          <Toast.Title fontWeight="700">{t.title}</Toast.Title>

          {t.description && (
            <Toast.Description>{t.description}</Toast.Description>
          )}
          <View flexDirection="row" gap="$2" width="100%">
            <Button
              backgroundColor="green"
              flex={1}
              onPress={() => {
                const description =
                  typeof t.description === "string" ? t.description : "";
                joinLobby(description);
              }}
            >
              Join
            </Button>
            <Button backgroundColor="red" flex={1}>
              Skip
            </Button>
          </View>
        </Toast.Item>
      ))}
    </View>
  );
}
