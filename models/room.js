module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define(
    "Room",
    {
      name: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      abandonedAt: DataTypes.DATE,
    },
    {
      indexes: [
        {
          unique: false,
          fields: ["abandonedAt"],
        },
      ],
    }
  )
  Room.associate = function (models) {
    // associations can be defined here
  }
  return Room
}
