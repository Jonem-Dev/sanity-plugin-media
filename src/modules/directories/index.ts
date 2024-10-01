import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit'
import type {ClientError, Transaction} from '@sanity/client'
import type {
  Asset,
  HttpError,
  MyEpic,
  DirectoryItem,
  Directory,
  DirectorySelectOption
} from '@types'
import groq from 'groq'
import {Selector} from 'react-redux'
import {ofType} from 'redux-observable'
import {from, Observable, of} from 'rxjs'
import {bufferTime, catchError, filter, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators'
import {DIRECTORY_DOCUMENT_NAME} from '../../constants'
import debugThrottle from '../../operators/debugThrottle'
import {ASSETS_ACTIONS} from '../assets/actions'
import {DIALOG_ACTIONS} from '../dialog/actions'
import type {RootReducerState} from '../types'
import checkDirectoryName from '../../operators/checkDirectoryName'
import getDirectorySelectOptions from '../../utils/getDirectorySelectOptions'
import {searchActions} from '../search'
import {nanoid} from 'nanoid'

type DirectoriesReducerState = {
  allIds: string[]
  byIds: Record<string, DirectoryItem>
  creating: boolean
  creatingError?: HttpError
  fetchCount: number
  fetching: boolean
  fetchingError?: HttpError
  // totalCount: number
  panelVisible: boolean
  activeDirectory: Directory | null
}

const initialState = {
  allIds: [],
  byIds: {},
  creating: false,
  creatingError: undefined,
  fetchCount: -1,
  fetching: false,
  fetchingError: undefined,
  panelVisible: true,
  activeDirectory: null
} as DirectoriesReducerState

const directoriesSlice = createSlice({
  name: 'directories',
  initialState,
  extraReducers: builder => {
    builder
      .addCase(searchActions.facetsSetDirectory, (state, action) => {
        const {directory} = action.payload
        state.activeDirectory = directory ? directory.directory : null
      })
      .addCase(DIALOG_ACTIONS.showDirectoryCreate, state => {
        delete state.creatingError
      })
      .addCase(DIALOG_ACTIONS.showDirectoryEdit, (state, action) => {
        const {directoryId} = action.payload
        delete state.byIds[directoryId].error
      })
      .addMatcher(
        action =>
          [
            ASSETS_ACTIONS.directoriesAddComplete.type,
            ASSETS_ACTIONS.directoriesAddError.type,
            ASSETS_ACTIONS.directoriesRemoveComplete.type,
            ASSETS_ACTIONS.directoriesRemoveError.type
          ].includes(action.type),
        (state, action) => {
          const {directory} = action.payload
          state.byIds[directory._id].updating = false
        }
      )
      .addMatcher(
        action =>
          [
            ASSETS_ACTIONS.directoriesAddRequest.type, //
            ASSETS_ACTIONS.directoriesRemoveRequest.type
          ].includes(action.type),
        (state, action) => {
          const {directory} = action.payload
          state.byIds[directory._id].updating = true
        }
      )
  },
  reducers: {
    toggleOpen(state, action: PayloadAction<{directory: DirectoryItem}>) {
      const {directory} = action.payload
      if (state.byIds[directory.directory._id]) {
        state.byIds[directory.directory._id].open = !state.byIds[directory.directory._id].open
      }
    },
    createComplete(state, action: PayloadAction<{assetId?: string; directory: Directory}>) {
      const {directory} = action.payload
      state.creating = false
      if (!state.allIds.includes(directory._id)) {
        state.allIds.push(directory._id)
      }

      const parentDirectory = directory?.parent?._ref ? state.byIds[directory.parent._ref] : null

      state.byIds[directory._id] = {
        _type: 'directory',
        picked: false,
        directory,
        updating: false,
        parentDirectory: parentDirectory
          ? {
              _type: 'directory',
              picked: false,
              directory: parentDirectory.directory,
              updating: false
            }
          : null
      }
    },
    createError(state, action: PayloadAction<{error: HttpError; name: string}>) {
      state.creating = false
      state.creatingError = action.payload.error
    },
    createRequest(
      state,
      _action: PayloadAction<{assetId?: string; name: string; parent: DirectoryItem}>
    ) {
      state.creating = true
      delete state.creatingError
    },
    deleteComplete(state, action: PayloadAction<{directoryId: string}>) {
      const {directoryId} = action.payload
      const deleteIndex = state.allIds.indexOf(directoryId)
      if (deleteIndex >= 0) {
        state.allIds.splice(deleteIndex, 1)
      }
      delete state.byIds[directoryId]
    },
    deleteError(state, action: PayloadAction<{error: HttpError; directory: Directory}>) {
      const {error, directory} = action.payload

      const directoryId = directory?._id
      state.byIds[directoryId].error = error
      state.byIds[directoryId].updating = false
    },
    deleteRequest(state, action: PayloadAction<{directory: Directory}>) {
      const directoryId = action.payload?.directory?._id
      state.byIds[directoryId].picked = false
      state.byIds[directoryId].updating = true

      Object.keys(state.byIds).forEach(key => {
        delete state.byIds[key].error
      })
    },
    fetchComplete(state, action: PayloadAction<{directories: Directory[]}>) {
      const {directories} = action.payload

      directories?.forEach(directory => {
        if (!state.allIds.includes(directory._id)) {
          state.allIds.push(directory._id)
        }

        const existingDirectory = state.byIds[directory._id]

        state.byIds[directory._id] = {
          _type: 'directory',
          open: existingDirectory?.open || false,
          picked: false,
          directory,
          updating: false,
          parentDirectory: directory.parent
            ? {
                _type: 'directory',
                picked: false,
                directory: directory.parent,
                updating: false
              }
            : null,
          childDirectories: directories
            .filter(d => d.parent?._ref === directory._id)
            .map(d => {
              return {
                _type: 'directory',
                picked: false,
                directory: d,
                updating: false
              }
            })
        }
      })

      state.fetching = false
      state.fetchCount = directories.length || 0
      delete state.fetchingError
    },
    fetchError(state, action: PayloadAction<{error: HttpError}>) {
      const {error} = action.payload
      state.fetching = false
      state.fetchingError = error
    },
    fetchRequest: {
      reducer: (state, _action: PayloadAction<{query: string}>) => {
        state.fetching = true
        delete state.fetchingError
      },
      prepare: () => {
        // Construct query
        const query = groq`
          {
            "items": *[
              _type == "${DIRECTORY_DOCUMENT_NAME}"
              && !(_id in path("drafts.**"))
            ] {
              _createdAt,
              _updatedAt,
              _id,
              _rev,
              _type,
              name,
              parent->{
                ...,
              }
            } | order(name asc),
          }
        `
        return {payload: {query}}
      }
    },
    // Queue batch directory creation
    listenerCreateQueue(_state, _action: PayloadAction<{directory: Directory}>) {
      //
    },
    // Apply created directories (via sanity real-time events)
    listenerCreateQueueComplete(state, action: PayloadAction<{directories: Directory[]}>) {
      const {directories} = action.payload

      directories?.forEach(directory => {
        const parentDirectory = directory?.parent?._ref ? state.byIds[directory.parent._ref] : null

        state.byIds[directory._id] = {
          _type: 'directory',
          picked: false,
          directory,
          updating: false,
          parentDirectory: parentDirectory
            ? {
                _type: 'directory',
                picked: false,
                directory: parentDirectory.directory,
                updating: false
              }
            : null
        }

        if (parentDirectory) {
          state.byIds[parentDirectory.directory._id]?.childDirectories?.push(
            state.byIds[directory._id]
          )
        }
        if (!state.allIds.includes(directory._id)) {
          state.allIds.push(directory._id)
        }
      })
    },
    // Queue batch directory deletion
    listenerDeleteQueue(_state, _action: PayloadAction<{directoryId: string}>) {
      //
    },
    // Apply deleted directories (via sanity real-time events)
    listenerDeleteQueueComplete(state, action: PayloadAction<{directoryIds: string[]}>) {
      const {directoryIds} = action.payload

      directoryIds?.forEach(directoryId => {
        const deleteIndex = state.allIds.indexOf(directoryId)
        if (deleteIndex >= 0) {
          state.allIds.splice(deleteIndex, 1)
        }
        delete state.byIds[directoryId]
      })
    },
    // Queue batch directory updates
    listenerUpdateQueue(_state, _action: PayloadAction<{directory: Directory}>) {
      //
    },
    // Apply updated directories (via sanity real-time events)
    listenerUpdateQueueComplete(state, action: PayloadAction<{directories: Directory[]}>) {
      const {directories} = action.payload

      directories?.forEach(directory => {
        if (state.byIds[directory._id]) {
          state.byIds[directory._id].directory = directory
        }
      })
    },
    // Set directory panel visibility
    panelVisibleSet(state, action: PayloadAction<{panelVisible: boolean}>) {
      const {panelVisible} = action.payload
      state.panelVisible = panelVisible
    },
    // Sort all directories by name
    sort(state) {
      state.allIds.sort((a, b) => {
        const directoryA = state.byIds[a].directory.name
        const directoryB = state.byIds[b].directory.name

        if (directoryA < directoryB) {
          return -1
        } else if (directoryA > directoryB) {
          return 1
        }
        return 0
      })
    },
    updateComplete(state, action: PayloadAction<{closeDialogId?: string; directory: Directory}>) {
      const {directory} = action.payload
      state.byIds[directory._id].directory = directory
      state.byIds[directory._id].updating = false
    },
    updateError(state, action: PayloadAction<{directory: Directory; error: HttpError}>) {
      const {error, directory} = action.payload
      const directoryId = directory?._id
      state.byIds[directoryId].error = error
      state.byIds[directoryId].updating = false
    },
    updateRequest(
      state,
      action: PayloadAction<{
        closeDialogId?: string
        formData: Record<string, any>
        directory: Directory
      }>
    ) {
      const {directory} = action.payload
      state.byIds[directory?._id].updating = true
    }
  }
})

// Epics

// On directory create request:
// - async check to see if directory already exists
// - throw if directory already exists
// - otherwise, create new directory
export const directoriesCreateEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(directoriesSlice.actions.createRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {assetId, name, parent} = action.payload

      return of(action).pipe(
        debugThrottle(state.debug.badConnection),
        checkDirectoryName(client, name),
        mergeMap(() =>
          client.observable.create({
            _type: DIRECTORY_DOCUMENT_NAME,
            name: name,
            parent: {
              _type: 'reference',
              _ref: parent.directory._id
            }
          })
        ),
        mergeMap(result =>
          of(
            directoriesSlice.actions.createComplete({
              assetId,
              directory: result as any as Directory
            }),
            directoriesSlice.actions.fetchRequest()
          )
        ),
        catchError((error: ClientError) =>
          of(
            directoriesSlice.actions.createError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500
              },
              name
            })
          )
        )
      )
    })
  )

