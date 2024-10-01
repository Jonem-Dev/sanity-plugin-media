import {Box, Flex, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import useTypedSelector from '../../hooks/useTypedSelector'
import {selectAssetById, selectAssetsPicked, selectAssetsPickedLength} from '../../modules/assets'
import {
  directoriesActions,
  selectActiveDirectory,
  selectDirectories
} from '../../modules/directories'
import DirectoryViewHeader from '../DirectoryViewHeader'
import {DirectoryItem} from '@types'
import {useDispatch} from 'react-redux'
import DirectoryIcon from '../DirectoryIcon'
import {searchActions} from '../../modules/search'
import {ASSETS_ACTIONS} from '../../modules/assets/actions'
import {AddIcon, ChevronDownIcon, ChevronRightIcon, TrashIcon} from '@sanity/icons'
import {dialogActions} from '../../modules/dialog'
import {DIALOG_ACTIONS} from '../../modules/dialog/actions'

const Children = ({
  level = 1,
  childDirectories
}: {
  level?: number
  childDirectories: DirectoryItem[]
}) => {
  return (
    <div
      style={{
        paddingLeft: `${level * 10}px`
      }}
    >
      {childDirectories.map(directory => (
        <Directory directory={directory} key={directory.directory._id} />
      ))}
    </div>
  )
}

const Directory = ({directory, root = false}: {root?: boolean; directory: DirectoryItem}) => {
  const directories = useTypedSelector(selectDirectories)
  const dispatch = useDispatch()
  const activeDirectory = useTypedSelector(selectActiveDirectory)

  const handleSearchFacetDirectoryAddOrUpdate = () => {
    dispatch(
      searchActions.facetsSetDirectory({
        directory: root ? null : directory
      })
    )
  }

  const handleClick = () => {
    handleSearchFacetDirectoryAddOrUpdate()
    if (!directory.open) {
      dispatch(
        directoriesActions.toggleOpen({
          directory: directory
        })
      )
    }
  }

  const toggleOpen = () => {
    dispatch(
      directoriesActions.toggleOpen({
        directory: directory
      })
    )
  }

  const handleCreateDirectory = () => {
    dispatch(
      DIALOG_ACTIONS.showDirectoryCreate({
        directory
      })
    )
  }

  const handleDeleteDirectory = () => {
    dispatch(
      dialogActions.showConfirmDeleteDirectory({
        directory: directory.directory
      })
    )
  }

  const assetsPicked = useTypedSelector(selectAssetsPicked)

  const [droppedAsset, setDroppedAsset] = useState<string | null>(null)

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setDroppedAsset(e.dataTransfer.getData('assetId'))
  }

  const [draggedOver, setDraggedOver] = useState(false)

  const handleDragOver = (over: boolean) => {
    if (over) {
      setDraggedOver(true)
    } else {
      setDraggedOver(false)
    }
  }

  const asset = useTypedSelector(state => selectAssetById(state, droppedAsset || ''))

  useEffect(() => {
    if (asset && !asset.updating) {
      const selectedAssets = assetsPicked.length > 0 ? assetsPicked : []
      selectedAssets.push(asset)
      dispatch(
        ASSETS_ACTIONS.directoriesAddRequest({
          assets: selectedAssets,
          directory: directory.directory
        })
      )
      setDroppedAsset(null)
    }
  }, [asset])

  return (
    <div className="dir-wrapper">
      <div
        className="directory"
        onDrop={handleDrop}
        onDragEnter={e => handleDragOver(true)}
        onDragLeave={e => handleDragOver(false)}
        style={{
          display: 'flex',
          cursor: 'pointer',
          paddingTop: '5px',
          paddingBottom: '5px'
        }}
      >
        <div
          onClick={handleClick}
          style={{
            fontWeight:
              activeDirectory && activeDirectory._id == directory.directory._id ? '700' : '400',
            textDecoration: draggedOver ? 'underline' : 'none'
          }}
        >
          <DirectoryIcon />
          &nbsp;
          {directory.directory.name}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            marginRight: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <>
            {!root && <TrashIcon onClick={handleDeleteDirectory} />}
            <AddIcon onClick={handleCreateDirectory} />
            {!!directory.open && directory.childDirectories && (
              <ChevronDownIcon onClick={toggleOpen} />
            )}
            {!directory.open && directory.childDirectories && (
              <ChevronRightIcon onClick={toggleOpen} />
            )}
          </>
        </div>
      </div>
      {(root || directory.open) && directory.childDirectories && (
        <Children
          childDirectories={directories.filter(d => {
            return d.parentDirectory?.directory._id === directory.directory._id
          })}
        />
      )}
    </div>
  )
}

const DirectoryView = () => {
  const numPickedAssets = useTypedSelector(selectAssetsPickedLength)
  const directories = useTypedSelector(selectDirectories)
  const fetching = useTypedSelector(state => state.directories.fetching)
  const fetchCount = useTypedSelector(state => state.directories.fetchCount)
  const fetchComplete = fetchCount !== -1
  const hasDirectories = !fetching && directories?.length > 0
  const hasPicked = !!(numPickedAssets > 0)

  const rootDirectories = directories?.filter(dir => dir.parentDirectory === null)

  return (
    <Flex direction="column" flex={1} height="fill">
      <DirectoryViewHeader
        allowCreate
        light={hasPicked}
        title={hasPicked ? 'Directories (in selection)' : 'Directories'}
      />

      {fetchComplete && !hasDirectories && (
        <Box padding={3}>
          <Text muted size={1}>
            <em>No directories</em>
          </Text>
        </Box>
      )}
      <Directory
        root
        directory={{
          _type: 'directory',
          open: false,
          childDirectories: null,
          parentDirectory: null,
          // @ts-ignore: Fake top level directory for "All Files"
          directory: {
            _id: 'root',
            name: 'All Files'
          }
        }}
      />
      {hasDirectories && (
        <>
          {rootDirectories.map(directory => {
            return <Directory key={directory.directory._id} directory={directory} />
          })}
        </>
      )}
    </Flex>
  )
}

export default DirectoryView
