import { Op } from 'sequelize'
import { CronJob, CronJobContext } from '#server/types'
import * as fp from '#shared/utils/fp'
import { WorkingHoursConfig } from '#shared/types'
import { Metadata } from '../../metadata-schema'

export const cronJob: CronJob = {
  name: 'fetch-default-working-hours',
  cron: '0 21 * * 0-4', // daily Sun-Thu at 9PM
  fn: async (ctx: CronJobContext) => {
    if (ctx.integrations.Humaans) {
      await fetchHumaansDefaultWorkingHours(ctx)
    } else if (ctx.integrations.BambooHR) {
      await fetchBamboHRDefaultWorkingHours(ctx)
    }
  },
}

async function fetchHumaansDefaultWorkingHours(ctx: CronJobContext) {
  const WORKING_DAY_INDEX_BY_NAME = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  const moduleMetadata = ctx.appConfig.getModuleMetadata(
    'working-hours'
  ) as Metadata
  const configByRole = moduleMetadata?.configByRole as Record<
    string,
    WorkingHoursConfig
  >
  const allowedRoles = Object.keys(configByRole)

  const users = await ctx.models.User.findAllActive({
    where: {
      roles: { [Op.overlap]: allowedRoles },
      isInitialised: true,
    },
  })
  const userConfigs = await ctx.models.WorkingHoursUserConfig.findAll({
    where: { userId: { [Op.in]: users.map(fp.prop('id')) } },
  })
  const userConfigByUserId = userConfigs.reduce(fp.by('userId'), {})

  const employees = await ctx.integrations.Humaans.getEmployees()
  const employeeByEmail = employees.reduce<
    Record<string, (typeof employees)[0]>
  >(fp.by('email'), {})

  const report = { succeeded: 0, failed: 0 }

  for (const user of users) {
    const employee = employeeByEmail[user.email]
    if (!employee) continue

    const userRole = allowedRoles.find((x) => user.roles.includes(x))!
    const config = configByRole[userRole]
    const dailyWorkingHours = config.workingDays.length
      ? config.weeklyWorkingHours / config.workingDays.length
      : 0
    const baseConfig = {
      workingDays: config.workingDays,
      weeklyWorkingHours: config.weeklyWorkingHours,
    }

    const employeeWorkingDaysNumber = employee.workingDays.length
    const employeeWorkingDays = employee.workingDays
      .map((x) => WORKING_DAY_INDEX_BY_NAME[x.day])
      .filter((x) => x !== undefined)
    const employeeWeeklyWorkingHours =
      dailyWorkingHours * employeeWorkingDaysNumber
    const employeeConfig = {
      workingDays: employeeWorkingDays,
      weeklyWorkingHours: employeeWeeklyWorkingHours,
    }

    const userConfig = userConfigByUserId[user.id]

    if (userConfig) {
      if (compareConfigs(userConfig.value, employeeConfig)) {
        // Delete config
        try {
          await userConfig.destroy()
          ctx.log.info(`Deleted time tracking user config for ${user.email}`)
          report.succeeded++
        } catch (err) {
          ctx.log.error(err, `Failed to delete user config`)
          report.failed++
        }
      } else if (!compareConfigs(userConfig.value, employeeConfig)) {
        // Update config
        try {
          await userConfig
            .set({
              value: employeeConfig,
            })
            .save()
          ctx.log.info(`Updated time tracking user config for ${user.email}`)
          report.succeeded++
        } catch (err) {
          ctx.log.error(err, `Failed to update user config`)
          report.failed++
        }
      }
    } else if (!compareConfigs(baseConfig, employeeConfig)) {
      // Create config
      try {
        await ctx.models.WorkingHoursUserConfig.create({
          userId: user.id,
          value: employeeConfig,
        })
        ctx.log.info(`Created new time tracking user config for ${user.email}`)
        report.succeeded++
      } catch (err) {
        ctx.log.error(err, `Failed to create new user config`)
        report.failed++
      }
    }
  }

  if (report.succeeded || report.failed) {
    ctx.log.info(
      `Successfully processed ${report.succeeded} working-hours configs. ${report.failed} failed.`
    )
  }
}

async function fetchBamboHRDefaultWorkingHours(ctx: CronJobContext) {
  const moduleMetadata = ctx.appConfig.getModuleMetadata(
    'working-hours'
  ) as Metadata
  const configByRole = moduleMetadata?.configByRole as Record<
    string,
    WorkingHoursConfig
  >
  const allowedRoles = Object.keys(configByRole)

  const users = await ctx.models.User.findAllActive({
    where: {
      roles: { [Op.overlap]: allowedRoles },
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
}

function compareArrays(a: any[] = [], b: any[] = []): boolean {
  return a.length === b.length && a.every((x) => b.includes(x))
}

function compareConfigs<
  T extends { workingDays: number[]; weeklyWorkingHours: number }
>(a: T, b: T): boolean {
  return (
    a.weeklyWorkingHours === b.weeklyWorkingHours &&
    compareArrays(a.workingDays, b.workingDays)
  )
}