// On directory delete request
// - find referenced assets
// - remove directory from referenced assets in a sanity transaction
export const directoriesDeleteEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(directoriesSlice.actions.deleteRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {directory} = action.payload
      return of(action).pipe(
        // Optionally throttle
        debugThrottle(state.debug.badConnection),
        // Fetch directories which reference this directory as parent
        mergeMap(() =>
          client.observable.fetch<Directory[]>(
            groq`*[
              _type in ["media.directory"]
              && references(*[_type == "media.directory" && _id == $directoryId]._id)
            ] {
              _id,
              _rev,
              name,
              parent->{
                ...
              }
            }`,
            {directoryId: directory._id}
          )
        ),
        // Update all matched directories to update parent reference
        mergeMap(matchedDirectories => {
          const patches = matchedDirectories.map(matchedDirectory => {
            const patch = {
              id: matchedDirectory._id,
              patch: {
                // this will cause the transaction to fail if the document has been modified since it was fetched.
                ifRevisionID: matchedDirectory._rev
              }
            }

            if (directory.parent) {
              // @ts-ignore
              patch.patch.set = {
                parent: {
                  _key: nanoid(),
                  _type: 'reference',
                  _ref: directory?.parent?._id,
                  _weak: true
                }
              }
            } else {
              // @ts-ignore
              patch.patch.unset = [`parent`]
            }

            return patch
          })

          const transaction: Transaction = patches.reduce(
            (tx, patch) => tx.patch(patch.id, patch.patch),
            client.transaction()
          )

          return from(transaction.commit())
        }),
        // Fetch assets which reference this directory
        mergeMap(() =>
          client.observable.fetch<Asset[]>(
            groq`*[
              _type in ["sanity.fileAsset", "sanity.imageAsset"]
              && references(*[_type == "media.directory" && _id == $directoryId]._id)
            ] {
              _id,
              _rev,
              opt
            }`,
            {directoryId: directory._id}
          )
        ),
        // Create transaction which remove directory references from all matched assets and delete directory
        mergeMap(assets => {
          const patches = assets.map(asset => {
            const patch = {
              id: asset._id,
              patch: {
                // this will cause the transaction to fail if the document has been modified since it was fetched.
                ifRevisionID: asset._rev
              }
            }

            if (directory.parent) {
              // @ts-ignore
              patch.patch.set = {
                'opt.media.directory': {
                  _key: nanoid(),
                  _type: 'reference',
                  _ref: directory?.parent?._id,
                  _weak: true
                }
              }
            } else {
              // @ts-ignore
              patch.patch.unset = [`opt.media.directory`]
            }

            return patch
          })

          const transaction: Transaction = patches.reduce(
            (tx, patch) => tx.patch(patch.id, patch.patch),
            client.transaction()
          )

          transaction.delete(directory._id)

          return from(transaction.commit())
        }),
        // Dispatch complete action
        mergeMap(() => of(directoriesSlice.actions.fetchRequest())),

        catchError((error: ClientError) =>
          of(
            directoriesSlice.actions.deleteError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500
              },
              directory
            })
          )
        )
      )
    })
  )

