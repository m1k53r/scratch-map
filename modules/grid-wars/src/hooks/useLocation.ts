import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { useResume } from "./useResume";

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  const getLocationPermissions = async () => {
    let permissions = await Location.getForegroundPermissionsAsync();

    /// Only ask for permissions if it's either the first time or they weren't granted
    /// but can ask again
    if (
      permissions.status === Location.PermissionStatus.UNDETERMINED ||
      (permissions.status !== Location.PermissionStatus.GRANTED &&
        permissions.canAskAgain)
    ) {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
    } else {
      setPermissionStatus(permissions.status);
    }
  };

  const startPolling = async () => {
    if (subscription.current !== null) return;

    subscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.LocationAccuracy.High,
        distanceInterval: 1,
        timeInterval: 500,
      },
      setLocation,
    );
  };

  /// Get permissions after opening the app
  useEffect(() => {
    getLocationPermissions();
  }, [getLocationPermissions]);

  /// If permission status changed, try polling the location
  useEffect(() => {
    if (permissionStatus === "granted") {
      startPolling();
    } else {
      subscription.current?.remove();
      subscription.current = null;
    }
  }, [permissionStatus, startPolling]);

  useEffect(() => {
    return () => {
      subscription.current?.remove();
    };
  }, []);

  /// Ask for permissions again if application went from background -> active,
  /// because user might've just updated the permissions in app's settings
  useResume(getLocationPermissions);

  return {
    location,
    permissionStatus,
  };
}
