import { DataTypes, Model, CreationOptional } from 'sequelize'
import { sequelize } from '#server/db'
import {
  Checklist as ChecklistModel,
  ChecklistCreateFields,
} from '../../types'

export class Checklist
  extends Model<ChecklistModel, ChecklistCreateFields>
  implements ChecklistModel
{
  declare id: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare title: ChecklistModel['title']
  declare type: ChecklistModel['type']
  declare userIds: ChecklistModel['userIds']
  declare items: ChecklistModel['items']
  declare visibility: ChecklistModel['visibility']
  declare allowedRoles: ChecklistModel['allowedRoles']
  declare joinedDate: ChecklistModel['joinedDate']
  declare offices: ChecklistModel['offices']
}

Checklist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    items: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    visibility: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    offices: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    allowedRoles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    joinedDate: DataTypes.DATE,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Checklist',
    tableName: 'checklists',
    timestamps: true,
  }
)