// Async fetch directories
export const directoriesFetchEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(directoriesSlice.actions.fetchRequest.match),
    withLatestFrom(state$),
    switchMap(([action, state]) => {
      const {query} = action.payload

      return of(action).pipe(
        // Optionally throttle
        debugThrottle(state.debug.badConnection),
        // Fetch directories
        mergeMap(() =>
          client.observable.fetch<{
            items: Directory[]
          }>(query)
        ),
        // Dispatch complete action
        mergeMap(result => {
          const {items} = result
          return of(directoriesSlice.actions.fetchComplete({directories: items}))
        }),
        catchError((error: ClientError) =>
          of(
            directoriesSlice.actions.fetchError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500
              }
            })
          )
        )
      )
    })
  )

// TODO: merge all buffer epics
// Buffer directory creation via sanity subscriber
export const directoriesListenerCreateQueueEpic: MyEpic = action$ =>
  action$.pipe(
    filter(directoriesSlice.actions.listenerCreateQueue.match),
    bufferTime(2000),
    filter(actions => actions.length > 0),
    mergeMap(actions => {
      const directories = actions?.map(action => action.payload.directory)
      return of(directoriesSlice.actions.listenerCreateQueueComplete({directories}))
    })
  )

// TODO: merge all buffer epics
// Buffer directory deletion via sanity subscriber
export const directoriesListenerDeleteQueueEpic: MyEpic = action$ =>
  action$.pipe(
    filter(directoriesSlice.actions.listenerDeleteQueue.match),
    bufferTime(2000),
    filter(actions => actions.length > 0),
    mergeMap(actions => {
      const directoryIds = actions?.map(action => action.payload.directoryId)
      return of(directoriesSlice.actions.listenerDeleteQueueComplete({directoryIds}))
    })
  )

