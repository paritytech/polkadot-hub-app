import dayjs from 'dayjs'
import { Office, OfficeRoom, User, RoomReservation } from '#shared/types'
import { appConfig } from '#server/app-config'
import { DATE_FORMAT_DAY_NAME } from '#server/constants'

const getTime = (date: string | Date, tz: string) => {
  return dayjs(date).tz(tz).format('LT')
}
const getDate = (d: string | Date, tz: string) =>
  dayjs(d).tz(tz).format(DATE_FORMAT_DAY_NAME)

const getDateTimeString = (reservation: RoomReservation, tz: string) =>
  `${getDate(reservation.startDate, tz)} , ${getTime(
    reservation.startDate,
    tz
  )} - ${getTime(reservation.endDate, tz)}`

export const roomReservationUser = (
  room: OfficeRoom | undefined,
  status: string,
  reservation: RoomReservation,
  office: Office
) =>
  `You <b> requested a room reservation (${status})</b> for ${
    room ? room.name : reservation.roomId
  },  ${getDateTimeString(reservation, office.timezone)}, Location: ${
    appConfig.getOfficeById(office.id).name
  }`

export const roomReservationAdmin = (
  user: User,
  status: string,
  room: OfficeRoom | undefined,
  reservation: RoomReservation,
  office: Office
) =>
  `${user.fullName} (${
    user.email
  }) <b>requested a room reservation (${status})</b> for ${
    room ? room.name : reservation.roomId
  }, ${getDateTimeString(reservation, office.timezone)}, Location: ${
    appConfig.getOfficeById(office.id).name
  }`

export const roomReservationUserStatusChange = (
  status: string,
  room: OfficeRoom | undefined,
  reservation: RoomReservation,
  office: Office
) =>
  `You <b>${status} room reservation</b> for ${
    room ? room.name : reservation.roomId
  },  ${getDateTimeString(reservation, office.timezone)}, Location: ${
    appConfig.getOfficeById(office.id).name
  }`

export const roomReservationCancelledForUser = (
  room: OfficeRoom | undefined,
  reservation: RoomReservation,
  office: Office
) =>
  `Your room reservation <b>was cancelled</b>: ${
    room ? room.name : reservation.roomId
  },  ${getDateTimeString(reservation, office.timezone)}, Location: ${
    appConfig.getOfficeById(office.id).name
  }.`

export const roomReservationAdminStatusChange = (
  user: User,
  status: string,
  room: OfficeRoom | undefined,
  reservation: RoomReservation,
  office: Office
) =>
  `${user.fullName} (${user.email}) <b>${status} room reservation </b> for ${
    room ? room.name : reservation.roomId
  },  ${getDateTimeString(reservation, office.timezone)}, Location: ${
    appConfig.getOfficeById(office.id).name
  }`
