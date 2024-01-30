import { User } from '#modules/users/server/models'
import { appConfig } from '#server/app-config'
import {
  ScheduledItemType,
  EntityVisibility,
  EventApplicationStatus,
  GenericVisit,
  VisitType,
} from '#shared/types'
import dayjs from 'dayjs'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import {
  formatEvent,
  formatRoomReservationsResult,
  formatVisit,
  getRoomReservations,
  getVisits,
} from './helpers'
import { getDate } from '#modules/office-visits/server/helpers'
import { Op } from 'sequelize'
import { Event, EventCheckmark } from '#modules/events/server/models'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const addToUpcomingByDate = (
  upcomingByDate: Record<string, any>,
  value: GenericVisit,
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
      for (const [idx, v] of visits.entries()) {
        const item = formatVisit(v)
        if (!idx) {
          upcomingItems.push(item)
        }
        const user = await User.findByPk(v.userId)
        addToUpcomingByDate(
          upcomingByDate,
          formatVisit(v, user),
          v.date,
          VisitType.Visit
        )
        dailyEventsVisits.push(item)
      }

      const eventApplications = await fastify.db.EventApplication.findAll({
        include: {
          model: Event,
          as: 'event',
          where: {
            startDate: {
              [Op.between]: [
                dayjs().startOf('day').toDate(),
                dayjs().startOf('day').add(14, 'days').toDate(),
              ],
            },

            visibility: {
              [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
            },
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
        let myEvents = []

        for (const application of eventApplications) {
          const checklistLength = application?.event?.checklist.length
          let checkmarks = []

          if (checklistLength) {
            checkmarks = await EventCheckmark.findAll({
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

      return {
        upcoming: upcomingItems.sort(
          (a: ScheduledItemType, b: ScheduledItemType) =>
            dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1
        ),
        byType: {
          [VisitType.Visit]: dailyEventsVisits,
          [VisitType.RoomReservation]: dailyEventsReservations,
          event: myEvents,
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
