export type FrontmatterField = {
  key: string
  default?: string | number | boolean | string[] | Record<string, any>
}

export type OutputFormats = {
  md: boolean
  yml: boolean
  json: boolean
  csv?: boolean
}

export type MigrationOptions = {
  // Absolute base directory where outputs are written.
  // If empty, defaults to the app working directory (not recommended).
  baseDir?: string
  // Optional subfolder created under baseDir to keep outputs isolated.
  subfolder?: string
  // When true, server returns file contents and the browser writes them
  // via the File System Access API instead of server-side writing.
  clientSave?: boolean
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
