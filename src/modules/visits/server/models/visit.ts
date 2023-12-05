import { CreationOptional, DataTypes, Model } from 'sequelize'
import { appConfig } from '#server/app-config/index'
import { sequelize } from '#server/db'
import { Visit as VisitModel, VisitStatus } from '../../types'

type VisitCreateFields = Pick<
  VisitModel,
  'userId' | 'officeId' | 'date' | 'areaId' | 'deskId'
> &
  Partial<VisitModel>

export class Visit
  extends Model<VisitModel, VisitCreateFields>
  implements VisitModel
{
  declare id: CreationOptional<string>
  declare userId: string
  declare status: VisitStatus
  declare areaId: string
  declare deskId: string
  declare areaName: string
  declare deskName: string
  declare officeId: string
  declare date: string
  declare metadata: Record<string, any>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

Visit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    areaId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    areaName: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.officeId) return null
        const office = appConfig.getOfficeById(this.officeId)
        if (!office) return null
        const area = (office.areas || []).find((x) => x.id === this.areaId)
        if (!area) return null
        return area.name
      },
    },
    deskId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskName: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.officeId) return null
        const office = appConfig.getOfficeById(this.officeId)
        if (!office) return null
        const area = (office.areas || []).find((x) => x.id === this.areaId)
        if (!area) return null
        const desk = area.desks.find((x) => x.id === this.deskId)
        return desk?.name || null
      },
    },
    officeId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Visit',
    tableName: 'visits',
    timestamps: true,
  }
)
