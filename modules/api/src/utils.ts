import bbox from "@turf/bbox";
import { lineString, polygon } from "@turf/helpers";
import pointsWithinPolygon from "@turf/points-within-polygon";
import { randomPoint } from "@turf/random";

export function generateRandomPoints(coordinates: number[][]) {
  const flags = randomPoint(25, {
    bbox: bbox(lineString(coordinates)),
  });

  const inside = pointsWithinPolygon(flags, polygon([coordinates]));

  return inside;
}
