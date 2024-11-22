import { default as IS } from "@unixfox/instant-system";
import KDBush from "kdbush";
import * as geokdbush from "geokdbush";
import { StopArea } from "https://jsr.io/@unixfox/instant-system/0.0.10/src/model/v3/stopArea.ts";

const index = new KDBush(1);

index.add(5.919822516453113, 45.570352870798);

index.finish();

const lines = (await IS.getLinesV3(3)).lines;

interface StopAreaDetails {
    name: string;
    lon: number;
    lat: number;
    city: string;
    lines: string[];
}

interface StopAreaReduced {
    [key: string]: StopAreaDetails;
}

const allStopAreas: StopAreaReduced = {};

for (const line of lines) {
    if (line.operatorId === "SYNCHRO") {
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
}

// const stopAreasCombiningResult = allStopAreas
//     .filter(stopArea => stopArea.modes[0] == "BUS")
//     .reduce((acc, { id, name, lines, lon, lat }) => {
//         acc[id] ??= { id: id, name: name, lines: [], lon: lon, lat: lat };
//         if (Array.isArray(lines)) { // if it's array type then concat
//             acc[id].lines = acc[id].lines.concat(lines);
//         } else {
//             acc[id].lines.push(lines);
//         }

//         return acc;
//     }, {});

// const stopAreasCombined = Object.values(
//     stopAreasCombiningResult,
// ) as unknown as StopArea[];

for (const [key, value] of Object.entries(allStopAreas)) {
    const nearestIds: number[] = await geokdbush.around(
        index,
        value.lon,
        value.lat,
        undefined,
        0.02,
    );
    if (nearestIds.length > 0) {
        console.log(value);
    }
}

// IS.getNetworkV3(3).then((network) => {
//     console.log(network);
// });
