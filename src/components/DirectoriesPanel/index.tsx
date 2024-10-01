import {Box} from '@sanity/ui'
import React from 'react'
import {DIRECTORIES_PANEL_WIDTH} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import TagView from '../TagView'
import DirectoryView from '../DirectoryView'

const DirectoriesPanel = () => {
  const directoriesPanelVisible = useTypedSelector(state => state.directories.panelVisible)

  if (!directoriesPanelVisible) {
    return null
  }

  return (
    <Box
      style={{
        position: 'relative',
        width: DIRECTORIES_PANEL_WIDTH
      }}
    >
      <Box
        className="media__custom-scrollbar"
        style={{
          borderLeft: '1px solid var(--card-border-color)',
          height: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          position: 'absolute',
          right: 0,
          top: 0,
          width: '100%'
        }}
      >
        <DirectoryView />
      </Box>
    </Box>
  )
}

export default DirectoriesPanel
