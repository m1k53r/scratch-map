import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export function useResume(onResume: () => void) {
  const appState = useRef(AppState.currentState);
  const resumeRef = useRef(onResume);

  /// Update the callback function whenever onResume changes
  useEffect(() => {
    resumeRef.current = onResume;
  }, [onResume]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        resumeRef.current();
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);
}
