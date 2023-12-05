import { arrayMove as dndKitArrayMove } from '@dnd-kit/sortable'
import {
  FormBlock,
  FormStep,
  FormBlockOption,
  FormBlockCondition,
} from '#shared/types'
import { generateId } from '#client/utils'
import { notEq, prop, propEq, trim } from '#shared/utils/fp'
import {
  BlocksById,
  BlockIdsByStepId,
  FinalStepData,
  OutputBuilder,
} from './types'

export const finalFormStepId = '~finish~'
export const conditionValueSeparator = '\\'

export const operatorLabels = {
  $eq: 'be equal to',
  $ne: 'not be equal to',
  $in: 'be equal to one of',
  $gt: 'be greather than',
  $gte: 'be greather than or equal to',
  $lt: 'be less than',
  $lte: 'be less than or equal to',
  $includes: 'include',
}
export const operatorsByBlockKind: Record<
  NonNullable<FormBlock['kind']>,
  Array<FormBlockCondition['operator']>
> = {
  text: ['$eq', '$ne', '$in', '$includes'],
  text_long: ['$eq', '$ne', '$in', '$includes'],
  select: ['$eq', '$ne', '$in'],
  radio: ['$eq', '$ne', '$in'],
  checkbox: ['$eq', '$includes'],
  phone: ['$eq', '$ne', '$includes', '$in'],
  number: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in'],
  date: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in'],
  date_time: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in'],
  email: ['$eq', '$ne', '$in', '$includes'],
}

export const placeholderFormContent: FormStep[] = [
  {
    id: generateId(8, 'step_'),
    blocks: [
      {
        id: generateId(8, 'block_'),
        type: 'content',
        kind: 'text',
        text: `# Form title\n\nForm description`,
      },
      {
        id: generateId(8, 'block_'),
        type: 'input',
        kind: 'text',
        title: 'What is your name?',
        label: 'Name',
        placeholder: 'John Doe',
      },
    ],
  },
  {
    id: finalFormStepId,
    blocks: [
      {
        id: finalFormStepId,
        type: 'content',
        text: `# Form completed\n\nThank you for your time!`,
      },
    ],
  },
]

export const getConditionOperators = (blockKind: FormBlock['kind']) => {
  if (!blockKind) return []
  return operatorsByBlockKind[blockKind].map((operator) => ({
    operator,
    label: operatorLabels[operator],
  }))
}

export const shouldConditionUseArray = (
  operator: FormBlockCondition['operator'],
  blockKind: FormBlock['kind']
): boolean => {
  if (operator === '$in') {
    return true
  }
  if (operator === '$eq' && blockKind === 'checkbox') {
    return true
  }
  return false
}

const conditionValuePlaceholderPatternRegex = /X/g
export const getConditionValuePlaceholder = (
  operator: FormBlockCondition['operator'],
  blockKind: FormBlock['kind']
): string => {
  const pattern = shouldConditionUseArray(operator, blockKind)
    ? `X ${conditionValueSeparator} X ${conditionValueSeparator} ...`
    : `X`
  const re = conditionValuePlaceholderPatternRegex
  switch (blockKind) {
    case 'date':
      return pattern.replace(re, 'DD-MM-YYYY')
    case 'date_time':
      return pattern.replace(re, 'DD-MM-YYYY hh:mm')
    default:
      return pattern.replace(re, 'Value')
  }
}
export const getFormattedConditionValue = (
  value: FormBlockCondition['value'],
  operator: FormBlockCondition['operator'],
  blockKind: FormBlock['kind']
): string => {
  return shouldConditionUseArray(operator, blockKind) && Array.isArray(value)
    ? value.join(` ${conditionValueSeparator} `)
    : (value as string)
}

export const getStepIds = (steps: FormStep[] = []): string[] =>
  steps.map(prop('id')).filter(notEq(finalFormStepId))

export const getBlockIdsByStepId = (steps: FormStep[] = []): BlockIdsByStepId =>
  steps.reduce(
    (acc, step) => ({ ...acc, [step.id]: (step.blocks || []).map(prop('id')) }),
    {}
  )

const isEmptyConditions = (conditions: FormBlock['conditions']): boolean => {
  if (!conditions) return true
  if (!(conditions['$and'] || []).length && !(conditions['$or'] || []).length) {
    return true
  }
  return false
}