// TODO: merge all buffer epics
// Buffer directory update via sanity subscriber
export const directoriesListenerUpdateQueueEpic: MyEpic = action$ =>
  action$.pipe(
    filter(directoriesSlice.actions.listenerUpdateQueue.match),
    bufferTime(2000),
    filter(actions => actions.length > 0),
    mergeMap(actions => {
      const directories = actions?.map(action => action.payload.directory)
      return of(directoriesSlice.actions.listenerUpdateQueueComplete({directories}))
    })
  )

// On successful directory creation or updates:
// - Re-sort all directories
export const directoriesSortEpic: MyEpic = action$ =>
  action$.pipe(
    ofType(
      directoriesSlice.actions.listenerCreateQueueComplete.type,
      directoriesSlice.actions.listenerUpdateQueueComplete.type
    ),
    bufferTime(1000),
    filter(actions => actions.length > 0),
    mergeMap(() => of(directoriesSlice.actions.sort()))
  )

// On directory update request
// - check if directory name already exists
// - throw if directory already exists
// - otherwise, patch document
export const directoriesUpdateEpic: MyEpic = (action$, state$, {client}) =>
  action$.pipe(
    filter(directoriesSlice.actions.updateRequest.match),
    withLatestFrom(state$),
    mergeMap(([action, state]) => {
      const {closeDialogId, formData, directory} = action.payload

      return of(action).pipe(
        // Optionally throttle
        debugThrottle(state.debug.badConnection),
        // Check if directory name is available, throw early if not
        checkDirectoryName(client, formData?.name),
        // Patch document (Update directory)
        mergeMap(
          () =>
            from(
              client.patch(directory._id).set({name: formData?.name}).commit()
            ) as Observable<Directory>
        ),
        // Dispatch complete action
        mergeMap((updatedDirectory: Directory) => {
          return of(
            directoriesSlice.actions.updateComplete({
              closeDialogId,
              directory: updatedDirectory
            })
          )
        }),
        catchError((error: ClientError) =>
          of(
            directoriesSlice.actions.updateError({
              error: {
                message: error?.message || 'Internal error',
                statusCode: error?.statusCode || 500
              },
              directory
            })
          )
        )
      )
    })
  )

