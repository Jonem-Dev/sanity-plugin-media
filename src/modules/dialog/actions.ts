import {createAction} from '@reduxjs/toolkit'
import {DirectoryItem} from '@types'

export const DIALOG_ACTIONS = {
  showTagCreate: createAction('dialog/showTagCreate'),
  showDirectoryCreate: createAction(
    'dialog/showDirectoryCreate',
    function prepare({directory}: {directory: DirectoryItem}) {
      return {
        payload: {
          directory
        }
      }
    }
  ),
  showTagEdit: createAction('dialog/showTagEdit', function prepare({tagId}: {tagId: string}) {
    return {
      payload: {tagId}
    }
  }),
  showDirectoryEdit: createAction(
    'dialog/showDirectoryEdit',
    function prepare({directoryId}: {directoryId: string}) {
      return {
        payload: {directoryId}
      }
    }
  )
}
