import Mapbox, { FillLayer } from "@rnmapbox/maps";
import { useLocation } from "@/hooks/useLocation";
import { authClient } from "@/lib/auth-client";
import { Toast, toast } from "@tamagui/toast/v2";
import {
  View,
  Button,
  Text,
  Input,
  Image,
  YStack,
  XStack,
  Spinner,
} from "tamagui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useEffect } from "react";
import { Polygon } from "geojson";
import AntDesign from "@expo/vector-icons/AntDesign";
import { client } from "@/lib/api-client";
import { Dimensions, Linking, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/stores/useTheme";
import { useLobby } from "@/stores/useLobby";
import * as turf from "@turf/turf";
import ToastList from "@/components/ToastList";
import { FormMode } from "@/types/formMode";
import { useSocket } from "@/context/SocketContext";
import { LobbyParameters } from "@/types/lobbyParameters";
import { useCurrentLobby } from "@/hooks/useCurrentLobby";
import {
  CollectFlagBody,
  GameStateChangeBody,
  MessageType,
  PlayerJoinedBody,
  WebSocketCodes,
} from "@gridwars/types";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_KEY!);

export default function Index() {
  const { theme } = useTheme();
  const { data } = authClient.useSession();
  const { location, permissionStatus } = useLocation();
  const socket = useSocket();
  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [params, setParams] = useState<LobbyParameters>({
    timeLimit: 0,
    membersLimit: 0,
    points: [],
    lobbyArea: null,
  });
  const [prevLobbyId, setPrevLobbyId] = useState("");
  const lobbies = useLobby((state) => state.lobbies);
  const setLobbies = useLobby((state) => state.setLobbies);
  const setMyLobby = useLobby((state) => state.setCurrentLobby);
  const addLobby = useLobby((state) => state.addLobby);
  const addMembers = useLobby((state) => state.addMembers);
  const addPoints = useLobby((state) => state.addPoints);
  const myLobby = useCurrentLobby();

  useEffect(() => {
    setLobbies([]);
  }, []);

  useEffect(() => {
    if (!location || !lobbies) return;

    const myLocation: [number, number] = [
      location.coords.longitude,
      location.coords.latitude,
    ];

    for (const lobby of lobbies) {
      // omit rendering all lobbies that are either active or finished
      if (lobby.state !== "waiting") continue;

      const area: Polygon = {
        type: "Polygon",
        coordinates: [lobby.coordinates],
      };
      const inside = turf.booleanPointInPolygon(myLocation, area);

      if (inside && lobby.members[0] !== data?.user.id) {
        if (prevLobbyId !== lobby.id) {
          toast("Do you want to join lobby?", {
            description: lobby.id,
          });
          setPrevLobbyId(lobby.id);
        }
        return;
      }
    }
    setPrevLobbyId("");
  }, [location, lobbies, prevLobbyId]);

  useEffect(() => {
    if (!myLobby || myLobby.state !== "playing" || !location) return;

    for (const flag of myLobby.flags) {
      let d = turf.distance(
        [location.coords.longitude, location.coords.latitude],
        flag,
        { units: "meters" },
      );
      if (d < 10) {
        console.log("collected");
        addPoints(data?.user.id || "");
        const request: MessageType<CollectFlagBody> = {
          code: WebSocketCodes.COLLECT_FLAG,
          body: {
            lobbyId: myLobby.id,
            flagCoordinates: [flag[0], flag[1]],
          },
        };
        socket.ref.current?.send(request);
      }
    }
  }, [location, myLobby]);

  useEffect(() => {
    if (myLobby?.state === "playing") {
      setFormMode("closed");
    }
  }, [myLobby?.state]);

  let createLobby = async () => {
    const closedPolygon = [...params.points, params.points[0]];
    const res = await client["create-lobby"].post({
      isPublic: false,
      coordinates: closedPolygon,
      membersLimit: Number(params.membersLimit),
      timeLimit: Number(params.timeLimit),
    });
    console.log("create lobby");
    console.log(res);

    if (res.data?.success) {
      console.log("uhh data?");
      console.log(res.data);
      const lobbyId = res.data.id as string;
      addLobby({
        id: lobbyId,
        coordinates: closedPolygon,
        members: [data?.user.id as string],
        state: "waiting",
        flags: [],
      });
      setMyLobby(lobbyId);
      console.log(useLobby.getState().currentLobby);
      setFormMode("waiting_for_players");
      // TODO: what is this for?
      // const initialMembers = await getLobbyMembers();
      // const currentUserId = data?.user.id;
      //
      // if (currentUserId && !initialMembers.includes(currentUserId)) {
      //   addMembers([currentUserId, ...initialMembers]);
      // } else {
      //   addMembers(initialMembers);
      // }
      console.log(myLobby);

      setParams(() => ({
        timeLimit: 0,
        membersLimit: 0,
        points: [],
        lobbyArea: null,
      }));
    }
  };

  let deleteLobby = async () => {
    const res = await client["delete-lobby"].post({
      lobbyId: myLobby?.id || "",
    });
    setFormMode("closed");

    console.log(res.data);
  };

  let leaveLobby = () => {
    if (!myLobby) return;

    // TODO: add endpoint to leave lobby
    // TODO: actually, also remove "delete-lobby" endpoint and make it
    // so that an empty lobby will get removed by the backend.
    // the next person will become the host, when previous host leaves
    setFormMode("closed");
    setMyLobby(null);

    const data: MessageType<PlayerJoinedBody> = {
      code: WebSocketCodes.PLAYER_LEFT,
      body: {
        lobbyId: myLobby.id,
      },
    };
    socket.ref.current?.send(data);
  };

  let startGame = () => {
    if (!myLobby) return;

    console.log("starting ");
    setFormMode("closed");

    const data: MessageType<GameStateChangeBody> = {
      code: WebSocketCodes.START_GAME,
      body: {
        lobbyId: myLobby.id,
      },
    };
    console.log(socket.ref.current);
    socket.ref.current?.send(data);
  };

  let getLobbyMembers = async () => {
    const res = await client["get-lobby-members"].post({
      lobbyId: myLobby?.id || "",
    });
    console.log(res.data);
    return (res.data?.members as string[]) ?? [];
  };

  const handleMapPress = (e: any) => {
    if (formMode != "select_area") return;

    const coords = e?.geometry?.coordinates;
    if (!coords) return;

    setParams((prev) => ({
      ...prev,
      points: [...prev.points, coords],
    }));
  };

  let drawLobbyArea = (e: any) => {
    if (!location?.coords) return;

    setFormMode("select_area");

    const closedPolygon = [...params.points, params.points[0]];

    if (params.points.length >= 3) {
      setParams((prev) => ({
        ...prev,
        lobbyArea: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [closedPolygon],
          },
          properties: {},
        },
      }));
    }
  };

  const formatMembers = (memberId: string) => {
    if (!myLobby || !myLobby.id) return;

    if (memberId === myLobby.members[0] && memberId === data?.user.id) {
      return `${data?.user.name} (You / Host)`;
    } else if (memberId === myLobby.members[0]) {
      return `${memberId} (Host)`;
    } else if (memberId === data?.user.id) {
      return `${data?.user.name} (You)`;
    } else return memberId;
  };

  if (!location) {
    return (
      <View>
        <Text>
          <Spinner size="large" />
        </Text>
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
      <ToastList setFormMode={setFormMode} />
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
          {lobbies.map(
            (lobby) =>
              lobby.state !== "finished" && (
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
              ),
          )}
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
          {myLobby &&
            myLobby.state === "playing" &&
            myLobby.flags.map((flag) => (
              <Mapbox.MarkerView coordinate={flag} key={flag}>
                <Text style={{ fontSize: 24 }}>🚩</Text>
              </Mapbox.MarkerView>
            ))}
          {params.points && (
            <Mapbox.ShapeSource
              id="points-source"
              shape={{
                type: "FeatureCollection",
                features: params.points.map((coords) => ({
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
          {params.lobbyArea && (
            <Mapbox.ShapeSource id="source" shape={params.lobbyArea}>
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
              value={params.timeLimit}
              onChangeText={(text) =>
                setParams((prev) => ({ ...prev, timeLimit: Number(text) }))
              }
              backgroundColor={theme === "dark" ? "gray" : "white"}
              placeholder="Time limit"
              width={200}
              margin="$2"
              placeholderTextColor={theme === "dark" ? "white" : "black"}
              keyboardType="numeric"
            />

            <Input
              value={params.membersLimit}
              onChangeText={(text) =>
                setParams((prev) => ({ ...prev, membersLimit: Number(text) }))
              }
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
              Lobby ID: {myLobby?.id}
            </Text>

            <YStack
              width="100%"
              gap="$2"
              paddingHorizontal="$4"
              style={{ flex: 1, maxHeight: 300 }}
            >
              {!myLobby?.members || myLobby.members?.length === 0 ? (
                <Text color="gray" textAlign="center" marginVertical="$4">
                  No players inside yet...
                </Text>
              ) : (
                myLobby.members?.map((memberId, index) => (
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

            {myLobby?.members[0] === data?.user.id && (
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
                myLobby?.members[0] === data?.user.id ? deleteLobby : leaveLobby
              }
            >
              {myLobby?.members[0] === data?.user.id
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
            setParams((prev) => ({
              ...prev,
              points: [],
              lobbyArea: null,
            }));
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
