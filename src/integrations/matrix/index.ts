import axios from 'axios'
import config from '#server/config'
import { escapeRegExpSensitiveCharacters } from '#shared/utils/fp'
import { User } from '#modules/users/server/models/user'
import { SafeResponse } from '#server/types'
import { Integration } from '../integration'
import { MatrixUsername, MatrixRoomId } from './types'

class Matrix extends Integration {
  id = 'matrix'
  private credentials = {
    host: process.env.MATRIX_SERVER || '',
    domain: process.env.MATRIX_DOMAIN || '',
    token: process.env.MATRIX_API_TOKEN || '',
    adminBotName: process.env.MATRIX_BOT_NAME || '',
    adminRoomId: process.env.MATRIX_ADMIN_ROOM_ID || '',
    adminBotUsername: process.env.MATRIX_BOT_USERNAME || '',
  }
  private tagsRe = /<[^>]+>/gm
  private usernameRe = /@(.+):(.+)/
  private headers = { Accept: 'application/json' }
  public usernameRegex = new RegExp(
    `^@?[a-zA-Z0-9._=-]+:(${escapeRegExpSensitiveCharacters(
      this.credentials.domain
    )})$`,
    'i'
  )

  private sanitizeUsername(value: string): string | null {
    if (!value) return null
    let result = value
    if (this.usernameRe.test(result)) {
      return result
    }
    if (!result.startsWith('@')) {
      result = '@' + result
    }
    if (this.usernameRe.test(result)) {
      return result
    }
    throw new Error(
      `Invalid matrix username "${value}". Failed to sanitize it.`
    )
  }

  private async createRoomWithMember(
    username: MatrixUsername
  ): Promise<MatrixRoomId | null> {
    const usernameFormatted = this.sanitizeUsername(username)
    if (config.debug) {
      console.log(
        `Room creation for the member ${username} skipped (debug mode)`
      )
      return null
    }
    return axios
      .post(
        `https://${this.credentials.host}/_matrix/client/r0/createRoom?access_token=${this.credentials.token}`,
        {
          name: this.credentials.adminBotName,
          invite: [usernameFormatted],
          is_direct: true,
        },
        { headers: this.headers }
      )
      .then((res) => res.data.room_id)
  }

  private async getRoomMembers(
    roomId: MatrixRoomId
  ): Promise<MatrixUsername[]> {
    if (config.debug) {
      console.log(
        `Checking members for the room ${roomId} skipped (debug mode)`
      )
      return []
    }
    return axios
      .get(
        `https://${this.credentials.host}/_matrix/client/r0/rooms/${roomId}/joined_members?access_token=${this.credentials.token}`,
        { headers: this.headers }
      )
      .then((res) => Object.keys(res.data?.joined || {}))
  }

  private async sendMessageInRoom(
    roomId: MatrixRoomId,
    message: string
  ): Promise<void> {
    if (config.debug) {
      console.log(`Matrix notification skipped (debug mode): ${message}`)
      return
    }
    return axios
      .post(
        `https://${this.credentials.host}/_matrix/client/r0/rooms/${roomId}/send/m.room.message?access_token=${this.credentials.token}`,
        {
          msgtype: 'm.text',
          format: 'org.matrix.custom.html',
          body: message.replace(this.tagsRe, ''),
          formatted_body: message,
        },
        {
          headers: this.headers,
        }
      )
      .then(() => {})
  }

  private async ensureUserRoom(user: User): Promise<MatrixRoomId | null> {
    if (config.debug) {
      console.log(
        `Make sure the user ${user.email} has a room. Skipped (debug mode)`
      )
      return null
    }
    const username: MatrixUsername | null = user.contacts.matrix
    const roomId: MatrixRoomId | null = user.externalIds.matrixRoomId
    if (!username) {
      return null
    }
    let userIsOutOfRoom = true
    if (roomId) {
      const roomMembers = await this.getRoomMembers(roomId)
      userIsOutOfRoom = roomMembers.length < 2
    }
    if (!roomId || userIsOutOfRoom) {
      const newRoomId = await this.createRoomWithMember(username)
      if (newRoomId) {
        await user
          .set({
            externalIds: {
              ...user.externalIds,
              matrixRoomId: newRoomId,
            },
          })
          .save()
      }
    }
    return user.externalIds.matrixRoomId
  }

  public async inviteUserInRoom(
    roomId: MatrixRoomId,
    username: MatrixUsername
  ): Promise<SafeResponse<void>> {
    const usernameFormatted = this.sanitizeUsername(username)
    if (config.debug) {
      console.log(
        `Invitation the member ${username} to the room ${roomId} skipped (debug mode)`
      )
      return this.success()
    }
    try {
      await axios.post(
        `https://${this.credentials.host}/_matrix/client/r0/rooms/${roomId}/invite?access_token=${this.credentials.token}`,
        {
          user_id: usernameFormatted,
        },
        { headers: this.headers }
      )
      return this.success()
    } catch (err) {
      return this.error(
        err,
        `Unable to invite user ${username} to the room ${roomId}`
      )
    }
  }

  public inviteUserInRoomDeferred(
    roomId: MatrixRoomId,
    username: MatrixUsername
  ): void {
    process.nextTick(() => this.inviteUserInRoom(roomId, username))
  }

  async sendMessageToUser(
    user: User,
    message: string
  ): Promise<SafeResponse<void>> {
    try {
      const roomId = await this.ensureUserRoom(user)
      if (roomId) {
        await this.sendMessageInRoom(roomId, message)
      }
      return this.success()
    } catch (err) {
      return this.error(err, `Unable to send a message to user ${user.id}`)
    }
  }

  public sendMessageToUserDeferred(user: User, message: string): void {
    process.nextTick(() => this.sendMessageToUser(user, message))
  }

  public async sendMessageInAdminRoom(
    message: string
  ): Promise<SafeResponse<void>> {
    try {
      await this.sendMessageInRoom(this.credentials.adminRoomId, message)
      return this.success()
    } catch (err) {
      return this.error(err, `Unable to send a message in admin room`)
    }
  }

  public sendMessageInAdminRoomDeferred(message: string): void {
    process.nextTick(() => this.sendMessageInAdminRoom(message))
  }

  // async createRoom(
  //   adminUsername: MatrixUsername,
  //   roomName: string
  // ): Promise<MatrixRoomId | null> {
  //   const adminUsernameFormatted = this.sanitizeUsername(
  //     adminUsername
  //   ) as string
  //   if (config.debug) {
  //     console.log(
  //       `Room creation for the member ${adminUsername} skipped (debug mode)`
  //     )
  //     return null
  //   }
  //   return axios
  //     .post(
  //       `https://${this.credentials.host}/_matrix/client/r0/createRoom?access_token=${this.credentials.token}`,
  //       {
  //         name: roomName,
  //         invite: [adminUsernameFormatted],
  //         preset: 'private_chat',
  //         creation_content: {
  //           'm.federate': false,
  //         },
  //         power_level_content_override: {
  //           users: {
  //             [this.credentials.adminBotUsername]: 100,
  //             [adminUsernameFormatted]: 100,
  //           },
  //         },
  //       },
  //       { headers: this.headers }
  //     )
  //     .then((res) => res.data.room_id)
  // }
}

export default Matrix
