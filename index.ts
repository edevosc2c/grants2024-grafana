import { Cron } from "croner";

import { sequelizeInstance } from "./lib/sequelizeInstance.ts";
import { getBusLocationDb } from "./lib/busLocationDbGet.ts";
import { getStopBusLastSeenDb } from "./lib/stopBusLastSeenDbGet.ts";
//import { getBusTrackingDb } from "./lib/busTrackingDbGet.ts";

import { insertbusLocation } from "./lib/busLocationInsert.ts";
import { busLinesCache } from "./lib/busLinesCache.ts";

console.log("[INFO] Configuring PostgreSQL.");

const sequelize = await sequelizeInstance();
const busLocationDb = await getBusLocationDb(sequelize);
const stopBusLastSeenDb = await getStopBusLastSeenDb(sequelize);
//const busTrackingDb = await getBusTrackingDb(sequelize);
const kvBus = await Deno.openKv("./db.sqlite3");

await busLinesCache(kvBus);

await insertbusLocation(busLocationDb, stopBusLastSeenDb, kvBus);

new Cron('0/20 * 5-23 * * *', { timezone: 'Europe/Paris' }, async () => {
    await insertbusLocation(busLocationDb, stopBusLastSeenDb, kvBus);
});

// specific case for midnight
new Cron('0/20 0-20 0 * * *', { timezone: 'Europe/Paris' }, async () => {
    await insertbusLocation(busLocationDb, stopBusLastSeenDb, kvBus);
});

new Cron('0 0 4 * * *', { timezone: 'Europe/Paris' }, async () => {
    try {
        await busLinesCache(kvBus);
    } catch (error) {
        console.log(error);
    }
});
