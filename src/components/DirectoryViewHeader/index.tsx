import {ComposeIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Label} from '@sanity/ui'
import React from 'react'
import {useDispatch} from 'react-redux'
import {useColorScheme} from 'sanity'
import {PANEL_HEIGHT} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import {DIALOG_ACTIONS} from '../../modules/dialog/actions'
import {getSchemeColor} from '../../utils/getSchemeColor'
import {selectDirectories} from '../../modules/directories'

type Props = {
  allowCreate?: boolean
  light?: boolean
  title: string
}

const DirectoryViewHeader = ({allowCreate, light, title}: Props) => {
  const {scheme} = useColorScheme()
  const directories = useTypedSelector(selectDirectories)
  const rootDirectory = directories?.find(dir => dir.parentDirectory === null)

  const dispatch = useDispatch()
  const directoriesCreating = useTypedSelector(state => state.directories.creating)
  const directoriesFetching = useTypedSelector(state => state.directories.fetching)

  const handleDirectoryCreate = () => {
    if (rootDirectory) {
      dispatch(
        DIALOG_ACTIONS.showDirectoryCreate({
          directory: rootDirectory
        })
      )
    }
  }

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        paddingLeft={3}
        style={{
          background: light ? getSchemeColor(scheme, 'bg') : 'inherit',
          borderBottom: '1px solid var(--card-border-color)',
          flexShrink: 0,
          height: `${PANEL_HEIGHT}px`
        }}
      >
        <Inline space={2}>
          <Label size={0}>{title}</Label>
          {directoriesFetching && (
            <Label size={0} style={{opacity: 0.3}}>
              Loading...
            </Label>
          )}
        </Inline>
        {/* Create new directory button */}
        {allowCreate && (
          <Box marginRight={1}>
            <Button
              disabled={directoriesCreating}
              fontSize={1} //
              icon={ComposeIcon}
              mode="bleed"
              onClick={handleDirectoryCreate}
              style={{
                background: 'transparent',
                boxShadow: 'none'
              }}
            />
          </Box>
        )}
      </Flex>
    </>
  )
}

export default DirectoryViewHeader
