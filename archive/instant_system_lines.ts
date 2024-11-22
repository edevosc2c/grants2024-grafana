import { default as IS } from "@unixfox/instant-system";
import { LineV3 } from "https://jsr.io/@unixfox/instant-system/0.0.12/src/model/v3/line.ts";
import { StopArea } from "https://jsr.io/@unixfox/instant-system/0.0.12/src/model/v3/stopArea.ts";

export interface Terminuses {
    return: string[];
    outward: string[];
}

export interface BusStops {
    [key: string]: StopArea;
}

export interface BusLine extends LineV3 {
    terminuses: Terminuses;
    busStops: BusStops;
}

export interface BusLines {
    [key: string]: BusLine;
}

const busLines = (await IS.getLinesV3(3)).lines;

const busLinesExtended: BusLines = {};

for await (const busLine of busLines) {
    if (busLine.operatorId == "SYNCHRO" && busLine.mode == "BUS") {
        busLinesExtended[busLine.id] = busLine as BusLine;
        busLinesExtended[busLine.id].busStops = {};
        busLinesExtended[busLine.id].terminuses = {
            "outward": [],
            "return": [],
        };
        const stopAreas =
            (await IS.getLineStopAreasV3(3, busLine.id)).stopAreas;
        for await (const stopArea of stopAreas) {
            busLinesExtended[busLine.id].busStops[stopArea.id] = stopArea;
            const stopAreaDirections = (await IS.getLineStopAreaSchedulesV3(
                3,
                busLine.id,
                stopArea.id,
            )).stopAreas[0].lines[0].directions;
            for await (const stopAreaDirection of stopAreaDirections) {
                if (stopAreaDirection.isTerminus) {
                    switch (stopAreaDirection.direction.direction) {
                        case "OUTWARD":
                            busLinesExtended[busLine.id].terminuses.outward
                                .push(stopArea.id);
                            break;
                        case "RETURN":
                            busLinesExtended[busLine.id].terminuses.return
                                .push(stopArea.id);
                            break;
                    }
                }
            }
        }
    }
}

await Deno.writeTextFile("mydata.json", JSON.stringify(busLinesExtended));

//const busLinesExtended = busLines
//    .filter((line) => line.operatorId == "SYNCHRO" && line.mode == "BUS");

// for await (const busLine of busLinesExtended) {
//     IS.getLineStopAreasV3(3, busLine.id);

// }

// for (const line of busLinesExtended) {
//     console.log(line.id);
//     console.log(line.terminuses);
// }
