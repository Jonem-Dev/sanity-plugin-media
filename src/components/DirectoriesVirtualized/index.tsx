import {Flex, Label} from '@sanity/ui'
import {DirectoryActions, DirectoryItem} from '@types'
import React, {memo, useState} from 'react'
import {Virtuoso} from 'react-virtuoso'
import {PANEL_HEIGHT} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import {selectAssetsPicked} from '../../modules/assets'
import Directory from '../Directory'
import {selectDirectories} from '../../modules/directories'

const VirtualRow = memo(
  ({
    isScrolling,
    item
  }: {
    isScrolling?: boolean
    item:
      | string
      | (DirectoryItem & {
          actions: DirectoryActions[]
        })
  }) => {
    // Render label
    if (typeof item === 'string') {
      return (
        <Flex
          align="center"
          justify="space-between"
          key={item}
          paddingX={3}
          style={{height: `${PANEL_HEIGHT}px`}}
        >
          <Label size={0}>{item}</Label>
        </Flex>
      )
    }

    // Render directory - only display actions if we're not in the process of scrolling
    return (
      <Directory
        actions={isScrolling ? undefined : item.actions}
        key={item.directory?._id}
        directory={item}
      />
    )
  }
)

const DirectoriesVirtualized = () => {
  const assetsPicked = useTypedSelector(selectAssetsPicked)
  const directories = useTypedSelector(selectDirectories)

  // State
  const [isScrolling, setIsScrolling] = useState(false)

  // Filter out all directory IDS used (across all) and dedupe
  const pickedDirectoryIds = assetsPicked?.reduce((acc: string[], val) => {
    const assetDirectoryIds = val?.asset?.opt?.media?.directory?._ref
    if (assetDirectoryIds) {
      acc.push(assetDirectoryIds)
    }

    return acc
  }, [])
  const pickedDirectoryIdsUnique = [...new Set(pickedDirectoryIds)]

  // Segment tags into two buckets:
  // 1. those which exist in all picked assets ('applied to all')
  // 2. those which exist in some picked assets ('applied to some')
  const directoryIdsSegmented = pickedDirectoryIdsUnique.reduce(
    (acc: {appliedToAll: string[]; appliedToSome: string[]}, directoryId) => {
      const directoryIsInEveryAsset = assetsPicked.every(assetItem => {
        const directoryIndex =
          assetItem.asset.opt?.media?.tags?.findIndex(
            directory => directory._ref === directoryId
          ) ?? -1
        return directoryIndex >= 0
      })

      if (directoryIsInEveryAsset) {
        acc.appliedToAll.push(directoryId)
      } else {
        acc.appliedToSome.push(directoryId)
      }

      return acc
    },
    {
      appliedToAll: [],
      appliedToSome: []
    }
  )

  const directoriesAppliedToAll = directories
    .filter(directory => directoryIdsSegmented.appliedToAll.includes(directory.directory._id))
    .map(directoryItem => ({
      ...directoryItem,
      actions: ['delete', 'edit', 'removeAll', 'search'] as DirectoryActions[]
    }))
  const directoriesAppliedToSome = directories
    .filter(directory => directoryIdsSegmented.appliedToSome.includes(directory.directory._id))
    .map(directoryItem => ({
      ...directoryItem,
      actions: ['applyAll', 'delete', 'edit', 'removeAll', 'search'] as DirectoryActions[]
    }))
  const directoriesUnused = directories
    .filter(directory => !pickedDirectoryIdsUnique.includes(directory.directory._id))
    .map(directoryItem => ({
      ...directoryItem,
      actions: ['applyAll', 'delete', 'edit', 'search'] as DirectoryActions[]
    }))

  let items: (
    | string
    | (DirectoryItem & {
        actions: DirectoryActions[]
      })
  )[] = []
  if (assetsPicked.length === 0) {
    items = directories.map(directoryItem => ({
      ...directoryItem,
      actions: ['delete', 'edit', 'search'] as DirectoryActions[]
    }))
  } else {
    if (directoriesAppliedToAll?.length > 0) {
      items = [
        ...items, //
        assetsPicked.length === 1 ? 'Used' : 'Used by all',
        ...directoriesAppliedToAll
      ]
    }
    if (directoriesAppliedToSome?.length > 0) {
      items = [
        ...items, //
        'Used by some',
        ...directoriesAppliedToSome
      ]
    }
    if (directoriesUnused?.length > 0) {
      items = [
        ...items, //
        'Unused',
        ...directoriesUnused
      ]
    }
  }

  return (
    <Virtuoso
      className="media__custom-scrollbar"
      computeItemKey={index => {
        const item = items[index]
        if (typeof item === 'string') {
          return item
        }
        return item.directory._id
      }}
      isScrolling={setIsScrolling}
      itemContent={index => {
        return <VirtualRow isScrolling={isScrolling} item={items[index]} />
      }}
      style={{flex: 1, overflowX: 'hidden'}}
      totalCount={items.length}
    />
  )
}

export default DirectoriesVirtualized
