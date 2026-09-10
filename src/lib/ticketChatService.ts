import * as signalR from '@microsoft/signalr'
import { API_BASE_URL } from './constants'

export interface RealtimeChatMessage {
  id: number
  ticketId: number
  userName: string
  message: string
  commentType?: string
  createdAt: string
}

export class TicketChatService {
  private connection: signalR.HubConnection | null = null

  constructor(private token: string) {}

  async connect(
    ticketId: number,
    onNewComment: (msg: RealtimeChatMessage) => void
  ): Promise<boolean> {
    try {
      const hubOrigin = API_BASE_URL.replace(/\/api\/?$/, '')
      const hubUrl = `${hubOrigin}/hubs/ticket-chat`

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => this.token,
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.None)
        .build()

      this.connection.on('NewCommentReceived', (comment: RealtimeChatMessage) => {
        if (comment) onNewComment(comment)
      })

      this.connection.on('ReceiveComment', (comment: RealtimeChatMessage) => {
        if (comment) onNewComment(comment)
      })

      await this.connection.start()

      // Join group for this ticket
      try {
        await this.connection.invoke('JoinTicketGroup', ticketId)
      } catch {
        try {
          await this.connection.invoke('JoinTicketChat', ticketId)
        } catch {
          try {
            await this.connection.invoke('JoinGroup', String(ticketId))
          } catch {
            // Some hubs auto-join
          }
        }
      }

      return true
    } catch (err) {
      console.warn('SignalR chat connection notice (falling back to REST API):', err)
      return false
    }
  }

  async disconnect(ticketId?: number) {
    if (this.connection) {
      if (ticketId) {
        try {
          await this.connection.invoke('LeaveTicketGroup', ticketId)
        } catch {}
      }
      try {
        await this.connection.stop()
      } catch {}
      this.connection = null
    }
  }
}
