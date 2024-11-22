import Sequelize from "sequelize";

export async function getBusTrackingDb(sequelize: Sequelize.Sequelize): Promise<Sequelize.ModelCtor<Sequelize.Model<any, any>>> {
    const busTrackingDb = sequelize.define(
        "bustracking",
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
            line: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            origin: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            direction: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            starttime: {
                type: Sequelize.DataTypes.DATE,
                allowNull: false
            },
            arrivaltime: {
                type: Sequelize.DataTypes.DATE,
                allowNull: true,
            }
        },
        {
            freezeTableName: true,
        },
    );
    
    await busTrackingDb.sync({ alter: true });

    return busTrackingDb;
}