type Listener = () => void

class EventEmitter {
  private events: { [key: string]: Listener[] } = {}

  // No console.log in constructor needed for this version, global log is sufficient
  on(eventName: string, listener: Listener): void {
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }
    this.events[eventName].push(listener)
  }

  off(eventName: string, listenerToRemove: Listener): void {
    if (!this.events[eventName]) {
      return
    }
    this.events[eventName] = this.events[eventName].filter(
      (listener) => listener !== listenerToRemove
    )
  }

  emit(eventName: string): void {
    if (!this.events[eventName]) {
      return
    }
    this.events[eventName].forEach((listener) => listener())
  }
}

// Ensure a true singleton instance, more resilient to HMR
// Use a unique symbol or a less common global property name
const APP_EVENTS_INSTANCE_KEY = '__APP_EVENTS_SINGLETON_INSTANCE__'

if (!(globalThis as any)[APP_EVENTS_INSTANCE_KEY]) {
  ;(globalThis as any)[APP_EVENTS_INSTANCE_KEY] = new EventEmitter()
} else {
}

export const appEvents: EventEmitter = (globalThis as any)[
  APP_EVENTS_INSTANCE_KEY
]
export const GROCERY_LIST_UPDATED_EVENT = 'groceryListUpdated'