export const getBlocksById = (steps: FormStep[] = []): BlocksById =>
  steps
    .map((x) => x.blocks)
    .flat()
    .reduce(
      (acc, block) => ({
        ...acc,
        [block.id]: {
          ...block,
          text: block.text || null,
          conditions: isEmptyConditions(block.conditions)
            ? null
            : block.conditions,
        },
      }),
      {}
    )

export const getEmptyOption = (): FormBlockOption => ({
  id: generateId(8, 'option_'),
  label: '',
  value: '',
})

export const getEmptyCondition = (
  data: Partial<FormBlockCondition> = {}
): FormBlockCondition => ({
  id: generateId(8, 'cond_'),
  blockId: 'none',
  operator: '$eq',
  value: '',
  ...data,
})

export const getFinalStepData = (steps: FormStep[] = []): FinalStepData => {
  const result: FinalStepData = { text: '', actions: [] }
  const finalStep = steps.find(propEq('id', finalFormStepId))
  if (!finalStep) {
    return result
  }
  result.actions = (finalStep.finalActions || []).map((x) => {
    if (!x.id) {
      return { ...x, id: x.id || generateId(8, 'fsact_') }
    }
    return x
  })
  const block = (finalStep.blocks || [])[0]
  if (block) {
    result.text = block.text || ''
  }
  return result
}

export function removeAtIndex(array: any[], index: number) {
  return [...array.slice(0, index), ...array.slice(index + 1)]
}

export function insertAtIndex(array: any[], index: number, item: any) {
  return [...array.slice(0, index), item, ...array.slice(index)]
}

export function arrayMove(array: any[], oldIndex: number, newIndex: number) {
  return dndKitArrayMove(array, oldIndex, newIndex)
}

export const buildOutput: OutputBuilder = (
  stepIds,
  blocksById,
  groupedBlocks,
  finalStepData
) => {
  let result: FormStep[] = stepIds.reduce((stepsAcc, stepId) => {
    const blocks = groupedBlocks[stepId].reduce((acc, blockId) => {
      const block = blocksById[blockId]
      const resultBlock = { ...block }

      // Skip empty blocks
      if (block.type === 'input') {
        if (!block.title || !block.label) {
          return acc
        }
      } else if (block.type === 'content') {
        if (!block.text) {
          return acc
        }
      }

      // Conditions
      if (isEmptyConditions(block.conditions)) {
        delete resultBlock['conditions']
      } else {
        const andConditions = block.conditions?.$and || []
        const orConditions = block.conditions?.$or || []
        const allConditions = [andConditions, orConditions].map((conditions) =>
          conditions.reduce((acc, c) => {
            if (!c.blockId || !c.operator || !c.value) {
              return acc
            }
            const refBlockKind = blocksById[c.blockId]?.kind
            const shouldUseArray = shouldConditionUseArray(
              c.operator,
              refBlockKind
            )
            const value: string | string[] =
              shouldUseArray && typeof c.value === 'string'
                ? c.value.split(conditionValueSeparator).map(trim)
                : c.value
            return acc.concat({ ...c, value })
          }, [] as FormBlockCondition[])
        )
        resultBlock.conditions = {
          $and: allConditions[0],
          $or: allConditions[1],
        }
      }

      // Options
      if (!['checkbox', 'select', 'radio'].includes(block.kind || '')) {
        delete resultBlock['options']
      } else {
        const options = (block.options || []).filter(prop('value'))
        if (!options.length) {
          return acc
        }
        resultBlock.options = options
      }

      return acc.concat(resultBlock)
    }, [] as FormBlock[])
    return blocks.length
      ? stepsAcc.concat({
          id: stepId,
          blocks,
        })
      : stepsAcc
  }, [] as FormStep[])
  if (finalStepData.text || finalStepData.actions.length) {
    const finalStep: FormStep = {
      id: finalFormStepId,
      finalActions: finalStepData.actions || [],
      blocks: [
        {
          id: finalFormStepId,
          type: 'content',
          text: finalStepData.text || '',
        },
      ],
    }
    result = result.concat(finalStep)
  }
  return result
}
