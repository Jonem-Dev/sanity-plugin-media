import {ArrowDownIcon, ArrowUpIcon, CloseIcon, EditIcon, SearchIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Container, Flex, Text, Tooltip} from '@sanity/ui'
import {DirectoryActions, DirectoryItem, SearchFacetInputSearchableProps} from '@types'
import React, {ReactNode} from 'react'
import {useDispatch} from 'react-redux'
import styled from 'styled-components'
import {inputs} from '../../config/searchFacets'
import {PANEL_HEIGHT} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import {selectAssetsPicked} from '../../modules/assets'
import {dialogActions} from '../../modules/dialog'
import {DIALOG_ACTIONS} from '../../modules/dialog/actions'
import {searchActions, selectIsSearchFacetDirectory} from '../../modules/search'

type Props = {
  actions?: DirectoryActions[]
  directory: DirectoryItem
}

const DirectoryContainer = styled(Flex)`
  height: ${PANEL_HEIGHT}px;
`

const ButtonContainer = styled(Flex)`
  @media (pointer: fine) {
    visibility: hidden;
  }

  @media (hover: hover) and (pointer: fine) {
    ${DirectoryContainer}:hover & {
      visibility: visible;
    }
  }
`

type DirectoryButtonProps = {
  disabled?: boolean
  icon: ReactNode
  onClick: () => void
  tone?: 'critical' | 'primary'
  tooltip: string
}

const DirectoryButton = (props: DirectoryButtonProps) => {
  const {disabled, icon, onClick, tone, tooltip} = props

  return (
    <Tooltip
      content={
        <Container padding={2} width={0}>
          <Text muted size={1}>
            {tooltip}
          </Text>
        </Container>
      }
      disabled={'ontouchstart' in window}
      placement="top"
      portal
    >
      <Button
        disabled={disabled}
        fontSize={1}
        icon={icon}
        mode="bleed"
        onClick={onClick}
        padding={2}
        tone={tone}
      />
    </Tooltip>
  )
}

const Directory = (props: Props) => {
  const {actions, directory} = props

  // Redux
  const dispatch = useDispatch()
  const assetsPicked = useTypedSelector(selectAssetsPicked)
  const isSearchFacetDirectory = useTypedSelector(state =>
    selectIsSearchFacetDirectory(state, directory?.directory?._id)
  )

  // Callbacks
  const handleSearchFacetDirectoryRemove = () => {
    dispatch(searchActions.facetsRemoveByDirectory({directoryId: directory.directory._id}))
  }

  const handleShowAddDirectoryToAssetsDialog = () => {
    dispatch(
      dialogActions.showConfirmAssetsDirectoryAdd({assetsPicked, directory: directory.directory})
    )
  }

  const handleShowRemoveDirectoryFromAssetsDialog = () => {
    dispatch(
      dialogActions.showConfirmAssetsDirectoryRemove({assetsPicked, directory: directory.directory})
    )
  }

  const handleShowDirectoryDeleteDialog = () => {
    dispatch(dialogActions.showConfirmDeleteDirectory({directory: directory.directory}))
  }

  const handleShowDirectoryEditDialog = () => {
    dispatch(DIALOG_ACTIONS.showDirectoryEdit({directoryId: directory?.directory?._id}))
  }

  const handleSearchFacetDirectoryAddOrUpdate = () => {
    const searchFacet = {
      ...inputs.directory,
      value: {
        label: directory?.directory?.name,
        value: directory?.directory?._id
      }
    } as SearchFacetInputSearchableProps

    if (isSearchFacetDirectory) {
      dispatch(
        searchActions.facetsUpdate({
          name: 'directory',
          operatorType: 'references',
          value: searchFacet.value
        })
      )
    } else {
      dispatch(searchActions.facetsAdd({facet: searchFacet}))
    }
  }

  return (
    <DirectoryContainer align="center" flex={1} justify="space-between" paddingLeft={3}>
      <Box flex={1}>
        <Text
          muted
          size={1}
          style={{
            opacity: directory?.updating ? 0.5 : 1.0,
            userSelect: 'none'
          }}
          textOverflow="ellipsis"
        >
          {directory?.directory?.name}
        </Text>
      </Box>

      <ButtonContainer align="center" style={{flexShrink: 0}}>
        {/* Search facet toggle */}
        {actions?.includes('search') && (
          <DirectoryButton
            disabled={directory?.updating}
            icon={isSearchFacetDirectory ? <CloseIcon /> : <SearchIcon />}
            onClick={
              isSearchFacetDirectory
                ? handleSearchFacetDirectoryRemove
                : handleSearchFacetDirectoryAddOrUpdate
            }
            tooltip={isSearchFacetDirectory ? 'Remove filter' : 'Filter by directory'}
          />
        )}
        {/* Edit icon */}
        {actions?.includes('edit') && (
          <DirectoryButton
            disabled={directory?.updating}
            icon={<EditIcon />}
            onClick={handleShowDirectoryEditDialog}
            tone="primary"
            tooltip="Edit directory"
          />
        )}
        {/* Apply to all */}
        {actions?.includes('applyAll') && (
          <DirectoryButton
            disabled={directory?.updating}
            icon={<ArrowUpIcon />}
            onClick={handleShowAddDirectoryToAssetsDialog}
            tone="primary"
            tooltip="Add directory to selected assets"
          />
        )}
        {/* Remove from all */}
        {actions?.includes('removeAll') && (
          <DirectoryButton
            disabled={directory?.updating}
            icon={<ArrowDownIcon />}
            onClick={handleShowRemoveDirectoryFromAssetsDialog}
            tone="critical"
            tooltip="Remove directory from selected assets"
          />
        )}

        {/* Delete icon */}
        {actions?.includes('delete') && (
          <DirectoryButton
            disabled={directory?.updating}
            icon={<TrashIcon />}
            onClick={handleShowDirectoryDeleteDialog}
            tone="critical"
            tooltip="Delete directory"
          />
        )}
      </ButtonContainer>
    </DirectoryContainer>
  )
}

export default Directory
