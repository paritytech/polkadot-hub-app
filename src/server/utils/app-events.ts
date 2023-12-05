import { EventEmitter } from 'events'

class AppEvents {
  eventEmitters: Record<string, EventEmitter> = {}

  useModule(moduleId: string): EventEmitter {
    if (!this.eventEmitters[moduleId]) {
      this.eventEmitters[moduleId] = new EventEmitter()
    }
    return this.eventEmitters[moduleId]
  }
}

export const appEvents = new AppEvents()
