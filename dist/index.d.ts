import {AssetSourceComponentProps} from 'sanity'
import {JSX as JSX_2} from 'react/jsx-runtime'
import {Plugin as Plugin_2} from 'sanity'
import {default as React_2} from 'react'

export declare const media: Plugin_2<void | MediaToolOptions>

export declare const mediaAssetSource: {
  component: (props: AssetSourceComponentProps) => JSX_2.Element
  icon: React_2.ForwardRefExoticComponent<
    Omit<React_2.SVGProps<SVGSVGElement>, 'ref'> & React_2.RefAttributes<SVGSVGElement>
  >
  name: string
  title: string
}

export declare type MediaToolOptions = {
  maximumUploadSize?: number
  creditLine: {
    enabled: boolean
    excludeSources?: string | string[]
  }
}

export {}
