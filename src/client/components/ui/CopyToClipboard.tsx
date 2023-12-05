import React, { useRef } from 'react'
import { Icons } from './Icons'
import { showNotification } from './Notifications'

export const CopyToClipboard: React.FC<{ text: string }> = ({ text }) => {
  const clipboardRef = useRef<HTMLInputElement>(null)

  const handleCopy = async () => {
    if (clipboardRef.current) {
      try {
        await navigator.clipboard.writeText(text)
        showNotification('Copied to clipboard', 'success')
      } catch (error) {
        console.error('Failed to copy text:', error)
        showNotification('Failed to copy', 'error')
      }
    }
  }

  return (
    <div>
      <input
        type="text"
        value={text}
        readOnly
        ref={clipboardRef}
        className="hidden"
      />
      <button
        onClick={handleCopy}
        className="hover:opacity-80 text-white font-bold px-4 rounded"
      >
        <Icons.Copy />
      </button>
    </div>
  )
}
