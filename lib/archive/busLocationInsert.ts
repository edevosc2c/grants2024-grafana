import { default as IS } from "@unixfox/instant-system";
import KDBush from "kdbush";
import * as geokdbush from "geokdbush";
import Sequelize, { Op } from "sequelize";
import { BusLine } from "./busLinesCache.ts";

interface BusLocation {
    busId: string;
    latitude: number;
    longitude: number;
    line: string;
    direction: "RETURN" | "OUTWARD";
}

export async function insertbusLocation(
    busLocationDb: Sequelize.ModelCtor<Sequelize.Model<any, any>>,
    stopBusLastSeenDb: Sequelize.ModelCtor<Sequelize.Model<any, any>>,
    busTrackingDb: Sequelize.ModelCtor<Sequelize.Model<any, any>>,
) {
    const allBusesLocation: BusLocation[] = [];
    const kv = await Deno.openKv();

    for await (const busLineKv of kv.list<BusLine>({ prefix: ["busLines"] })) {
        const busLine = busLineKv.value;
        const lineBusesLocation =
            (await IS.getVehicleJourneysDirectionsV3(3, busLineKv.key[1] as string))
                .vehicleJourneys;
        if (lineBusesLocation.return) {
            for (const busLocation of lineBusesLocation.return) {
                allBusesLocation.push({
                    busId: busLocation.id,
                    latitude: busLocation.lat,
                    longitude: busLocation.lon,
                    line: busLine.sName,
                    direction: "RETURN",
                });
            }
        }
        if (lineBusesLocation.outward) {
            for (const busLocation of lineBusesLocation.outward) {
                allBusesLocation.push({
                    busId: busLocation.id,
                    latitude: busLocation.lat,
                    longitude: busLocation.lon,
                    line: busLine.sName,
                    direction: "OUTWARD",
                });
            }
        }

        
    }

    // @ts-ignore To fix
    busLocationDb.bulkCreate(allBusesLocation);

    const index = new KDBush(allBusesLocation.length);

    for (const busLocation of allBusesLocation) {
        index.add(busLocation.longitude, busLocation.latitude);
    }

    await index.finish();

    for (const [_, value] of Object.entries(allBusStop)) {
        const nearestIds: number[] = await geokdbush.around(
            index,
            value.lon,
            value.lat,
            undefined,
            0.03,
        );
        if (nearestIds.length > 0) {
            for (
                const busFound of nearestIds.map((id) => allBusesLocation[id])
            ) {
                if (value.lines.includes(busFound.line)) {
                    const stopNameNormalized = value.name.normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "").toUpperCase();
                    console.log(
                        `busstop: ${stopNameNormalized} - direction: ${busFound.direction} - busline: ${busFound.line}`,
                    );
                    let busAtTerminus = false;
                    let busAtOrigin = false;
                    const busLineExtended = (busLines.filter((line) =>
                        line.id == busFound.line
                    ))[0];
                    if (busFound.direction == "RETURN") {
                        if (
                            busLineExtended.terminuses.outward.includes(
                                stopNameNormalized,
                            )
                        ) {
                            busAtOrigin = true;
                        } else if (
                            busLineExtended.terminuses.return.includes(
                                stopNameNormalized,
                            )
                        ) {
                            busAtTerminus = true;
                        }
                    } else if (busFound.direction == "OUTWARD") {
                        if (
                            busLineExtended.terminuses.return.includes(
                                stopNameNormalized,
                            )
                        ) {
                            busAtOrigin = true;
                        } else if (
                            busLineExtended.terminuses.outward.includes(
                                stopNameNormalized,
                            )
                        ) {
                            busAtTerminus = true;
                        }
                    }

                    console.log(
                        `busAtOrigin: ${busAtOrigin} - busAtTerminus: ${busAtTerminus}`,
                    );

                    if (busAtOrigin) {
                        const [createdBusTracking] = await busTrackingDb
                            .findOrCreate({
                                where: {
                                    busId: busFound.busId,
                                    direction: busFound.direction,
                                    // sometimes bus stay at the starting bus stop for a lot of minutes
                                    // also accounts if the line has MULTIPLE starting bus stop
                                    starttime: {
                                        [Op.gte]: Sequelize.literal(
                                            "NOW() - INTERVAL '30m'",
                                        ),
                                    },
                                    arrivaltime: null,
                                },
                                limit: 1,
                                order: [["createdAt", "DESC"]],
                                defaults: {
                                    busId: busFound.busId,
                                    line: busFound.line,
                                    origin: stopNameNormalized,
                                    direction: busFound.direction,
                                    starttime: new Date().getTime(),
                                },
                            });
                        // sometimes bus stay at the starting point for a lot of minutes
                        // so we update their starttime as long as they are on the SAME starting bus stop
                        if (
                            !createdBusTracking.isNewRecord &&
                            createdBusTracking.getDataValue("origin") ==
                                stopNameNormalized
                        ) {
                            console.log(
                                "bus tracking was already created but updating starting time",
                            );
                            await createdBusTracking
                                .update(
                                    {
                                        time: new Date().getTime(),
                                        starttime: new Date().getTime(),
                                    },
                                );
                            await createdBusTracking.save();
                        }
                    }

                    if (busAtTerminus) {
                        const busTracked = await busTrackingDb
                            .findOne({
                                where: {
                                    busId: busFound.busId,
                                    direction: busFound.direction,
                                    arrivaltime: null,
                                    // safe guard against tracked bus that never got arrivaltime tracked
                                    // we don't want to set the arrival time to a very old bus tracked
                                    starttime: {
                                        [Op.gte]: Sequelize.literal(
                                            "NOW() - INTERVAL '4h'",
                                        ),
                                    },
                                },
                                order: [["createdAt", "DESC"]],
                            });
                        if (busTracked != null) {
                            await busTracked
                                .update(
                                    {
                                        time: new Date().getTime(),
                                        arrivaltime: busAtTerminus
                                            ? new Date().getTime()
                                            : undefined,
                                    },
                                );
                            await busTracked.save();
                        }
                    }

                    const [createdStopBusLastSeen] = await stopBusLastSeenDb
                        .findOrCreate({
                            where: {
                                stopname: stopNameNormalized,
                            },
                            defaults: {
                                stopname: stopNameNormalized,
                                latitude: value.lat,
                                longitude: value.lon,
                            },
                        });
                    if (!createdStopBusLastSeen.isNewRecord) {
                        await stopBusLastSeenDb.update({
                            time: new Date().getTime(),
                        }, {
                            where: { stopname: stopNameNormalized },
                        });
                    }
                }
            }
        }
    }
}
