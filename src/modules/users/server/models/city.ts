import { DataTypes, Model, CreationOptional, Op } from 'sequelize'
import { sequelize } from '#server/db'
import { City as CityModel, CityPublic } from '../../types'

type UserCreateFields = Partial<CityModel>

export class City extends Model<CityModel, UserCreateFields> implements CityModel {
  declare id: CreationOptional<string>
  declare name: string
  declare asciiName: string
  declare altNames: string[]
  declare countryCode: string
  declare timezone: string
  declare coordinates: [number, number]

  usePublicView(): CityPublic {
    return {
      id: this.id,
      name: this.name,
      coordinates: this.coordinates,
      timezone: this.timezone
    }
  }
}

City.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    asciiName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    altNames: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    coordinates: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: false,
      defaultValue: [0, 0]
    },
  },
  {
    sequelize,
    modelName: 'City',
    tableName: 'cities',
    timestamps: false,
  }
)
