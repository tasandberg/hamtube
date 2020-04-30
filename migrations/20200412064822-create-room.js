module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
      )
      return Promise.all([
        queryInterface.createTable(
          "Rooms",
          {
            id: {
              allowNull: false,
              primaryKey: true,
              type: Sequelize.UUID,
              defaultValue: Sequelize.literal("uuid_generate_v4()"),
            },
            name: {
              type: Sequelize.STRING,
            },
            createdAt: {
              allowNull: false,
              type: Sequelize.DATE,
            },
            updatedAt: {
              allowNull: false,
              type: Sequelize.DATE,
            },
            abandonedAt: {
              type: Sequelize.DATE,
              allowNull: true,
            },
          },
          { transaction: t }
        ),
        // queryInterface.addIndex("Rooms", "abandonedAt", { transaction: t }),
      ])
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        // queryInterface.removeIndex("Rooms", "abandoned_at", {
        //   transaction: t,
        // }),
        queryInterface.dropTable("Rooms", { transaction: t }),
      ])
    })
  },
}
