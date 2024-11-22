import { default as IS } from "@unixfox/instant-system";
import { LineV3 } from "https://jsr.io/@unixfox/instant-system/0.0.10/src/model/v3/line.ts";
import { StopArea } from "https://jsr.io/@unixfox/instant-system/0.0.10/src/model/v3/stopArea.ts";

interface Terminuses {
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

const busLinesExtended = busLines
    .filter((line) => line.operatorId == "SYNCHRO" && line.mode == "BUS")
    .map((line) => {
        const allTerminusMatched =
            /^(?<return1>[A-Z ]+)(?: \/ (?<return2>[A-Z ]+))? > (?<outward>[A-Z ]+)$/
                .exec(line.lName);
        if (allTerminusMatched != null && allTerminusMatched.groups != null) {
            return Object.assign(line, {
                terminuses: {
                    return: [
                        allTerminusMatched.groups["return1"],
                        allTerminusMatched.groups["return2"],
                    ],
                    outward: allTerminusMatched.groups["outward"],
                },
            });
        } else {
            return line;
        }
    });

for (const line of busLinesExtended) {
    console.log(line.id);
    console.log(line.terminuses);
}
