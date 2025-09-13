export type FrontmatterField = {
  key: string
  default?: string | number | boolean | string[] | Record<string, any>
}

export type OutputFormats = {
  md: boolean
  yml: boolean
  json: boolean
}

export type MigrationOptions = {
  contentDir: string
  mediaDir: string
  frontmatter: FrontmatterField[]
  additionalPrompt?: string
  selector?: string
  output?: OutputFormats
  slugStrategy?: 'path' | 'title'
}

export type MigrationPageResult = {
  url: string
  slug: string
  mdPath?: string
  ymlPath?: string
  jsonPath?: string
  imagesSaved: number
  status: 'ok' | 'error'
  error?: string
  logs: string[]
}

export type MigrationResponse = {
  results: MigrationPageResult[]
  logs: string[]
}

