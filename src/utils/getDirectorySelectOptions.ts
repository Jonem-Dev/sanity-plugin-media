import {DirectoryItem, DirectorySelectOption} from '@types'

const getDirectorySelectOptions = (directory: DirectoryItem): DirectorySelectOption => {
  return {
    label: directory?.directory?.name,
    value: directory?.directory?._id
  }
}

export default getDirectorySelectOptions
