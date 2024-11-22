import "jsr:@std/dotenv/load";

const resp = await fetch(Deno.env.get("GRAPHITE_ENDPOINT") + "/metrics", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GRAPHITE_USERNAME")}:${Deno.env.get("GRAPHITE_PASSWORD")}`,
        'Accept': 'application/json, text/plain, */*'
    },
    body: JSON.stringify([{
        "name": "test.metric",
        "interval": 10,
        "value": 12.345,
        "time": 1726754350
    }]),
})

console.log(await resp.text())