import { cn } from '#client/utils/index'
import * as React from 'react'

interface ProgressBarProps {
  progress: number
  activateAnimation?: boolean
  animationTime?: number
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  activateAnimation = false,
  animationTime = 2000,
  className,
}) => {
  const [showAnimation, setShowAnimation] = React.useState(false)
  const [barProgress, setBarProgress] = React.useState(progress)

  const commonStyle = 'h-3 rounded-full'
  const barStyle = cn(
    `bg-accents-pink transition-width duration-500`,
    commonStyle,
    showAnimation ? 'progress-infinite' : ''
  )
  const container = cn(
    'w-full bg-pink-100 ',
    commonStyle,
    showAnimation ? 'progress-infinite' : '',
    className
  )

  React.useEffect(() => {
    if (progress === 100 && activateAnimation) {
      setShowAnimation(true)
      setTimeout(() => setShowAnimation(false), animationTime)
    }
    setBarProgress(progress)
  }, [progress])

  return (
    <div className={container}>
      <div className={barStyle} style={{ width: `${barProgress}%` }}></div>
    </div>
  )
}
