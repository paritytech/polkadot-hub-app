import config from '#client/config'

// TODO: implement shared constants and move it there
export const DATE_FORMAT = 'YYYY-MM-DD'

export const DATE_FORMAT_DAY_NAME = 'ddd, MMMM D'

export const DATE_FORMAT_DAY_NAME_FULL = 'dddd, MMMM D'

export const FRIENDLY_DATE_FORMAT = 'MMMM D YYYY'

export const USER_ROLE_BY_ID = config.roles.reduce(
  (acc, x) => ({ ...acc, [x.id]: x }),
  {} as Record<string, (typeof config.roles)[0]>
)

export const OFFICE_BY_ID = config.offices.reduce(
  (acc, x) => ({ ...acc, [x.id]: x }),
  {} as Record<string, (typeof config.offices)[0]>
)

// TODO: implement shared constants and move it there
export const ADMIN_ACCESS_PERMISSION_POSTFIX = '__admin'

// TODO: implement shared constants and move it there
export const ADMIN_ACCESS_PERMISSION_RE = new RegExp(
  `^.*\.${ADMIN_ACCESS_PERMISSION_POSTFIX}`
)
