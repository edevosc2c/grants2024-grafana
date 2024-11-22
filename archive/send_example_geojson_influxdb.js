import "jsr:@std/dotenv/load";
import { InfluxDB, Point } from 'npm:@influxdata/influxdb-client'

/** Environment variables **/
const url = Deno.env.get("INFLUX_URL")
const token = Deno.env.get("INFLUX_TOKEN")
const org = Deno.env.get("INFLUX_ORG")
const bucket = Deno.env.get("INFLUX_BUCKET")

/**
 * Instantiate the InfluxDB client
 * with a configuration object.
 **/
const influxDB = new InfluxDB({ url, token })

/**
 * Create a write client from the getWriteApi method.
 * Provide your `org` and `bucket`.
 **/
const writeApi = influxDB.getWriteApi(org, bucket)

/**
 * Create a point and write it to the buffer.
 **/
const point1 = new Point('buslocation')
    .tag('direction', 'u0h5tsq20')
    .tag('line', 'a')
    .stringField("geohash", "u0h5tsq20")
console.log(` ${point1}`)

writeApi.writePoint(point1)

/**
 * Flush pending writes and close writeApi.
 **/
writeApi.close().then(() => {
    console.log('WRITE FINISHED')
})
