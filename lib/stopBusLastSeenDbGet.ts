import Sequelize from "sequelize";

export async function getStopBusLastSeenDb(sequelize: Sequelize.Sequelize): Promise<Sequelize.ModelCtor<Sequelize.Model<any, any>>> {
    const stopBusLastSeenDb = sequelize.define(
        "stopbuslastseen",
        {
            time: {
                type: Sequelize.DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.DataTypes.NOW,
            },
            stopname: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false
            },
            line: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            direction: {
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
            }
        },
        {
            freezeTableName: true,
        },
    );
    
    await stopBusLastSeenDb.sync({ alter: true });

    return stopBusLastSeenDb;
}