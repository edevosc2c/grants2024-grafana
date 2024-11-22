import { default as IS } from "@unixfox/instant-system";
import { LineV3Extended } from "../busLinesCache.ts";

export interface StopAreaDetails {
    name: string;
    lon: number;
    lat: number;
    city: string;
    lines: string[];
}

export interface AllStopBusReduced {
    [key: string]: StopAreaDetails;
}

export async function getAllStopBus(busLines: LineV3Extended[]): Promise<AllStopBusReduced> {
    const allStopAreas: AllStopBusReduced = {};
    
    for (const line of busLines) {
        const stopAreas = (await IS.getLineStopAreasV3(3, line.id)).stopAreas;
        for (const stopArea of stopAreas) {
            if (stopArea.modes[0] === "BUS" && stopArea.type === "STOPAREA") {
                if (!allStopAreas[stopArea.id]) {
                    allStopAreas[stopArea.id] = {
                        "name": stopArea.name,
                        "lon": stopArea.lon,
                        "lat": stopArea.lat,
                        "city": stopArea.city,
                        "lines": [line.id],
                    };
                } else {
                    allStopAreas[stopArea.id].lines.push(line.id);
                }
            }
        }
    }

    return allStopAreas;
}
