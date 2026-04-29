import Lobby from "@/types/lobby";
import { useEffect, useState } from "react";

/*

*/
export function useLobby() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [lobby, setLobby] = useState<Lobby | null>(null);
}
