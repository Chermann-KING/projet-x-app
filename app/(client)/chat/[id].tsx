import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import {Phone, Send} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getClientRequests, getConversationMessages, sendMessage, subscribeToConversation } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Avatar, BackButton} from '@/presentation/components/ui'
import type { Message } from '@/domain/entities/Message'

/**
 * CL08 — Chat client · Référence : figma/screenshots/03-espace-client/
 * Paramètres : id (quoteId), artisanUserId?, artisanName?
 */

const AVATAR_SIZE = 32
const AVATAR_GAP = 8

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

export default function ConversationScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const { id: quoteId, artisanUserId: artisanUserIdParam, artisanName: artisanNameParam, artisanAvatarUrl: artisanAvatarUrlParam, artisanIsOnline: artisanIsOnlineParam, artisanPhone: artisanPhoneParam } =
    useLocalSearchParams<{ id: string; artisanUserId?: string; artisanName?: string; artisanAvatarUrl?: string; artisanIsOnline?: string; artisanPhone?: string }>()
  const user = useAuthStore((s) => s.user)
  const listRef = useRef<FlatList>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [artisanUserId, setArtisanUserId] = useState<string>(artisanUserIdParam ?? '')

  const artisanName = artisanNameParam ?? t('client.chat.title')

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({ tabBarStyle: { display: 'none' } })
    return () => parent?.setOptions({ tabBarStyle: undefined })
  }, [navigation])

  useEffect(() => {
    void loadMessages()
    if (!artisanUserIdParam && user) void resolveArtisanUserId()

    const unsubscribe = subscribeToConversation.execute(quoteId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        const next = [...prev, newMsg]
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50)
        return next
      })
    })
    return unsubscribe
  }, [quoteId])

  async function loadMessages(): Promise<void> {
    try {
      const data = await getConversationMessages.execute(quoteId)
      setMessages(data)
    } catch (err) {
      AppLogger.error(err)
    }
  }

  async function resolveArtisanUserId(): Promise<void> {
    if (!user) return
    try {
      const quotes = await getClientRequests.execute(user.id)
      const match = quotes.find((q) => q.id === quoteId)
      if (match?.artisanUserId) setArtisanUserId(match.artisanUserId)
    } catch (err) {
      AppLogger.error(err)
    }
  }

  async function handleSend(): Promise<void> {
    if (!text.trim() || !user || !artisanUserId || isSending) return
    setIsSending(true)
    try {
      const msg = await sendMessage.execute({
        quoteId,
        senderId: user.id,
        receiverId: artisanUserId,
        receiverRole: 'artisan',
        content: text.trim(),
        notification: {
          title: t('notification.message.received.title'),
          body: t('notification.message.received.body') } })
      setMessages((prev) => [...prev, msg])
      setText('')
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsSending(false)
    }
  }

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return (parts[0].slice(0, 2)).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  function renderMessage({ item: msg, index }: { item: Message; index: number }) {
    const mine = msg.senderId === user?.id
    const prevMsg = messages[index - 1]
    const nextMsg = messages[index + 1]
    const msgDate = new Date(msg.createdAt)

    const isNewDay = !prevMsg || !sameDay(new Date(prevMsg.createdAt), msgDate)
    const isLastInGroup =
      !nextMsg ||
      nextMsg.senderId !== msg.senderId ||
      !sameDay(msgDate, new Date(nextMsg.createdAt))

    const isToday = sameDay(msgDate, new Date())

    return (
      <>
        {isNewDay && (
          <View style={styles.dateSepWrap}>
            <View style={[styles.datePill, { backgroundColor: theme.muted }]}>
              <Text style={[styles.datePillText, { color: theme.mutedForeground }]}>
                {isToday ? t('client.chat.today') : msgDate.toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowOther]}>
          {!mine && (
            isLastInGroup ? (
              <View style={[styles.msgAvatar, { backgroundColor: theme.primary }]}>
                <Text style={[styles.msgAvatarText, { color: theme.primaryForeground }]}>
                  {getInitials(artisanName)}
                </Text>
              </View>
            ) : (
              <View style={styles.msgAvatarSpacer} />
            )
          )}

          <View
            style={[
              styles.bubble,
              mine
                ? [styles.bubbleMine, { backgroundColor: theme.primary }]
                : [styles.bubbleOther, { backgroundColor: theme.surface, borderColor: theme.border }],
            ]}
          >
            <Text style={[styles.bubbleText, { color: mine ? theme.primaryForeground : theme.foreground }]}>
              {msg.content}
            </Text>
          </View>
        </View>

        {isLastInGroup && (
          <View style={[styles.msgTimeWrap, mine ? styles.msgTimeWrapMine : styles.msgTimeWrapOther]}>
            <Text style={[styles.msgTime, { color: theme.mutedForeground }]}>
              {formatTime(msgDate)}
            </Text>
          </View>
        )}
      </>
    )
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.surface }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <BackButton />

          <Avatar name={artisanNameParam ?? ''} uri={artisanAvatarUrlParam || undefined} size="sm" />

          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: theme.foreground }]} numberOfLines={1}>
              {artisanNameParam}
            </Text>
            {artisanIsOnlineParam === '1' ? (
              <Text style={[styles.headerOnline, { color: theme.success }]}>
                {`● ${t('client.chat.online')}`}
              </Text>
            ) : null}
          </View>

          {!!artisanPhoneParam && (
            <Pressable
              onPress={() => void Linking.openURL(`tel:${artisanPhoneParam}`)}
              style={[styles.iconBtn, { backgroundColor: theme.muted }]}
              accessibilityRole="button"
              accessibilityLabel={t('client.artisanProfile.contact.call')}
            >
              <Phone size={20} color={theme.foreground} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {/* ── Messages ──────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* ── Saisie ─────────────────────────────────────────────── */}
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.surface }}>
          <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('client.chat.placeholder')}
              placeholderTextColor={theme.mutedForeground}
              style={[styles.input, { backgroundColor: theme.muted, color: theme.foreground }]}
              multiline
              maxLength={1000}
            />
            <Pressable
              onPress={() => void handleSend()}
              disabled={!text.trim() || isSending}
              style={[
                styles.sendBtn,
                { backgroundColor: text.trim() ? theme.primary : theme.muted },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('client.chat.send')}
            >
              <Send size={18} color={text.trim() ? theme.primaryForeground : theme.mutedForeground} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    borderBottomWidth: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: { ...ds.text.body, fontWeight: '700' },
  headerOnline: { ...ds.text.caption },
  list: { padding: ds.size.paddingH, paddingBottom: ds.space[4] },
  dateSepWrap: {
    alignItems: 'center',
    marginVertical: ds.space[3] },
  datePill: {
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[1],
    borderRadius: ds.radius.badge },
  datePillText: { ...ds.text.caption },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: AVATAR_GAP,
    marginBottom: 2 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center' },
  msgAvatarSpacer: { width: AVATAR_SIZE },
  msgAvatarText: { ...ds.text.caption, fontWeight: '700' },
  bubble: {
    maxWidth: '75%',
    padding: ds.space[3],
    borderRadius: ds.radius.card },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleText: { ...ds.text.body, lineHeight: 20 },
  msgTimeWrap: { marginBottom: ds.space[2] },
  msgTimeWrapMine: { alignItems: 'flex-end' },
  msgTimeWrapOther: { paddingLeft: AVATAR_SIZE + AVATAR_GAP },
  msgTime: { ...ds.text.caption },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: ds.space[2],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    borderTopWidth: 1 },
  input: {
    flex: 1,
    borderRadius: ds.radius.input,
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[2],
    ...ds.text.body,
    maxHeight: 120 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center' } })
