import { Sequelize } from 'sequelize/types'
import { QueryTypes } from 'sequelize'
import { Event, EventApplicationStatus } from '../../types'

export type UserCheckboxCompletion = Record<string, 1 | 0>
export type UserChecklistCompletion = {
  userId: string
} & UserCheckboxCompletion

export const getUserEventChecklists = async (
  sequelize: Sequelize,
  event: Event,
): Promise<UserChecklistCompletion[]> => {
  /*
    should return data in the following format:
    ┌────────┬────────┬────────┬────────┐
    │ userId │ ch_AAA │ ch_BBB │ ch_CCC │
    ├────────┼────────┼────────┼────────┤
    │ <ID>   │ 1      │ 1      │ 0      │
    └────────┴────────┴────────┴────────┘
    `ch_AAA`  id of an event's checklist item
    `1`       checklist item completed
    `0`       checklist item uncompleted
  */
    const checkboxIds = event.checklist.map((x) => x.id)
    const checkboxSelect1 = checkboxIds.map((x) => `max(${x}) ${x}`).join(', ')
    const checkboxSelect2 = checkboxIds.map((x) => `max(case when ec."checkboxId" = '${x}' then 1 else 0 end) ${x}`).join(', ')
    const checkboxSelect3 = checkboxIds.map(() => '0').join(', ')
    const checkboxCondition = checkboxIds.map((x) => `${x} = 0`).join(' or ')
    const confirmedEventApplicationStatus = EventApplicationStatus.Confirmed
    const query = `
      select * from (
        select distinct "userId", ${checkboxSelect1} from (
            select * from (
                select ec."userId" "userId", ${checkboxSelect2} from event_applications ea
                    right join event_checkmarks ec on ea."userId" = ec."userId" and ea."eventId" = ec."eventId"
                    where 1=1
                        and ea."eventId" = '${event.id}'
                        and ea.status = '${confirmedEventApplicationStatus}'
                    group by ec."userId"
            ) checklist_progress
            union
            select distinct ea."userId", ${checkboxSelect3} from event_applications ea
            where 1=1
                and ea."eventId" = '${event.id}'
                and ea.status = '${confirmedEventApplicationStatus}'
        ) checklist_progress_merged
        group by "userId"
      ) main
      where (${checkboxCondition})
    `
    const userChecklists: UserChecklistCompletion[] = await sequelize.query(
      query,
      { type: QueryTypes.SELECT }
    )
    return userChecklists
}

export const isEventApplicationUncompleted = async (
  sequelize: Sequelize,
  event: Event,
  userId: string,
): Promise<boolean> => {
  const checkboxIds = event.checklist.map((x) => x.id)
  const checkboxSelect1 = checkboxIds.map((x) => `max(${x}) ${x}`).join(', ')
  const checkboxSelect2 = checkboxIds.map((x) => `max(case when ec."checkboxId" = '${x}' then 1 else 0 end) ${x}`).join(', ')
  const checkboxSelect3 = checkboxIds.map(() => '0').join(', ')
  const checkboxCondition = checkboxIds.map((x) => `${x} = 0`).join(' or ')
  const query = `
    select * from (
      select ${checkboxSelect1}
      from (
          select * from (
              select ${checkboxSelect2}
              from event_applications ea
                  right join event_checkmarks ec
                    on
                      ea."eventId" = ec."eventId"
                  where 1=1
                      and ea."eventId" = '${event.id}'
                      and ea.status = '${EventApplicationStatus.Confirmed}'
                      and ea."userId" = '${userId}'
                  group by ec."userId"
          ) checklist_progress
          union
          select ${checkboxSelect3}
          from event_applications ea
          where 1=1
              and ea."eventId" = '${event.id}'
              and ea.status = '${EventApplicationStatus.Confirmed}'
      ) checklist_progress_merged
    ) main
    where (${checkboxCondition});
  `
  /*
    returns data in the following format:
    ┌────────┬────────┬────────┐
    │ ch_AAA │ ch_BBB │ ch_CCC │
    ├────────┼────────┼────────┤
    │      1 │      1 │      0 │
    └────────┴────────┴────────┘
    `ch_AAA`  id of an event's checklist item
    `1`       checklist item completed
    `0`       checklist item uncompleted
  */
  const checkmarksCompleteon = await sequelize.query(
    query,
    { type: QueryTypes.SELECT },
  ).then((xs) => xs[0]) as Record<string, number>

  if (!checkmarksCompleteon) return false
  const checkmarkIds = Object.keys(checkmarksCompleteon)
  return checkmarkIds.some((chId) => checkmarksCompleteon[chId] === 0)

}