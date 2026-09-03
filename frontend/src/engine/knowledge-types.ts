import type { ResearchSource } from './research-parse.ts'

export const PACK_CAP = 12
export const CLAIM_CAP = 24
export const PACK_SUMMARY_MAX = 800
export const CLAIM_MAX = 240
export const KNOWLEDGE_BLOCK_CLAIMS = 8

export type KnowledgeOrigin = 'research' | 'note' | 'doc' | 'paste' | 'user'

export type KnowledgeClaim = {
  id: string
  text: string
  source_urls: string[]
  user_ok: boolean
}

export type KnowledgePack = {
  id: string
  topic: string
  title: string
  aliases: string[]
  summary: string
  claims: KnowledgeClaim[]
  sources: ResearchSource[]
  origin: KnowledgeOrigin
  taught_at: string
  updated_at: string
  user_ok: boolean
}

export type KnowledgeHarvest = {
  topic: string
  title: string
  text: string
  sources: ResearchSource[]
  at: number
}
