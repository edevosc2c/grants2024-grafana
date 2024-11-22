import "jsr:@std/dotenv/load";
import Influx from 'npm:influx'

const influx = new Influx.InfluxDB({
    host: '',
    protocol: 'https',
    port: 443,
    //host: "localhost",
    //port: 8083,
    database: "default",
    path: "/api/v1/push/influx",
    options: {
        headers: {
            'Authorization': ``
        }
    },
    schema: [
        {
            measurement: "response_times",
            fields: {
                path: Influx.FieldType.STRING,
                duration: Influx.FieldType.INTEGER,
                duration2: Influx.FieldType.INTEGER
            },
            tags: ["host"]
        },
    ],
});

influx.writePoints([
    {
        measurement: 'response_times',
        tags: { host: "sup" },
        fields: { duration: 1, duration2: 2, path: "/" },
    }
], {precision: "ms"}).catch(err => {
    console.error(`Error saving data to InfluxDB! ${err.stack}`)
})