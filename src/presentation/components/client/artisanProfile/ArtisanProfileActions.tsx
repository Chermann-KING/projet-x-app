import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MessageCircle, Phone, Send, Share2 } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

interface Props {
  onCall: () => void
  onQuote: () => void
  onChat: () => void
  onWhatsApp: () => void
}

export function ArtisanProfileActions({ onCall, onQuote, onChat, onWhatsApp }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable
          onPress={onCall}
          style={[styles.actionBtn, { backgroundColor: theme.muted, borderColor: theme.border }]}
        >
          <Phone size={ds.size.icon.md} color={theme.foreground} />
          <Text style={[styles.actionLabel, { color: theme.foreground }]}>
            {t('client.artisanProfile.contact.call')}
          </Text>
        </Pressable>

        <Pressable
          onPress={onQuote}
          style={[styles.actionBtnPrimary, { backgroundColor: theme.primary }]}
        >
          <Send size={ds.size.icon.md} color={theme.primaryForeground} />
          <Text style={[styles.actionLabelPrimary, { color: theme.primaryForeground }]}>
            {t('client.artisanProfile.contact.requestQuote')}
          </Text>
        </Pressable>

        <Pressable
          onPress={onChat}
          style={[styles.actionBtn, { backgroundColor: theme.muted, borderColor: theme.border }]}
        >
          <MessageCircle size={ds.size.icon.md} color={theme.foreground} />
          <Text style={[styles.actionLabel, { color: theme.foreground }]}>
            {t('client.artisanProfile.contact.chat')}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onWhatsApp}
        style={[styles.whatsappBtn, { backgroundColor: theme.success }]}
      >
        <Share2 size={ds.size.icon.md} color={theme.successForeground} />
        <Text style={[styles.whatsappLabel, { color: theme.successForeground }]}>
          {t('client.artisanProfile.share')}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: ds.space[3], marginTop: ds.space[5] },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: ds.size.paddingH,
    gap: ds.space[3],
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[1],
    height: ds.size.button,
    borderRadius: ds.radius.button,
    borderWidth: 1,
  },
  actionBtnPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[1],
    height: ds.size.button,
    borderRadius: ds.radius.button,
  },
  actionLabel: { ...ds.text.caption, fontWeight: '600' },
  actionLabelPrimary: { ...ds.text.label, fontWeight: '700' },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[2],
    marginHorizontal: ds.size.paddingH,
    height: ds.size.button,
    borderRadius: ds.radius.button,
  },
  whatsappLabel: { ...ds.text.body, fontWeight: '700' },
})
