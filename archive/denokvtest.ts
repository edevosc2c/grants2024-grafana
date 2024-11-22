const kv = await Deno.openKv();

const prefs = {
    username: "ada",
    theme: "dark",
    language: "en-US",
};

await kv.set(["preferences", "ada"], prefs);

const entries = kv.list({ prefix: ["preferences"] });
for await (const myentry of entries) {
    console.log(myentry.key[1]);
}