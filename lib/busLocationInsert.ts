import { default as IS } from "@unixfox/instant-system";
import KDBush from "kdbush";
import * as geokdbush from "geokdbush";
import Sequelize from "sequelize";
import { BusLine } from "./busLinesCache.ts";

interface BusLocation {
    busId: string;
    latitude: number;
    longitude: number;
    line: string;
    lineId: string;
    direction: "RETURN" | "OUTWARD";
}

export async function insertbusLocation(
    busLocationDb: Sequelize.ModelCtor<Sequelize.Model<any, any>>,
    stopBusLastSeenDb: Sequelize.ModelCtor<Sequelize.Model<any, any>>,
    kvBus: Deno.Kv
) {

    for await (const busLineKv of kvBus.list<BusLine>({ prefix: ["busLines"] })) {
        const busLine = busLineKv.value;
        const lineBusesLocation: BusLocation[] = [];

        let lineBusesLocationFetch;
        try {
            lineBusesLocationFetch = (await IS.getVehicleJourneysDirectionsV3(
                3,
                busLineKv.key[1] as string,
                false
            ))
                .vehicleJourneys;
        } catch (_) {
            console.log("Unable to get vehicle journey. Exiting.")
            return;
        }

        if (lineBusesLocationFetch.return) {
            for (const busLocation of lineBusesLocationFetch.return) {
                lineBusesLocation.push({
                    busId: busLocation.id,
                    latitude: busLocation.lat,
                    longitude: busLocation.lon,
                    line: busLine.sName,
                    lineId: busLine.id,
                    direction: "RETURN",
                });
            }
        }
        if (lineBusesLocationFetch.outward) {
            for (const busLocation of lineBusesLocationFetch.outward) {
                lineBusesLocation.push({
                    busId: busLocation.id,
                    latitude: busLocation.lat,
                    longitude: busLocation.lon,
                    line: busLine.sName,
                    lineId: busLine.id,
                    direction: "OUTWARD",
                });
            }
        }

        // @ts-ignore To fix
        busLocationDb.bulkCreate(lineBusesLocation);

        const index = new KDBush(lineBusesLocation.length);
        for (const busLocation of lineBusesLocation) {
            index.add(busLocation.longitude, busLocation.latitude);
        }
        await index.finish();

        for (const [_, busStop] of Object.entries(busLine.busStops)) {
            const nearestIds: number[] = await geokdbush.around(
                index,
                busStop.lon,
                busStop.lat,
                undefined,
                0.03,
            );
            if (nearestIds.length > 0) {
                for (
                    const busFound of nearestIds.map((id) =>
                        lineBusesLocation[id]
                    )
                ) {
                    if (busLine.id == busFound.lineId) {
                        const [createdStopBusLastSeen] = await stopBusLastSeenDb
                            .findOrCreate({
                                where: {
                                    stopname: busStop.name,
                                    line: busLine.id,
                                    direction: busFound.direction
                                },
                                defaults: {
                                    stopname: busStop.name,
                                    line: busLine.id,
                                    direction: busFound.direction,
                                    latitude: busStop.lat,
                                    longitude: busStop.lon,
                                },
                            });
                        if (!createdStopBusLastSeen.isNewRecord) {
                            await createdStopBusLastSeen.update({
                                time: new Date().getTime(),
                            });
                        }
                    }
                }
            }
        }
    }
}
