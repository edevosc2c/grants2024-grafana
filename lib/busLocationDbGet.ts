import Sequelize, { QueryTypes } from "sequelize";

export async function getBusLocationDb(sequelize: Sequelize.Sequelize): Promise<Sequelize.ModelCtor<Sequelize.Model<any, any>>> {
    const busLocationDb = sequelize.define(
        "buslocation",
        {
            time: {
                type: Sequelize.DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.DataTypes.NOW,
            },
            busId: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            latitude: {
                type: Sequelize.DataTypes.DECIMAL,
                allowNull: false,
            },
            longitude: {
                type: Sequelize.DataTypes.DECIMAL,
                allowNull: false,
            },
            line: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            lineId: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            direction: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            freezeTableName: true,
        },
    );
    
    busLocationDb.removeAttribute("id");
    
    await busLocationDb.sync({ alter: true });
    
    const [result] = await sequelize.query(
        `SELECT CASE 
            WHEN EXISTS (SELECT * FROM buslocation LIMIT 1) THEN 1
            ELSE 0 
         END
    `, {
        type: QueryTypes.SELECT,
      }
    );

    // @ts-ignore Safe to ignore
    // if (result.case == 0) {
    //     await sequelize.query(
    //         `SELECT create_hypertable('buslocation', by_range('time'));`,
    //     );
    // }

    return busLocationDb;
}