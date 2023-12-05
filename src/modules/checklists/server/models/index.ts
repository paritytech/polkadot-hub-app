import { Checklist } from './checklist'
import { ChecklistAnswer } from './checklist-answer'

Checklist.hasMany(ChecklistAnswer, {
  foreignKey: 'checklistId',
  as: 'answers',
})

ChecklistAnswer.belongsTo(Checklist, {
  foreignKey: 'checklistId',
  as: 'checklist',
})

export { Checklist, ChecklistAnswer }
