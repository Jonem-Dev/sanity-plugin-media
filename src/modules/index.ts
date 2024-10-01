import {
  ActionFromReducersMapObject,
  Reducer,
  StateFromReducersMapObject,
  combineReducers
} from '@reduxjs/toolkit'
import {combineEpics} from 'redux-observable'

import assetsReducer, {
  assetsDeleteEpic,
  assetsDirectoriesAddEpic,
  assetsDirectoriesRemoveEpic,
  assetsFetchAfterDeleteAllEpic,
  assetsFetchEpic,
  assetsFetchNextPageEpic,
  assetsFetchPageIndexEpic,
  assetsListenerCreateQueueEpic,
  assetsListenerDeleteQueueEpic,
  assetsListenerUpdateQueueEpic,
  assetsOrderSetEpic,
  assetsSearchEpic,
  assetsSortEpic,
  assetsTagsAddEpic,
  assetsTagsRemoveEpic,
  assetsUnpickEpic,
  assetsUpdateEpic
} from './assets'
import debugReducer from './debug'
import dialogReducer, {
  dialogClearOnAssetUpdateEpic,
  dialogDirectoryCreateEpic,
  dialogDirectoryDeleteEpic,
  dialogTagCreateEpic,
  dialogTagDeleteEpic
} from './dialog'
import selectedReducer from './selected'
import notificationsReducer, {
  notificationsAssetsDeleteErrorEpic,
  notificationsAssetsDeleteCompleteEpic,
  notificationsAssetsTagsAddCompleteEpic,
  notificationsAssetsTagsRemoveCompleteEpic,
  notificationsAssetsUpdateCompleteEpic,
  notificationsGenericErrorEpic,
  notificationsTagCreateCompleteEpic,
  notificationsTagDeleteCompleteEpic,
  notificationsTagUpdateCompleteEpic,
  notificationsDirectoryCreateCompleteEpic,
  notificationsDirectoryDeleteCompleteEpic,
  notificationsDirectoryUpdateCompleteEpic
} from './notifications'
import searchReducer, {searchFacetTagUpdateEpic} from './search'
import tagsReducer, {
  tagsCreateEpic,
  tagsDeleteEpic,
  tagsFetchEpic,
  tagsListenerCreateQueueEpic,
  tagsListenerDeleteQueueEpic,
  tagsListenerUpdateQueueEpic,
  tagsSortEpic,
  tagsUpdateEpic
} from './tags'
import uploadsReducer, {
  uploadsAssetStartEpic,
  uploadsAssetUploadEpic,
  uploadsCheckRequestEpic,
  uploadsCompleteQueueEpic
} from './uploads'
import directoriesReducer, {
  directoriesCreateEpic,
  directoriesDeleteEpic,
  directoriesFetchEpic,
  directoriesListenerCreateQueueEpic,
  directoriesListenerDeleteQueueEpic,
  directoriesListenerUpdateQueueEpic,
  directoriesSortEpic,
  directoriesUpdateEpic
} from './directories'

export const rootEpic = combineEpics(
  assetsDeleteEpic,
  assetsFetchEpic,
  assetsFetchAfterDeleteAllEpic,
  assetsFetchNextPageEpic,
  assetsFetchPageIndexEpic,
  assetsListenerCreateQueueEpic,
  assetsListenerDeleteQueueEpic,
  assetsListenerUpdateQueueEpic,
  assetsOrderSetEpic,
  assetsSearchEpic,
  assetsSortEpic,
  assetsTagsAddEpic,
  assetsTagsRemoveEpic,
  assetsDirectoriesAddEpic,
  assetsDirectoriesRemoveEpic,
  assetsUnpickEpic,
  assetsUpdateEpic,
  dialogClearOnAssetUpdateEpic,
  dialogTagCreateEpic,
  dialogDirectoryCreateEpic,
  dialogTagDeleteEpic,
  dialogDirectoryDeleteEpic,
  notificationsAssetsDeleteErrorEpic,
  notificationsAssetsDeleteCompleteEpic,
  notificationsAssetsTagsAddCompleteEpic,
  notificationsAssetsTagsRemoveCompleteEpic,
  notificationsAssetsUpdateCompleteEpic,
  notificationsGenericErrorEpic,
  notificationsTagCreateCompleteEpic,
  notificationsDirectoryCreateCompleteEpic,
  notificationsTagDeleteCompleteEpic,
  notificationsDirectoryDeleteCompleteEpic,
  notificationsTagUpdateCompleteEpic,
  notificationsDirectoryUpdateCompleteEpic,
  searchFacetTagUpdateEpic,
  tagsCreateEpic,
  tagsDeleteEpic,
  tagsFetchEpic,
  tagsListenerCreateQueueEpic,
  tagsListenerDeleteQueueEpic,
  tagsListenerUpdateQueueEpic,
  tagsSortEpic,
  tagsUpdateEpic,
  directoriesCreateEpic,
  directoriesDeleteEpic,
  directoriesFetchEpic,
  directoriesListenerCreateQueueEpic,
  directoriesListenerDeleteQueueEpic,
  directoriesListenerUpdateQueueEpic,
  directoriesSortEpic,
  directoriesUpdateEpic,
  uploadsAssetStartEpic,
  uploadsAssetUploadEpic,
  uploadsCheckRequestEpic,
  uploadsCompleteQueueEpic
)

const reducers = {
  assets: assetsReducer,
  debug: debugReducer,
  dialog: dialogReducer,
  notifications: notificationsReducer,
  search: searchReducer,
  selected: selectedReducer,
  tags: tagsReducer,
  directories: directoriesReducer,
  uploads: uploadsReducer
}

type ReducersMapObject = typeof reducers

// Workaround to avoid `$CombinedState` ts errors
// source: https://github.com/reduxjs/redux-toolkit/issues/2068#issuecomment-1130796500
// TODO: remove once we use `redux-toolkit` v2
export const rootReducer: Reducer<
  StateFromReducersMapObject<ReducersMapObject>,
  ActionFromReducersMapObject<ReducersMapObject>
> = combineReducers(reducers)
