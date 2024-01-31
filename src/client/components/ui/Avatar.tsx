import { cn } from '#client/utils'
import React, { useMemo } from 'react'
import { minidenticon } from 'minidenticons'

type AvatarSize = 'big' | 'normal' | 'medium' | 'small'
type Props = {
  src?: string | null
  userId?: string | null
  size?: AvatarSize
  className?: string
}
const SIZE_CLASSNAME: Record<AvatarSize, string> = {
  small: 'w-5 h-5',
  medium: 'w-[32px] h-[32px]',
  normal: 'w-16 h-16',
  big: 'w-[136px] h-[136px]',
}

const SIZE_DIMENSION: Record<AvatarSize, string> = {
  small: '20',
  medium: '32',
  normal: '64',
  big: '136',
}

const MinidenticonImg = ({
  username,
  saturation,
  lightness,
  ...props
}: {
  username: string
  saturation: string
  lightness: string
  width: string
  height: string
}) => {
  const svgURI = useMemo(
    () =>
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(minidenticon(username, saturation, lightness)),
    [username, saturation, lightness]
  )
  return (
    <div className="bg-fill-6 rounded-full">
      <img src={svgURI} alt={username} {...props} />
    </div>
  )
}

export const Avatar: React.FC<Props> = ({
  src = null,
  size = 'normal',
  userId,
  className,
}) => {
  const [hasError, setHasError] = React.useState(false)
  const setError = () => setHasError(true)
  const resultClassName = cn(
    'block rounded-full bg-gray-200',
    SIZE_CLASSNAME[size],
    className
  )

  if (!src && userId) {
    return (
      <div className={className}>
        <MinidenticonImg
          username={userId}
          saturation="70"
          lightness="30"
          width={SIZE_DIMENSION[size]}
          height={SIZE_DIMENSION[size]}
        />
      </div>
    )
  }

  if (!src || hasError) {
    return <div className={cn(resultClassName, 'align-middle')} />
  }

  return <img src={src} className={resultClassName} onError={setError} />
}
