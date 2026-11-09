// GlobalProvider.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth"
import { Hub } from "@aws-amplify/core"
import { fetchRecentChats, RecentChat } from '@/utils/service_api/chatApi'

// --- 1) Context type ---
export interface GlobalContextValue {
  spotifyLinked: boolean
  appleLinked: boolean
  linkSpotify: () => Promise<void>
  linkApple: () => Promise<void>
  resetLinks: () => Promise<void>
  wsReady: boolean
  socket: WebSocket | null
  sendMessageWS: (data: any) => void
  unreadChatsCount: number
  refreshUnreadChats: () => Promise<void>
  markChatReadLocally: (chatId: string) => void
}

// --- 2) Create context ---
export const GlobalContext = createContext<GlobalContextValue | undefined>(
  undefined
)

// --- 3) Provider props ---
interface GlobalProviderProps {
  children: ReactNode
}

// how old before we clear a chat’s cache?
const MAX_CHAT_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// --- 4) The provider ---
export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  // Music‐link state
  const [spotifyLinked, setSpotifyLinked] = useState(false)
  const [appleLinked, setAppleLinked] = useState(false)

  // WebSocket refs & state
  const wsRef = useRef<WebSocket | null>(null)
  const [wsReady, setWsReady] = useState(false)
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [unreadChatsCount, setUnreadChatsCount] = useState(0)

  // 1️⃣ On mount: purge any chat caches older than MAX_CHAT_AGE_MS
  useEffect(() => {
    ;(async () => {
      try {
        const now = Date.now()
        const keys = await AsyncStorage.getAllKeys()
        const lastOpenedKeys = keys.filter((k) =>
          k.startsWith("chatLastOpened:")
        )
        const expiredIds: string[] = []

        for (let k of lastOpenedKeys) {
          const tsStr = await AsyncStorage.getItem(k)
          if (tsStr) {
            const ts = parseInt(tsStr, 10)
            if (now - ts > MAX_CHAT_AGE_MS) {
              expiredIds.push(k.replace("chatLastOpened:", ""))
            }
          }
        }

        if (expiredIds.length) {
          const toRemove = expiredIds.flatMap((id) => [
            `chatHistory:${id}`,
            `chatLastOpened:${id}`,
          ])
          await AsyncStorage.multiRemove(toRemove)
          console.log("Purged stale chats:", expiredIds)
        }
      } catch (e) {
        console.warn("Failed to clean old chats", e)
      }
    })()
  }, [])

  // Load persisted flags
  useEffect(() => {
    ;(async () => {
      const [s, a] = await Promise.all([
        AsyncStorage.getItem("spotifyLinked"),
        AsyncStorage.getItem("appleLinked"),
      ])
      setSpotifyLinked(s === "true")
      setAppleLinked(a === "true")
    })()
  }, [])

  // Persist flags
  useEffect(() => {
    AsyncStorage.setItem("spotifyLinked", JSON.stringify(spotifyLinked))
  }, [spotifyLinked])
  useEffect(() => {
    AsyncStorage.setItem("appleLinked", JSON.stringify(appleLinked))
  }, [appleLinked])

  // Load cached unread-chats count on mount
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("cachedUnreadChatsCount")
      if (raw != null) setUnreadChatsCount(parseInt(raw, 10))
      // then immediately refresh from network:
      await refreshUnreadChats()
    })()
  }, [])

  // Fetch recentChats & recompute unread-chats
  const refreshUnreadChats = async () => {
    try {
      const fresh: RecentChat[] = await fetchRecentChats()
      const unreadChats = fresh.filter(c => c.unreadCount > 0).length
      setUnreadChatsCount(unreadChats)
      await AsyncStorage.setItem("cachedUnreadChatsCount", unreadChats.toString())
    } catch (e) {
      console.warn("refreshUnreadChats failed", e)
    }
  }

  // Gets called when a user opens a chat with unreadCount>0
  const markChatReadLocally = (chatId: string) => {
    if (unreadChatsCount > 0) {
      const newCount = Math.max(0, unreadChatsCount - 1)
      setUnreadChatsCount(newCount)
      AsyncStorage.setItem("cachedUnreadChatsCount", newCount.toString()).catch(()=>{})
    }
  }

  // Music‐link helpers
  const linkSpotify = async () => {
    setSpotifyLinked(true)
    setAppleLinked(false)
  }
  const linkApple = async () => {
    setSpotifyLinked(false)
    setAppleLinked(true)
  }
  const resetLinks = async () => {
    setSpotifyLinked(false)
    setAppleLinked(false)
    await AsyncStorage.multiRemove(["spotifyLinked", "appleLinked"])
  }

  // Open socket (with heartbeat + auto‑reconnect)
  const openWebSocket = async () => {
    // fetch Cognito ID token
    let token: string
    try {
      const { tokens } = await fetchAuthSession({ forceRefresh: true })
      token = tokens?.idToken!.toString()
      if (!token) throw new Error("No ID token")
    } catch (e) {
      console.error("Failed to get Cognito session:", e)
      return
    }

    const WS_URL = "wss://8c0zlyfopl.execute-api.us-east-1.amazonaws.com/dev"
    const url = `${WS_URL}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(url)

    ws.onopen = () => {
      console.log("🟢 WebSocket connected")
      setWsReady(true)
      // start heartbeat
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      pingTimerRef.current = setInterval(
        () => ws.send(JSON.stringify({ action: "noop" })),
        30_000
      )
    }

    ws.onclose = () => {
      console.log("🔴 WebSocket disconnected — reconnecting in 3s")
      setWsReady(false)
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      // try again
      setTimeout(openWebSocket, 3_000)
    }

    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err)

    wsRef.current = ws
  }

  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setWsReady(false)
    if (pingTimerRef.current) clearInterval(pingTimerRef.current)
  }

  // sendMessage helper
  const sendMessageWS = (data: any) => {
    if (wsReady && wsRef.current) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn("WS not ready, cannot send:", data)
    }
  }

  // On mount / auth events, manage socket
  useEffect(() => {
    ;(async () => {
      try {
        const user = await getCurrentUser()
        if (user) await openWebSocket()
      } catch {
        // not signed in
      }
    })()

    const listener = ({ payload }: any) => {
      if (payload.event === "signIn") openWebSocket()
      if (payload.event === "signOut") closeWebSocket()
    }
    const unsub = Hub.listen("auth", listener)

    return () => {
      unsub()
      closeWebSocket()
    }
  }, [])

  return (
    <GlobalContext.Provider
      value={{
        spotifyLinked,
        appleLinked,
        linkSpotify,
        linkApple,
        resetLinks,
        wsReady,
        socket: wsRef.current,
        sendMessageWS,
        unreadChatsCount,
        refreshUnreadChats,
        markChatReadLocally,
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}
