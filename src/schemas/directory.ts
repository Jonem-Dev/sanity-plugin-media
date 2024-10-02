import {DIRECTORY_DOCUMENT_NAME} from '../constants'
import TagIcon from '../components/TagIcon'

export default {
  title: 'Media Directory',
  icon: TagIcon,
  name: DIRECTORY_DOCUMENT_NAME,
  type: 'document',
  fields: [
    {
      title: 'Name',
      name: 'name',
      type: 'string'
    },
    {
      title: 'Parent Directory',
      name: 'parent',
      type: 'reference',
      to: [{type: DIRECTORY_DOCUMENT_NAME}]
    },
    {
      title: 'Protected',
      name: 'protected',
      type: 'boolean',
      initialValue: false,
    }
  ],
  preview: {
    select: {
      name: 'name'
    },
    prepare(selection: any) {
      const {name} = selection
      return {
        media: TagIcon,
        title: name
      }
    }
  }
}
