import { DOMParser } from "jsr:@b-fuze/deno-dom";

export async function getAllLines() {
    console.log("fetching the buses lines")
    const getLinesForSynchroNetwork = await fetch("https://start.synchro.grandchambery.fr/fr/lines-and-poi/line-by-subnetwork?subnetwokId=SYNCHRO", {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
        }
    })
    const doc = new DOMParser().parseFromString(await getLinesForSynchroNetwork.text(), "text/html");
    const linesParsed = doc.querySelectorAll("input[class='is-lines is-Checkbox']");
    let busLines = []
    for (const element of linesParsed) {
        const busIdFromHTML = element.getAttribute('id');
        const busId = busIdFromHTML.replace("is-line-", "")
        if (busId.length <= 2) {
            busLines.push(busId)
        }
    }
    return busLines
}