import { Event } from './event'
import { EventApplication } from './event-application'

export { Event } from './event'
export { EventApplication } from './event-application'
export { EventCheckmark } from './event-checkmark'
export { EventChecklistReminderJob } from './event-checklist-reminder-job'

Event.hasMany(EventApplication, {
  foreignKey: 'eventId',
  as: 'applications',
})

EventApplication.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event',
})
