import React, { useEffect, useState } from 'react'
import { cn } from '#client/utils'
const DISPLAY_DURATION = 6000
const EventKey = 'phq_notification'

type NotificationKind = 'success' | 'warning' | 'error' | 'info'
type Notification = {
  kind: NotificationKind
  text: string
}

export function showNotification(
  text: string,
  kind: NotificationKind = 'info'
): void {
  const notification: Notification = { text, kind }
  const event = new CustomEvent(EventKey, { detail: notification })
  window.dispatchEvent(event)
}

const getStylingClassNames = (kind: NotificationKind): string => {
  switch (kind) {
    case 'info':
      return 'bg-blue-100 text-blue-500 border-blue-500'
    case 'warning':
      return 'bg-yellow-100 text-yellow-500 border-yellow-500'
    case 'error':
      return 'bg-red-100 text-red-500 border-red-500'
    case 'success':
      return 'bg-green-100 text-green-500 border-green-500'
  }
}

export const Notifications: React.FC = () => {
  const [notification, setNotification] = useState<Notification | null>(null)
  const [displayed, setDisplayed] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    window.addEventListener(EventKey, (({ detail }: CustomEvent) => {
      setNotification(detail)
    }) as EventListener)
  }, [])

  useEffect(() => {
    if (notification) {
      setDisplayed(true)
      setTimeout(() => setShown(true), 100)
      setTimeout(() => {
        setShown(false)
        setTimeout(() => {
          setDisplayed(false)
          setNotification(null)
        }, 400)
      }, DISPLAY_DURATION)
    }
  }, [notification, setDisplayed, setShown, setNotification])

  return (
    <div className="phq_notifications">
      {notification && displayed && (
        <div
          className={cn(
            'phq_notifications-item',
            'py-3 px-5 rounded-tiny shadow border',
            shown ? 'phq_shown' : null,
            getStylingClassNames(notification.kind)
          )}
        >
          {notification.text}
        </div>
      )}
    </div>
  )
}
