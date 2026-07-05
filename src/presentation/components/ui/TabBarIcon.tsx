import { useTheme } from '@/presentation/hooks/useTheme'
import { ds } from '@/shared/designSystem'
import { IconBox } from './IconBox'

interface Props {
  children: React.ReactNode
  focused: boolean
}

export function TabBarIcon({ children, focused }: Props) {
  const theme = useTheme()
  return (
    <IconBox
      bg={focused ? theme.errorMuted : 'transparent'}
      width={40}
      height={40}
      radius={ds.radius.button}
    >
      {children}
    </IconBox>
  )
}
