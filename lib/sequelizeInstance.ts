import "dotenv/load";
import Sequelize from "sequelize";
export { default as pg } from "pg";

export async function sequelizeInstance(): Promise<Sequelize.Sequelize> {
    // @ts-ignore Can't solve this issue
    const sequelize = new Sequelize(Deno.env.get("POSTGRES_URI"), {
        dialect: "postgres",
        protocol: "postgres",
        logging: false,
    });

    await sequelize.authenticate().then(() => {
        console.log("[INFO] Connection to PosgreSQL has been established successfully.");
    // deno-lint-ignore no-explicit-any
    }).catch((err: any) => {
        console.error("[ERROR] Unable to connect to the database:", err);
        Deno.exit(1);
    });
    
    return sequelize as Sequelize.Sequelize;
}