import { DataTypes, Model } from 'sequelize'
import { sequelize } from '#server/db'
import {
  ChecklistAnswer as ChecklistAnswerModel,
  ChecklistAnswerCreateFields,
  GeneralChecklistItem,
} from '../../types'

export class ChecklistAnswer
  extends Model<ChecklistAnswerModel, ChecklistAnswerCreateFields>
  implements ChecklistAnswerModel
{
  declare id: string
  declare checklistId: string
  declare userId: string
  declare answers: GeneralChecklistItem[]
  declare createdAt: Date
  declare updatedAt: Date
}

ChecklistAnswer.init(
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
    },
    checklistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'checklists',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    answers: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'ChecklistAnswer',
    tableName: 'checklist_answers',
    timestamps: true,
  }
)
