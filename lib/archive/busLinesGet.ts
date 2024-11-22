import { default as IS } from "@unixfox/instant-system";
import { LineV3 } from "https://jsr.io/@unixfox/instant-system/0.0.11/src/model/v3/line.ts";

interface Terminuses {
    return: string[];
    outward: string[];
}

export interface LineV3Extended extends LineV3 {
    terminuses: Terminuses;
}

export async function getbusLines(): Promise<LineV3Extended[]> {
    const busLines = (await IS.getLinesV3(3)).lines;

    const busLinesExtended = busLines
        .filter((line) => line.operatorId == "SYNCHRO" && line.mode == "BUS")
        .map((line) => {
            const allTerminusMatched =
                /^(?<return1>[A-Z ]+)(?: \/ (?<return2>[A-Z ]+))? > (?<outward1>[A-Z ]+)$/
                    .exec(line.lName);
            if (
                allTerminusMatched != null && allTerminusMatched.groups != null
            ) {
                return Object.assign(line, {
                    terminuses: {
                        return: [
                            allTerminusMatched.groups["return1"],
                            allTerminusMatched.groups["return2"],
                        ],
                        outward: [
                            allTerminusMatched.groups["outward1"]
                        ],
                    },
                });
            } else {
                return line;
            }
        }) as LineV3Extended[];

    return busLinesExtended;
}
