import { Op } from 'sequelize'
import { CronJob, CronJobContext } from '#server/types'
import * as fp from '#shared/utils/fp'
import { WorkingHoursConfig } from '#shared/types'
import { Metadata } from '../../metadata-schema'

export const cronJob: CronJob = {
  name: 'fetch-default-hours-reminder',
  cron: '0 21 * * 0-4', // daily Sun-Thu at 9PM
  fn: async (ctx: CronJobContext) => {
    if (!ctx.integrations.Matrix) {
      ctx.log.error(
        'Cannot send working hours reminders: disabled Matrix integration.'
      )
      return
    }
    if (!ctx.integrations.BambooHR) {
      ctx.log.error(
        'Cannot send working hours reminders: disabled Matrix integration.'
      )
      return
    }

    const moduleMetadata = ctx.appConfig.getModuleMetadata(
      'working-hours'
    ) as Metadata
    const configByDivision = moduleMetadata?.configByDivision as Record<
      string,
      WorkingHoursConfig
    >
    const divisions = Object.keys(configByDivision)

    const users = await ctx.models.User.findAllActive({
      where: {
        division: { [Op.in]: divisions },
        isInitialised: true,
      },
    })
    const userConfigs = await ctx.models.WorkingHoursUserConfig.findAll({
      where: { userId: { [Op.in]: users.map(fp.prop('id')) } },
    })
    const userConfigByUserId = userConfigs.reduce(fp.by('userId'), {})

    const employees = await ctx.integrations.BambooHR.getEmployees()
    const employeeByEmail = employees.reduce<
      Record<string, (typeof employees)[0]>
    >(fp.by('workEmail'), {})

    const partTimeRe = /part-time\s?(\d+)\s?h/i
    const digitsRe = /^\d+$/

    const report = { succeeded: 0, failed: 0 }

    for (const user of users) {
      const employee = employeeByEmail[user.email]
      if (!employee) continue
      const extraData = await ctx.integrations.BambooHR.getEmployeeExtraFields(
        employee.id,
        ['employmentHistoryStatus'] // TODO: define custom mapping in module metadata
      )
      const employmentStatus = extraData?.employmentHistoryStatus
      if (employmentStatus) {
        const match = employmentStatus.match(partTimeRe)
        const parsedValue = match?.[1] || null
        if (!parsedValue) continue
        if (!digitsRe.test(parsedValue)) {
          ctx.log.error(
            `Failed to parse employment status for ${user.email}. Value: "${employmentStatus}"`
          )
          continue
        }
        const value = Number(parsedValue)
        const userConfig = userConfigByUserId[user.id]
        if (!userConfig) {
          try {
            await ctx.models.WorkingHoursUserConfig.create({
              userId: user.id,
              value: { weeklyWorkingHours: value },
            })
            report.succeeded++
          } catch (err) {
            ctx.log.error(err, `Failed to create new user config`)
            report.failed++
          }
        } else if (userConfig.value.weeklyWorkingHours !== value) {
          try {
            // @ts-ignore
            await userConfig.set({ 'value.weeklyWorkingHours': value }).save()
            report.succeeded++
          } catch (err) {
            ctx.log.error(err, `Failed to update user config`)
            report.failed++
          }
        }
      }
    }

    if (report.succeeded || report.failed) {
      ctx.log.info(
        `Successfully processed ${report.succeeded} working-hours configs. ${report.failed} failed.`
      )
    }
  },
}
