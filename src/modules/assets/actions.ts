import {createAction} from '@reduxjs/toolkit'
import {AssetItem, Directory, HttpError, Tag} from '../../types'

export const ASSETS_ACTIONS = {
  tagsAddComplete: createAction(
    'actions/tagsAddComplete',
    function prepare({assets, tag}: {assets: AssetItem[]; tag: Tag}) {
      return {payload: {assets, tag}}
    }
  ),
  tagsAddError: createAction(
    'actions/tagsAddError',
    function prepare({assets, error, tag}: {assets: AssetItem[]; error: HttpError; tag: Tag}) {
      return {payload: {assets, error, tag}}
    }
  ),
  tagsAddRequest: createAction(
    'actions/tagsAddRequest',
    function prepare({assets, tag}: {assets: AssetItem[]; tag: Tag}) {
      return {payload: {assets, tag}}
    }
  ),
  tagsRemoveComplete: createAction(
    'actions/tagsRemoveComplete',
    function prepare({assets, tag}: {assets: AssetItem[]; tag: Tag}) {
      return {payload: {assets, tag}}
    }
  ),
  tagsRemoveError: createAction(
    'actions/tagsRemoveError',
    function prepare({assets, error, tag}: {assets: AssetItem[]; error: HttpError; tag: Tag}) {
      return {payload: {assets, error, tag}}
    }
  ),
  tagsRemoveRequest: createAction(
    'actions/tagsRemoveRequest',
    function prepare({assets, tag}: {assets: AssetItem[]; tag: Tag}) {
      return {payload: {assets, tag}}
    }
  ),
  directoriesAddComplete: createAction(
    'actions/directoriesAddComplete',
    function prepare({assets, directory}: {assets: AssetItem[]; directory: Directory}) {
      return {payload: {assets, directory}}
    }
  ),
  directoriesAddError: createAction(
    'actions/directoriesAddError',
    function prepare({
      assets,
      error,
      directory
    }: {
      assets: AssetItem[]
      error: HttpError
      directory: Directory
    }) {
      return {payload: {assets, error, directory}}
    }
  ),
  directoriesAddRequest: createAction(
    'actions/directoriesAddRequest',
    function prepare({assets, directory}: {assets: AssetItem[]; directory: Directory}) {
      console.log('ASSET_ACTIONS')
      return {payload: {assets, directory}}
    }
  ),
  directoriesRemoveComplete: createAction(
    'actions/directoriesRemoveComplete',
    function prepare({assets, directory}: {assets: AssetItem[]; directory: Directory}) {
      return {payload: {assets, directory}}
    }
  ),
  directoriesRemoveError: createAction(
    'actions/directoriesRemoveError',
    function prepare({
      assets,
      error,
      directory
    }: {
      assets: AssetItem[]
      error: HttpError
      directory: Directory
    }) {
      return {payload: {assets, error, directory}}
    }
  ),
  directoriesRemoveRequest: createAction(
    'actions/directoriesRemoveRequest',
    function prepare({assets, directory}: {assets: AssetItem[]; directory: Directory}) {
      return {payload: {assets, directory}}
    }
  )
}
