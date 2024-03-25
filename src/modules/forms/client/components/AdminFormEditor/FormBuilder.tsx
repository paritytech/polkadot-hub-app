import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DraggableAttributes,
  DraggableSyntheticListeners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, MarkdownTextarea } from '#client/components/ui'
import { FormBlock, FormStep, FormBlockCondition } from '#shared/types'
import { generateId, cn } from '#client/utils'
import { notEq, propEq, propNotEq, throttle } from '#shared/utils/fp'
import {
  getConditionValuePlaceholder,
  getConditionOperators,
  getStepIds,
  getBlockIdsByStepId,
  getBlocksById,
  getEmptyOption,
  getEmptyCondition,
  getFinalStepData,
  removeAtIndex,
  insertAtIndex,
  arrayMove,
  buildOutput,
  getFormattedConditionValue,
} from './helpers'
import {
  BlocksById,
  BlockIdsByStepId,
  OnAddStep,
  OnAddBlock,
  OnRemoveBlock,
  OnChangeBlock,
  OnChangeCondition,
  OnRemoveCondition,
  OnRemoveStep,
  FinalStepData,
  ChangeHandler,
} from './types'

type Props = {
  defaultSteps?: FormStep[]
  onChange?: (steps: FormStep[]) => void
  isNew?: boolean
}
export const FormBuilder: React.FC<Props> = ({
  defaultSteps,
  onChange,
  isNew = false,
}) => {
  const [stepIds, setStepIds] = useState(getStepIds(defaultSteps))
  const [groupedBlocks, setGroupedBlocks] = useState(
    getBlockIdsByStepId(defaultSteps) as BlockIdsByStepId
  )
  const [blocksById, setBlocksById] = useState(
    getBlocksById(defaultSteps) as BlocksById
  )
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [finalStepData, setFinalStepData] = useState(
    getFinalStepData(defaultSteps)
  )

  useEffect(() => {
    setStepIds(getStepIds(defaultSteps))
    setGroupedBlocks(getBlockIdsByStepId(defaultSteps))
    setBlocksById(getBlocksById(defaultSteps))
    setFinalStepData(getFinalStepData(defaultSteps))
  }, [defaultSteps])

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor))

  const handleDragStart = useCallback(
    (ev: DragStartEvent) => setDraggedBlockId(String(ev.active.id)),
    []
  )

  const handleDragCancel = useCallback(() => setDraggedBlockId(null), [])

  const handleDragOver = useCallback((ev: DragOverEvent) => {
    const { active, over } = ev
    const overId = over?.id
    if (!overId) {
      return
    }
    const activeContainer = active.data.current?.sortable.containerId
    const overContainer = over.data.current?.sortable.containerId || over.id
    if (activeContainer !== overContainer) {
      setGroupedBlocks((groups) => {
        const activeIndex = active.data.current?.sortable.index
        const overIndex =
          over.id in groups
            ? groups[overContainer].length + 1
            : over.data.current?.sortable.index

        return moveBetweenContainers(
          groups,
          activeContainer,
          activeIndex,
          overContainer,
          overIndex,
          String(active.id)
        )
      })
    }
  }, [])

  const handleDragEnd = useCallback(
    (ev: DragEndEvent) => {
      const { active, over } = ev
      if (!over) {
        setDraggedBlockId(null)
        return
      }

      if (active.id !== over.id) {
        const activeContainer = active.data.current?.sortable.containerId
        const overContainer = over.data.current?.sortable.containerId || over.id
        const activeIndex = active.data.current?.sortable.index
        const overIndex =
          over.id in groupedBlocks
            ? groupedBlocks[overContainer].length + 1
            : over.data.current?.sortable.index

        setGroupedBlocks((groups) => {
          let newItems
          if (activeContainer === overContainer) {
            newItems = {
              ...groups,
              [overContainer]: arrayMove(
                groups[overContainer],
                activeIndex,
                overIndex
              ),
            }
          } else {
            newItems = moveBetweenContainers(
              groups,
              activeContainer,
              activeIndex,
              overContainer,
              overIndex,
              String(active.id)
            )
          }

          return newItems
        })
      }

      setDraggedBlockId(null)
    },
    [groupedBlocks]
  )

  const moveBetweenContainers = (
    items: Record<string, string[]>,
    activeContainer: string,
    activeIndex: number,
    overContainer: string,
    overIndex: number,
    item: string
  ) => {
    return {
      ...items,
      [activeContainer]: removeAtIndex(items[activeContainer], activeIndex),
      [overContainer]: insertAtIndex(items[overContainer], overIndex, item),
    }
  }

  const onAddStep: OnAddStep = useCallback(
    () => (ev) => {
      ev.preventDefault()
      const newId = generateId(8, 'step_')
      setStepIds((ids: string[]) => [...ids, newId])
      setGroupedBlocks((value: BlockIdsByStepId) => ({ ...value, [newId]: [] }))
    },
    []
  )
  const onRemoveStep: OnRemoveStep = useCallback(
    (stepId) => (ev) => {
      ev.preventDefault()
      const innerBlockIds = groupedBlocks[stepId] || []
      const innerBlocksNumber = innerBlockIds.length
      if (
        innerBlocksNumber &&
        !window.confirm(
          `Are you sure to delete page? ${innerBlocksNumber} inner block${
            innerBlocksNumber === 1 ? '' : 's'
          } will also be deleted.`
        )
      ) {
        return
      }
      setStepIds((ids: string[]) => ids.filter(notEq(stepId)))
      setGroupedBlocks((value: BlockIdsByStepId) => ({
        ...value,
        [stepId]: [],
      }))
      setBlocksById((value) => {
        const newValue = { ...value }
        innerBlockIds.forEach((blockId) => {
          delete newValue[blockId]
        })
        return newValue
      })
    },
    [groupedBlocks]
  )

  const onAddBlock: OnAddBlock = useCallback(
    (stepId) => (ev) => {
      ev.preventDefault()
      const newId = generateId(8, 'block_')
      const type = groupedBlocks[stepId].length ? 'input' : 'content'
      const newBlock: FormBlock = {
        id: newId,
        type,
        kind: 'text',
      }
      if (type === 'content') {
        newBlock.text = ''
      }
      setBlocksById((value: BlocksById) => ({ ...value, [newId]: newBlock }))
      setGroupedBlocks((value: BlockIdsByStepId) => ({
        ...value,
        [stepId]: [...value[stepId], newId],
      }))
    },
    [groupedBlocks]
  )

  const onRemoveBlock: OnRemoveBlock = useCallback(
    (stepId, blockId) => (ev) => {
      ev.preventDefault()
      const block = blocksById[blockId]
      if (
        !isNew &&
        block.type === 'input' &&
        !window.confirm(
          `Are you sure to delete question "${
            block.label || block.id
          }"? Collected data within this question won't be displayed in the final spreadsheet.`
        )
      ) {
        return
      }
      setGroupedBlocks((value: BlockIdsByStepId) => ({
        ...value,
        [stepId]: value[stepId].filter(notEq(blockId)),
      }))
      setBlocksById((value: BlocksById) => {
        const result = { ...value }
        delete result[blockId]
        for (const id in result) {
          const block = result[id]
          if (block.conditions) {
            block.conditions = {
              $and: block.conditions['$and'].filter(
                propNotEq('blockId', blockId)
              ),
              $or: block.conditions['$or'].filter(
                propNotEq('blockId', blockId)
              ),
            }
          }
        }
        return result
      })
    },
    [blocksById, isNew]
  )

  const onChangeBlock: OnChangeBlock = useCallback(
    (blockId, key) => (value) => {
      setBlocksById((blocks: BlocksById) => ({
        ...blocks,
        [blockId]: {
          ...blocks[blockId],
          [key]: value,
        },
      }))
    },
    []
  )

  const changeHandler: ChangeHandler = useCallback(
    (
      stepIds: string[],
      blocksById: BlocksById,
      groupedBlocks: BlockIdsByStepId,
      finalStepData: FinalStepData
    ) => {
      if (onChange) {
        const data: FormStep[] = buildOutput(
          stepIds,
          blocksById,
          groupedBlocks,
          finalStepData
        )
        if (data.length) {
          onChange(data)
        }
      }
    },
    [onChange]
  )

  const debouncedChangeHandler: ChangeHandler = useMemo(
    () => throttle(changeHandler, 2400),
    []
  )

  const onChangeFinalStepText = useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = ev.target.value
      setFinalStepData((x) => ({ ...x, text: value }))
    },
    []
  )
  const onAddFinalStepAction = useCallback(
    (ev: React.MouseEvent<HTMLElement>) => {
      ev.preventDefault()
      const newAction = { text: '', href: '', id: generateId(8, 'fsact_') }
      setFinalStepData((x) => ({
        ...x,
        actions: [...(x.actions || []), newAction],
      }))
    },
    []
  )
  const onRemoveFinalStepAction = useCallback(
    (actionId: string) => (ev: React.MouseEvent<HTMLElement>) => {
      ev.preventDefault()
      setFinalStepData((x) => ({
        ...x,
        actions: x.actions.filter(propNotEq('id', actionId)),
      }))
    },
    []
  )
  const onChangeFinalStepButton = useCallback(
    (actiondId: string, key: 'text' | 'href') =>
      (ev: React.ChangeEvent<HTMLInputElement>) => {
        setFinalStepData((x) => {
          const actions = x.actions.slice()
          const action = actions.find(propEq('id', actiondId))
          if (!action) return x
          action[key] = ev.target.value
          return { ...x, actions }
        })
      },
    []
  )

  useEffect(() => {
    if (onChange) {
      debouncedChangeHandler(stepIds, blocksById, groupedBlocks, finalStepData)
    }
  }, [stepIds, blocksById, groupedBlocks, finalStepData])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div>
        {stepIds.map((stepId, i) => (
          <Step
            key={stepId}
            index={i}
            id={stepId}
            blockIds={groupedBlocks[stepId]}
            blocksById={blocksById}
            onAddBlock={onAddBlock}
            onRemoveBlock={onRemoveBlock}
            onChangeBlock={onChangeBlock}
            onRemoveStep={onRemoveStep}
          />
        ))}
        <div className="flex justify-center">
          <Button
            size="small"
            color="green"
            kind="primary"
            onClick={onAddStep()}
          >
            Add page
          </Button>
        </div>
      </div>

      {/* Final step */}
      <div>
        <div className="border border-gray-400 rounded-sm px-4 mt-16 relative bg-white">
          <span
            style={{ width: 'fit-content' }}
            className="px-2 bg-white absolute -top-4 inset-x-0 mx-auto text-xm font-bold text-gray-900"
          >
            Success page
          </span>
          <div className="bg-gray-100 border border-gray-300 rounded-tiny pt-5 my-5 relative overflow-hidden">
            <div className="px-4 pb-4">
              <div className="mb-2">
                Text:
                <br />
                <MarkdownTextarea
                  defaultValue={finalStepData.text}
                  onChange={onChangeFinalStepText}
                  placeholder="Markdown content"
                />
              </div>
              <div>
                {!finalStepData.actions.length ? (
                  <Button size="small" onClick={onAddFinalStepAction}>
                    With buttons
                  </Button>
                ) : (
                  <div>
                    Buttons:
                    {finalStepData.actions.map((action) => (
                      <div key={action.id} className="mb-2">
                        <input
                          className="px-2 py-1 rounded mr-2"
                          type="text"
                          defaultValue={action.text}
                          onChange={onChangeFinalStepButton(action.id, 'text')}
                          placeholder="Text"
                        />
                        <input
                          className="px-2 py-1 rounded mr-2"
                          type="text"
                          defaultValue={action.href}
                          onChange={onChangeFinalStepButton(action.id, 'href')}
                          placeholder="URL"
                        />
                        <button
                          className="text-gray-400 hover:text-gray-600 leading-none"
                          onClick={onRemoveFinalStepAction(action.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <Button size="small" onClick={onAddFinalStepAction}>
                      Add button
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DragOverlay>
        {draggedBlockId ? (
          <Block
            stepId="~ghost_step_id~"
            blocksById={blocksById}
            block={blocksById[draggedBlockId]}
            dragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

const Block = ({
  stepId,
  block,
  blocksById,
  dragOverlay = false,
  attributes,
  listeners,
  onRemoveBlock,
  onChangeBlock,
}: {
  stepId: string
  block: FormBlock
  blocksById: BlocksById
  onRemoveBlock?: OnRemoveBlock
  onChangeBlock?: OnChangeBlock
  dragOverlay?: boolean
  attributes?: DraggableAttributes
  listeners?: DraggableSyntheticListeners
}) => {
  return (
    <div
      className={cn(
        'bg-gray-100 border border-gray-300 rounded-tiny pt-5 my-5 relative overflow-hidden',
        dragOverlay ? 'ring-blue-400 ring-4' : null
      )}
    >
      <div
        className="absolute top-1 inset-x-0 mx-auto flex justify-center items-center"
        style={{
          width: 28,
          height: 12,
          cursor: dragOverlay ? 'grabbing' : 'grab',
        }}
        {...(listeners || {})}
        {...(attributes || {})}
      >
        <svg
          width="15"
          height="9"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_13_3)">
            <path
              d="M2 5C2 5.55228 1.55228 6 1 6C0.447715 6 -1.95703e-08 5.55228 -4.37114e-08 5C-6.78525e-08 4.44772 0.447715 4 1 4C1.55228 4 2 4.44772 2 5ZM6 5C6 5.55228 5.55228 6 5 6C4.44772 6 4 5.55228 4 5C4 4.44772 4.44772 4 5 4C5.55228 4 6 4.44771 6 5ZM10 5C10 5.55228 9.55228 6 9 6C8.44772 6 8 5.55228 8 5C8 4.44771 8.44772 4 9 4C9.55228 4 10 4.44771 10 5ZM2 1C2 1.55228 1.55228 2 1 2C0.447715 2 -1.94416e-07 1.55228 -2.18557e-07 1C-2.42698e-07 0.447715 0.447715 -1.95703e-08 1 -4.37114e-08C1.55228 -6.78525e-08 2 0.447715 2 1ZM6 1C6 1.55228 5.55228 2 5 2C4.44772 2 4 1.55228 4 1C4 0.447715 4.44771 -1.94416e-07 5 -2.18557e-07C5.55228 -2.42698e-07 6 0.447715 6 1ZM10 1C10 1.55228 9.55228 2 9 2C8.44772 2 8 1.55228 8 1C8 0.447715 8.44771 -3.69261e-07 9 -3.93402e-07C9.55228 -4.17544e-07 10 0.447715 10 1Z"
              fill="rgb(156, 163, 175)"
            />
          </g>
          <defs>
            <clipPath id="clip0_13_3">
              <rect
                width="6"
                height="10"
                fill="white"
                transform="translate(0 6) rotate(-90)"
              />
            </clipPath>
          </defs>
        </svg>
      </div>
      <button
        className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 leading-none"
        onClick={onRemoveBlock ? onRemoveBlock(stepId, block.id) : undefined}
      >
        ✕
      </button>
      <BlockBuilder
        block={block}
        blocksById={blocksById}
        onChangeBlock={onChangeBlock}
      />
    </div>
  )
}

const BlockBuilder = ({
  block,
  blocksById,
  onChangeBlock,
}: {
  block: FormBlock
  blocksById: BlocksById
  onChangeBlock?: OnChangeBlock
}) => {
  const onChange = useCallback(
    (key: string) =>
      (
        ev: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        const isCheckbox = ev.target.type === 'checkbox'
        const value = isCheckbox
          ? ((ev.target as HTMLInputElement).checked as boolean)
          : ev.target.value
        return onChangeBlock ? onChangeBlock(block.id, key)(value) : undefined
      },
    [block.id, onChangeBlock]
  )

  const onChangeText = useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = ev.target.value
      return onChangeBlock ? onChangeBlock(block.id, 'text')(value) : undefined
    },
    [block.id, onChangeBlock]
  )

  const onAddOption = useCallback(
    (ev: React.MouseEvent<HTMLElement>) => {
      ev.preventDefault()
      const options = block.options || []
      const option = getEmptyOption()
      return onChangeBlock
        ? onChangeBlock(block.id, 'options')([...options, option])
        : undefined
    },
    [onChangeBlock, block.options, block.id]
  )

  const onRemoveOption = useCallback(
    (optionIndex: number) => (ev: React.MouseEvent<HTMLElement>) => {
      ev.preventDefault()
      const options = block.options || []
      options.splice(optionIndex, 1)
      return onChangeBlock
        ? onChangeBlock(block.id, 'options')(options)
        : undefined
    },
    [onChangeBlock, block.options, block.id]
  )

  const onChangeOption = useCallback(
    (optionIndex: number, key: 'label' | 'value') =>
      (ev: React.ChangeEvent<HTMLInputElement>) => {
        const options = block.options || []
        options[optionIndex].label = ev.target.value
        options[optionIndex].value = ev.target.value
        return onChangeBlock
          ? onChangeBlock(block.id, 'options')(options)
          : undefined
      },
    [onChangeBlock, block.options, block.id]
  )

  const onAddCondition = useCallback(
    (logicalOperator: '$and' | '$or') =>
      (ev: React.MouseEvent<HTMLElement>) => {
        ev.preventDefault()
        const conditions = block.conditions || { $and: [], $or: [] }
        const condition = getEmptyCondition()
        const targetConditions =
          logicalOperator === '$and' ? conditions['$and'] : conditions['$or']
        targetConditions.push(condition)
        return onChangeBlock
          ? onChangeBlock(block.id, 'conditions')(conditions)
          : undefined
      },
    [onChangeBlock, block.id, block.conditions]
  )

  const onAddConditions = useCallback(() => {
    const conditions = { $and: [], $or: [] }
    return onChangeBlock
      ? onChangeBlock(block.id, 'conditions')(conditions)
      : undefined
  }, [onChangeBlock, block.id])

  const onAddText = useCallback(() => {
    return onChangeBlock ? onChangeBlock(block.id, 'text')('') : undefined
  }, [onChangeBlock, block.id])

  const $andConditions = useMemo(
    () => block.conditions?.$and || [],
    [block, block.conditions]
  )
  const $orConditions = useMemo(
    () => block.conditions?.$or || [],
    [block, block.conditions]
  )

  const onChangeCondition: OnChangeCondition = useCallback(
    (logicalOperator, conditionId, key) => (ev) => {
      ev.preventDefault()
      const value = ev.target.value
      if (key === 'blockId' && value === 'none') return
      const conditions = block.conditions || { $and: [], $or: [] }
      const targetConditions = conditions[logicalOperator]
      const condition = targetConditions.find(propEq('id', conditionId))
      if (!condition) return
      ;(condition[key] as string) = value
      if (key !== 'value') {
        condition.value = ''
      }
      return onChangeBlock
        ? onChangeBlock(block.id, 'conditions')(conditions)
        : undefined
    },
    [onChangeBlock, block]
  )

  const onRemoveCondition: OnRemoveCondition = useCallback(
    (conditionId) => (ev) => {
      ev.preventDefault()
      const conditions = block.conditions || { $and: [], $or: [] }
      conditions['$and'] = conditions['$and'].filter(
        propNotEq('id', conditionId)
      )
      conditions['$or'] = conditions['$or'].filter(propNotEq('id', conditionId))
      return onChangeBlock
        ? onChangeBlock(block.id, 'conditions')(conditions)
        : undefined
    },
    [onChangeBlock, block.id, block.conditions]
  )

  const otherBlocks = useMemo(() => {
    const result: Array<Pick<FormBlock, 'id' | 'label' | 'kind'>> = []
    for (const id in blocksById) {
      const b = blocksById[id]
      if (b.type === 'input' && b.id !== block.id) {
        result.push({
          id,
          label: b.label || b.id,
          kind: b.kind,
        })
      }
    }
    return result
  }, [blocksById, block])

  const blockKindById = useMemo(() => {
    const result: Record<string, FormBlock['kind']> = {}
    for (const id in blocksById) {
      result[id] = blocksById[id].kind
    }
    return result
  }, [blocksById])

  return (
    <div>
      <div className="px-4 pb-4">
        <div className="mb-4">
          <span className="mr-4">
            Block type:{' '}
            <select
              className="py-1 pl-1 rounded"
              defaultValue={block.type}
              onChange={onChange('type')}
            >
              <option value="content">Content</option>
              <option value="input">Question</option>
            </select>
          </span>
          {block.type === 'input' && (
            <span>
              Input type:{' '}
              <select
                className="py-1 pl-1 rounded"
                defaultValue={block.kind}
                onChange={onChange('kind')}
              >
                <option value="text">Text</option>
                <option value="text_long">Long text</option>
                <option value="email">Email address</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="date_time">Date & Time</option>
                <option value="phone">Phone number</option>
                <option value="radio">Select (few options)</option>
                <option value="select">Select (many options)</option>
                <option value="checkbox">Multiselect</option>
              </select>
            </span>
          )}
        </div>
        <div>
          {block.type === 'input' ? (
            <div>
              <div className="mb-2 flex items-center">
                <div className="mr-2">
                  <span className="after:content-['*'] after:ml-0.5 after:mr-0.5 after:text-red-500">
                    Question
                  </span>
                  :{' '}
                </div>
                <input
                  className="py-1 px-2 rounded font-bold flex-auto"
                  type="text"
                  onChange={onChange('title')}
                  defaultValue={block.title}
                />
              </div>
              <div className="mb-2">
                <span className="after:content-['*'] after:ml-0.5 after:mr-0.5 after:text-red-500">
                  Label
                </span>
                :{' '}
                <input
                  className="py-1 px-2 rounded"
                  type="text"
                  onChange={onChange('label')}
                  defaultValue={block.label}
                />
              </div>
              {[
                'text',
                'text_long',
                'email',
                'number',
                'phone',
                'select',
              ].includes(block.kind || '') && (
                <div className="mb-2">
                  Input placeholder:{' '}
                  <input
                    className="py-1 px-2 rounded"
                    type="text"
                    onChange={onChange('placeholder')}
                    defaultValue={block.placeholder || ''}
                  />
                </div>
              )}
              <div className="mb-2">
                {block.text === null || block.text === undefined ? (
                  <Button size="small" onClick={onAddText}>
                    With text
                  </Button>
                ) : (
                  <div>
                    Text:
                    <br />
                    <MarkdownTextarea
                      defaultValue={block.text}
                      onChange={onChangeText}
                      placeholder="Markdown content"
                    />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor={`${block.id}_required`}>
                  <input
                    id={`${block.id}_required`}
                    type="checkbox"
                    defaultChecked={block.required}
                    onChange={onChange('required')}
                  />{' '}
                  Required
                </label>
              </div>
              {['select', 'radio', 'checkbox'].includes(block.kind || '') && (
                <div>
                  Options:
                  <div>
                    {(block.options || []).map((option, optionIndex) => (
                      <div key={option.id}>
                        <div className="mb-2">
                          <span className="text-gray-400">
                            #{optionIndex + 1}
                          </span>{' '}
                          <input
                            type="text"
                            className="px-2 py-1 rounded mr-2"
                            defaultValue={option.value}
                            onChange={onChangeOption(optionIndex, 'value')}
                            placeholder="Value"
                          />
                          {/* <span>
                            Label:{' '}
                            <input
                              type="text"
                              className='px-2 py-1 rounded mr-2'
                              defaultValue={option.label}
                              onChange={onChangeOption(optionIndex, 'label')}
                              placeholder="Label"
                            />
                          </span> */}
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={onRemoveOption(optionIndex)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button size="small" onClick={onAddOption}>
                    Add option
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <span className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Text
              </span>
              :
              <br />
              <MarkdownTextarea
                defaultValue={block.text || ''}
                onChange={onChangeText}
                placeholder="Markdown content"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-300 bg-gray-200 p-4">
        {!block.conditions ? (
          <Button size="small" onClick={onAddConditions}>
            With conditions
          </Button>
        ) : (
          <div>
            Conditions:
            <br />
            <br />
            <div className="border border-gray-400 rounded-tiny p-4 relative flex">
              <span className="px-1 bg-gray-200 absolute -top-2 left-2 text-xs text-gray-500">
                AND
              </span>
              <div className="flex-1 mr-2">
                <BlockConditionsBuilder
                  logicalOperator="$and"
                  conditions={$andConditions}
                  onChangeCondition={onChangeCondition}
                  otherBlocks={otherBlocks}
                  blockKindById={blockKindById}
                  onRemoveCondition={onRemoveCondition}
                />
                <div className="flex justify-center">
                  <Button size="small" onClick={onAddCondition('$and')}>
                    Add condition
                  </Button>
                </div>
              </div>
              <div className="flex-1 border border-gray-400 rounded-tiny p-4 relative">
                <span className="px-1 bg-gray-200 absolute -top-2 left-2 text-xs text-gray-500">
                  OR
                </span>
                <BlockConditionsBuilder
                  logicalOperator="$or"
                  conditions={$orConditions}
                  onChangeCondition={onChangeCondition}
                  otherBlocks={otherBlocks}
                  blockKindById={blockKindById}
                  onRemoveCondition={onRemoveCondition}
                />
                <div className="flex justify-center">
                  <Button size="small" onClick={onAddCondition('$or')}>
                    Add condition
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const BlockConditionsBuilder = ({
  logicalOperator,
  conditions,
  onChangeCondition,
  onRemoveCondition,
  otherBlocks,
  blockKindById,
}: {
  logicalOperator: '$and' | '$or'
  conditions: FormBlockCondition[]
  onChangeCondition: OnChangeCondition
  onRemoveCondition: OnRemoveCondition
  otherBlocks: Array<Pick<FormBlock, 'id' | 'label' | 'kind'>>
  blockKindById: Record<string, FormBlock['kind']>
}) => {
  return conditions ? (
    <>
      {conditions.map((condition) => (
        <div
          key={condition.id}
          className="border border-gray-300 rounded-tiny bg-gray-50 mb-4 p-4 relative"
        >
          <div className="mb-2">
            The answer on{' '}
            <select
              className="py-1 pl-1 rounded"
              defaultValue={condition.blockId || 'none'}
              onChange={onChangeCondition(
                logicalOperator,
                condition.id,
                'blockId'
              )}
            >
              <option disabled value={'none'}>
                Select question
              </option>
              {otherBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            should{' '}
            <select
              className="py-1 pl-1 rounded"
              defaultValue={condition.operator || undefined}
              onChange={onChangeCondition(
                logicalOperator,
                condition.id,
                'operator'
              )}
            >
              <option disabled value={undefined}>
                Select operator
              </option>
              {condition.blockId
                ? getConditionOperators(blockKindById[condition.blockId]).map(
                    (operator) => (
                      <option key={operator.operator} value={operator.operator}>
                        {operator.label}
                      </option>
                    )
                  )
                : null}
            </select>
          </div>
          <input
            className="px-2 py-1 rounded"
            type="text"
            value={getFormattedConditionValue(
              condition.value,
              condition.operator,
              blockKindById[condition.blockId]
            )}
            placeholder={
              condition.blockId && condition.operator
                ? getConditionValuePlaceholder(
                    condition.operator,
                    blockKindById[condition.blockId]
                  )
                : 'Value'
            }
            onChange={onChangeCondition(logicalOperator, condition.id, 'value')}
          />
          <button
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 leading-none"
            onClick={onRemoveCondition(condition.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </>
  ) : null
}

const SortableItem = ({
  stepId,
  block,
  blocksById,
  onRemoveBlock,
  onChangeBlock,
}: {
  stepId: string
  block: FormBlock
  blocksById: BlocksById
  onRemoveBlock: OnRemoveBlock
  onChangeBlock?: OnChangeBlock
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div style={{ ...style }} ref={setNodeRef}>
      <Block
        stepId={stepId}
        block={block}
        blocksById={blocksById}
        onRemoveBlock={onRemoveBlock}
        onChangeBlock={onChangeBlock}
        attributes={attributes}
        listeners={listeners}
      />
    </div>
  )
}

const Step = ({
  id,
  index,
  blockIds,
  blocksById,
  onAddBlock,
  onRemoveBlock,
  onChangeBlock,
  onRemoveStep,
}: {
  id: string
  index: number
  blockIds: string[]
  blocksById: BlocksById
  onAddBlock: OnAddBlock
  onRemoveBlock: OnRemoveBlock
  onChangeBlock: OnChangeBlock
  onRemoveStep: OnRemoveStep
}) => {
  const { setNodeRef } = useDroppable({ id })
  return (
    <SortableContext
      id={id}
      items={blockIds}
      strategy={verticalListSortingStrategy}
    >
      <div
        className="border border-gray-400 rounded-sm px-4 mb-16 _pb-4 py-4 relative bg-white"
        ref={setNodeRef}
      >
        <span
          style={{ width: 'fit-content' }}
          className="px-2 bg-white absolute -top-4 inset-x-0 mx-auto text-xm font-bold text-gray-900"
        >
          Page {index + 1}{' '}
          <button
            className="text-gray-400 hover:text-gray-600 leading-none"
            onClick={onRemoveStep(id)}
          >
            ✕
          </button>
        </span>
        {blockIds.map((blockId) => (
          <SortableItem
            key={blockId}
            stepId={id}
            blocksById={blocksById}
            block={blocksById[blockId]}
            onRemoveBlock={onRemoveBlock}
            onChangeBlock={onChangeBlock}
          />
        ))}
        <div className="flex justify-center py-4">
          <Button
            size="small"
            kind="primary"
            color="green"
            onClick={onAddBlock(id)}
          >
            Add block
          </Button>
        </div>
      </div>
    </SortableContext>
  )
}
