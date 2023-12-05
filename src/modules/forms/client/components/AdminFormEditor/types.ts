import { FormBlock, FormBlockSuccessAction, FormStep } from '#shared/types'

export type BlocksById = Record<string, FormBlock>

export type BlockIdsByStepId = Record<string, string[]>

export type OnAddStep = () => (ev: React.MouseEvent<HTMLElement>) => void

export type OnAddBlock = (
  stepId: string
) => (ev: React.MouseEvent<HTMLElement>) => void

export type OnRemoveBlock = (
  stepId: string,
  blockId: string
) => (ev: React.MouseEvent<HTMLElement>) => void

export type OnChangeBlock = (
  blockId: string,
  key: string
) => (value: any) => void

export type OnChangeCondition = (
  logicalOperator: '$and' | '$or',
  conditionId: string,
  key: 'value' | 'blockId' | 'operator'
) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void

export type OnRemoveCondition = (
  conditionId: string
) => (ev: React.MouseEvent<HTMLElement>) => void

export type OnRemoveStep = (
  stepId: string
) => (ev: React.MouseEvent<HTMLElement>) => void

export type FinalStepData = { text: string; actions: FormBlockSuccessAction[] }

export type ChangeHandler = (
  stepIds: string[],
  blocksById: BlocksById,
  groupedBlocks: BlockIdsByStepId,
  finalStepData: FinalStepData
) => void

export type OutputBuilder = (
  stepIds: string[],
  blocksById: BlocksById,
  groupedBlocks: BlockIdsByStepId,
  finalStepData: FinalStepData
) => FormStep[]