// Selectors

const selectDirectoriesByIds = (state: RootReducerState) => state.directories.byIds

const selectDirectoriesAllIds = (state: RootReducerState) => state.directories.allIds

export const selectDirectories: Selector<RootReducerState, DirectoryItem[]> = createSelector(
  [selectDirectoriesByIds, selectDirectoriesAllIds],
  (byIds, allIds) => allIds.map(id => byIds[id])
)

export const selectDirectoryById = createSelector(
  [selectDirectoriesByIds, (_state: RootReducerState, directoryId: string) => directoryId],
  (byIds, directoryId) => byIds[directoryId]
)

const selectActiveDirectoryState = (state: RootReducerState) => state.directories.activeDirectory

export const selectActiveDirectory = createSelector(
  [selectActiveDirectoryState],
  activeDirectory => activeDirectory
)

// TODO: use createSelector
// Map directory references to react-select options, skipping over items with no linked directory
export const selectDirectorySelectOptions =
  (asset?: Asset) =>
  (state: RootReducerState): DirectorySelectOption | null => {
    const directory = asset?.opt?.media?.directory
    const directoryItem = directory ? state.directories.byIds[directory._ref] : null

    if (directoryItem) {
      return getDirectorySelectOptions(directoryItem)
    }

    return null
  }

export const directoriesActions = directoriesSlice.actions

export default directoriesSlice.reducer
