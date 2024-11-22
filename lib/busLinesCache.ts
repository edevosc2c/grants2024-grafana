import { default as IS } from "@unixfox/instant-system";
import { LineV3 } from "https://raw.githubusercontent.com/unixfox/instant-system.js/refs/heads/add-new-endpoints/src/model/v3/line.ts";
import { StopArea } from "https://raw.githubusercontent.com/unixfox/instant-system.js/refs/heads/add-new-endpoints/src/model/v3/stopArea.ts";

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

export async function busLinesCache(kvBus: Deno.Kv) {
    // find if all the bus lines are cached or not
    const kvBusLines = kvBus.list<BusLine>({ prefix: ["busLines"] }, {
        limit: 1,
    });
    const cachedBusLines = [];
    for await (const res of kvBusLines) cachedBusLines.push(res);

    if (cachedBusLines.length == 0) {
        console.log("[INFO] Caching all the bus lines, don't close.");
        let iSGetLines;
        try {
            iSGetLines = await IS.getLinesV3(3);
        } catch (_) {
            setInterval(
                busLinesCache,
                10 * 60 * 1000,
                kvBus,
            );
            throw ("Unable to get bus lines, exiting and trying again in 10 minutes.");
        }
        const busLines = iSGetLines.lines;

        if (busLines.length == 0) {
            throw ("No bus lines given, exiting and trying again in 10 minutes.");
        }

        for (const busLineFetched of busLines) {
            if (
                busLineFetched.operatorId == "SYNCHRO" &&
                busLineFetched.mode == "BUS"
            ) {
                const busLine = {
                    busStops: {},
                    terminuses: {
                        "outward": [],
                        "return": [],
                    },
                } as unknown as BusLine;
                Object.assign(busLine, busLineFetched);
                let stopAreas;
                try {
                    stopAreas =
                        (await IS.getLineStopAreasV3(3, busLine.id)).stopAreas;
                } catch (_) {
                    setInterval(
                        busLinesCache,
                        10 * 60 * 1000,
                        kvBus,
                    );
                    throw (`Unable to get stop area for line ${busLine.id}, exiting and trying again in 10 minutes.`);
                }
                for await (const stopArea of stopAreas) {
                    busLine.busStops[stopArea.id] = stopArea;
                    let stopAreaDirections;
                    try {
                        stopAreaDirections =
                            (await IS.getLineStopAreaSchedulesV3(
                                3,
                                busLine.id,
                                stopArea.id,
                            )).stopAreas[0].lines[0].directions;
                    } catch (_) {
                        setInterval(
                            busLinesCache,
                            10 * 60 * 1000,
                            kvBus,
                        );
                        throw (`Unable to get stop area directions for line ${busLine.id}, exiting and trying again in 10 minutes.`);
                    }
                    for await (const stopAreaDirection of stopAreaDirections) {
                        if (stopAreaDirection.isTerminus) {
                            switch (stopAreaDirection.direction.direction) {
                                case "OUTWARD":
                                    busLine.terminuses.outward
                                        .push(stopArea.id);
                                    break;
                                case "RETURN":
                                    busLine.terminuses.return
                                        .push(stopArea.id);
                                    break;
                            }
                        }
                    }
                }
                await kvBus.set(["busLines", busLine.id], busLine, {
                    expireIn: 1000 * 60 * 60 * 24 * 7, // keep cache only for 7 days
                });
            }
        }
        console.log("[INFO] Done caching all the bus lines.");
    } else {
        console.log("[INFO] Already cached all the bus lines.");
    }
}
