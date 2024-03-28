import { appConfig } from '#server/app-config'
import {
  EntityVisibility,
  EventApplicationStatus,
  GenericVisit,
  GuestInvite,
  User,
  VisitType,
} from '#shared/types'
import dayjs from 'dayjs'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import {
  formatEvent,
  formatGuestInvite,
  formatRoomReservationsResult,
  formatVisit,
  getDate,
  getRoomReservations,
  getVisits,
} from './helpers'
import { Op } from 'sequelize'
import { Event } from '#modules/events/server/models'
import * as fp from '#shared/utils/fp'
import { ScheduledItemType } from '../types'
import { ROBOT_USER_ID } from '#server/constants'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const addToUpcomingByDate = (
  upcomingByDate: Record<string, any>,
  value: ScheduledItemType,
  date: string,
  type: string
) => {
  const dateKey = getDate(date)
  upcomingByDate[dateKey] = upcomingByDate[dateKey] || {}
  upcomingByDate[dateKey][type] = upcomingByDate[dateKey][type] || []
  upcomingByDate[dateKey][type].push(value)
}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/upcoming',
    async (
      req: FastifyRequest<{
        Querystring: {
          date: string
          limit: number
          officeId: string
          userId: string
        }
      }>,
      reply
    ) => {
      const { date, officeId } = req.query
      if (!officeId) {
        return reply.throw.badParams('Missing office ID')
      }
      const office = appConfig.getOfficeById(officeId)

      let visits = await getVisits(fastify, officeId, date, req.query.userId)
      if (req.query.userId) {
        // filter out the ones which we created as guest invites
        visits = visits.filter((v) => !v.metadata || !v.metadata.guestInvite)
      }
      let roomReservations = await getRoomReservations(
        fastify,
        officeId,
        req.user.id,
        date
      )

      const upcomingItems: Array<ScheduledItemType> = []
      const upcomingByDate: Record<string, any> = {}

      const dailyEventsReservations = roomReservations.map(
        (reservation, idx) => {
          const area = office?.areas?.find((area) =>
            area.meetingRooms?.find((room) => room.id === reservation.roomId)
          )
          const item = formatRoomReservationsResult(
            reservation,
            officeId,
            area?.id
          )
          // add the first item in array to show at the top of the map in a list
          if (!idx) {
            upcomingItems.push(item)
          }
          addToUpcomingByDate(
            upcomingByDate,
            item,
            dayjs(reservation.startDate).toString(),
            VisitType.RoomReservation
          )
          return item
        }
      )

      let dailyEventsVisits = []
      const userIds = Array.from(new Set(visits.map(fp.prop('userId'))))
      const guestsInviteIds = visits
        .filter((v) => v.metadata.guestInvite)
        .map((v) => v.metadata.guestInviteId)

      let userEmails: string[] = []
      let guestInvites: Array<GuestInvite> = []

      if (!!guestsInviteIds.length) {
        guestInvites = await fastify.db.GuestInvite.findAll({
          where: { id: { [Op.in]: guestsInviteIds } },
        })
        userEmails = Array.from(new Set(guestInvites.map(fp.prop('email'))))
      }

      const users = await fastify.db.User.findAll({
        where: {
          [Op.or]: [
            { id: { [Op.in]: userIds } },
            { email: { [Op.in]: userEmails } },
          ],
          stealthMode: false,
        },
        raw: true,
      })

      const usersByEmail = users.reduce(fp.by('email'), {})
      const usersById = users.reduce(fp.by('id'), {})

      for (const [idx, v] of visits.entries()) {
        const isGuestVisit = v.metadata && v.metadata.guestInvite
        let user: User | null | { id: string } = null
        if (isGuestVisit && !!guestInvites.length) {
          const inviteEmail = guestInvites.find(
            (inv) => inv.id === v.metadata.guestInviteId
          )?.email
          user = usersByEmail[inviteEmail ?? ''] ?? null
        } else {
          user = usersById[v.userId]
        }
        if (!user && isGuestVisit) {
          user = { id: ROBOT_USER_ID }
        }

        if (!!user) {
          const item = formatVisit(v)
          if (!idx) {
            upcomingItems.push(item)
          }
          addToUpcomingByDate(
            upcomingByDate,
            formatVisit(v, user),
            v.date,
            VisitType.Visit
          )
          dailyEventsVisits.push(item)
        }
      }

      const eventApplications = await fastify.db.EventApplication.findAll({
        include: {
          model: Event,
          as: 'event',
          where: {
            [Op.and]: [
              {
                visibility: {
                  [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
                },
              },
              {
                [Op.or]: [
                  {
                    // Events that start within the date range
                    startDate: {
                      [Op.between]: [
                        dayjs().startOf('day').toDate(),
                        dayjs().startOf('day').add(14, 'days').toDate(),
                      ],
                    },
                  },
                  {
                    // Events that end within the date range
                    endDate: {
                      [Op.between]: [
                        dayjs().startOf('day').toDate(),
                        dayjs().startOf('day').add(14, 'days').toDate(),
                      ],
                    },
                  },
                  {
                    // Events that span the entire date range
                    startDate: {
                      [Op.lte]: dayjs().startOf('day').toDate(),
                    },
                    endDate: {
                      [Op.gte]: dayjs().startOf('day').add(14, 'days').toDate(),
                    },
                  },
                ],
              },
              {
                visibility: {
                  [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
                },
              },
            ],
          },

          attributes: ['id', 'title', 'startDate', 'endDate', 'checklist'],
          required: true,
          order: [['startDate', 'ASC']],
        },
        where: {
          status: {
            [Op.in]: [
              EventApplicationStatus.Opened,
              EventApplicationStatus.Pending,
              EventApplicationStatus.Confirmed,
            ],
          },
          userId: req.user.id,
        },
        attributes: ['eventId', 'status'],
      })

      let myEvents = []
      if (!!eventApplications.length) {
        for (const application of eventApplications) {
          const checklistLength = application?.event?.checklist.length
          let checkmarks = []

          if (checklistLength) {
            checkmarks = await fastify.db.EventCheckmark.findAll({
              where: {
                userId: req.user.id,
                eventId: application.eventId,
              },
            })
          }

          const eventFormatted = formatEvent(
            application?.event,
            application.status,
            checkmarks.length === checklistLength
          )

          myEvents.push(eventFormatted)
        }

        if (!!myEvents.length) {
          upcomingItems.push(myEvents[0])
        }
      }

      const today = dayjs().startOf('day')
      const lastDay = dayjs().startOf('day').add(14, 'days')

      const guests = await fastify.db.GuestInvite.findAll({
        attributes: ['fullName', 'id', 'dates'],
        where: {
          creatorUserId: req.user.id,
          office: officeId,
          status: 'confirmed',
        },
        raw: true,
      })

      const dailyGuests = []
      for (const oneGuest of guests) {
        const guestInvitations = oneGuest.dates
          .map((date) => ({
            ...oneGuest,
            date,
          }))
          .filter(
            (invite) =>
              dayjs(invite.date).isSameOrAfter(today) &&
              dayjs(invite.date).isSameOrBefore(lastDay)
          )

        for (const oneInvitation of guestInvitations) {
          const visit = await fastify.db.Visit.findOne({
            where: {
              'metadata.guestInviteId': oneInvitation.id,
            },
          })
          const invite = formatGuestInvite(oneInvitation, visit)
          dailyGuests.push(invite)
          addToUpcomingByDate(
            upcomingByDate,
            invite,
            dayjs(invite.date).toString(),
            VisitType.Guest
          )
        }
      }

      if (!!dailyGuests.length) {
        upcomingItems.push(dailyGuests[0] as ScheduledItemType)
      }

      return {
        upcoming: upcomingItems.sort(
          (a: ScheduledItemType, b: ScheduledItemType) =>
            dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1
        ),
        byType: {
          [VisitType.Visit]: dailyEventsVisits,
          [VisitType.RoomReservation]: dailyEventsReservations,
          event: myEvents,
          [VisitType.Guest]: dailyGuests,
        },
        byDate: upcomingByDate,
      }
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}
