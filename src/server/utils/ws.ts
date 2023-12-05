import { randomBytes } from 'crypto'

type UserId = string
type ConnectionId = string
type ConnectionMetadata = Record<string, unknown>
type UserConnection = {
  id: ConnectionId
  connection: WebSocket
  metadata: ConnectionMetadata
}

class WebsocketPoolRoom {
  declare id: string
  declare users: Record<UserId, UserConnection[]>

  constructor(id: string) {
    this.id = id
    this.users = {}
  }

  private createConnectionId(): ConnectionId {
    const arr = randomBytes(8)
    return 'conn_' + Array.from(arr, (x) => x.toString(16).padStart(2, '0')).join('')
  }

  addConnection(userId: string, conn: WebSocket, metadata: ConnectionMetadata = {}): ConnectionId {
    const connId = this.createConnectionId()
    // const newConn = { [connId]: conn }
    const newConn: UserConnection = {
      id: connId,
      connection: conn,
      metadata,
    }
    this.users[userId] = this.users[userId] ? this.users[userId].concat(newConn) : [newConn]
    return connId
  }

  removeConnection(userId: UserId, connId: ConnectionId) {
    if (this.users[userId]) {
      this.users[userId] = this.users[userId].filter((x) => x.id !== connId)
      if (!this.users[userId].length) {
        delete this.users[userId]
      }
    }
  }

  sendAll(data: unknown) {
    const userIds = Object.keys(this.users)
    for (const userId of userIds) {
      const userConns = this.users[userId]
      if (userConns) {
        for (const conn of userConns) {
          conn.connection.send(JSON.stringify(data))
        }
      }
    }
  }

  send(userId: UserId, data: unknown) {
    const userConns = this.users[userId]
    if (userConns) {
      for (const conn of userConns) {
        conn.connection.send(JSON.stringify(data))
      }
    }
  }
}

class WebsocketPool {
  pool: Record<string, WebsocketPoolRoom> = {}

  useRoom(roomId: string) {
    if (!this.pool[roomId]) {
      this.pool[roomId] = new WebsocketPoolRoom(roomId)
    }
    return this.pool[roomId]
  }

  __debug() {
    console.log(`======== WS DEBUG ========`)
    for (const roomId in this.pool) {
      console.log(`\t`, this.pool[roomId])
    }
    console.log(`==========================`)
  }
}

export const wsPool = new WebsocketPool()

// const connId = wsPool.useRoom('admin').addConnection('user_123', new WebSocket('ws://wow.com/ws'))
// wsPool.useRoom('admin').removeConnection('user_123', connId)
