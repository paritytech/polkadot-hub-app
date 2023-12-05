import { CreationOptional, DataTypes, Model } from 'sequelize'
import { sequelize } from '#server/db'
import {
  ProfileQuestionAnswer as ProfileQuestionAnswerModel,
} from '../../types'

type WidgetUserCreateFields = Partial<ProfileQuestionAnswerModel>

export class ProfileQuestionAnswer
  extends Model<ProfileQuestionAnswerModel, WidgetUserCreateFields>
  implements ProfileQuestionAnswerModel
{
  declare id: CreationOptional<string>
  declare userId: ProfileQuestionAnswerModel['userId']
  declare answers: ProfileQuestionAnswerModel['answers']
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

ProfileQuestionAnswer.init(
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
    answers: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'ProfileQuestionAnswer',
    tableName: 'profile_questions_answers',
    timestamps: true,
  }
)
