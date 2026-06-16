export interface AdventureLogDto {
  id: string
  characterId: string
  adventureName: string
  sessionDate: string | null
  dmName: string | null
  xpStart: number; xpGained: number; xpEnd: number
  gpStart: number | null; gpChange: number | null; gpEnd: number | null
  downtimeStart: number; downtimeGained: number; downtimeEnd: number
  renownStart: number; renownGained: number; renownEnd: number
  itemsNotes: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAdventureLogRequest {
  adventureName: string
  sessionDate?: string | null
  dmName?: string | null
  xpStart?: number; xpGained?: number; xpEnd?: number
  gpStart?: number | null; gpChange?: number | null; gpEnd?: number | null
  downtimeStart?: number; downtimeGained?: number; downtimeEnd?: number
  renownStart?: number; renownGained?: number; renownEnd?: number
  itemsNotes?: string | null
  notes?: string | null
}

export interface UpdateAdventureLogRequest {
  adventureName?: string | null
  sessionDate?: string | null
  dmName?: string | null
  xpStart?: number | null; xpGained?: number | null; xpEnd?: number | null
  gpChange?: number | null
  downtimeGained?: number | null
  renownGained?: number | null
  itemsNotes?: string | null
  notes?: string | null
}
