import { useMutation, useQueryClient } from '@tanstack/react-query'
import { characterApi } from '../api/characterApi'
import type { CharacterSummary, SpellSlotInput, CurrencyUpdate } from '../types/character'

// 角色即時狀態編輯的 mutation hooks（6.2 即時狀態編輯）。
//
// 模式：後端各 mutation 端點都回「更新後的完整 CharacterSummary」→
//   onSuccess 直接 setQueryData 寫入 detail 快取（伺服器回應為準，一次 round-trip 即時反映）
//   + invalidate 清單（HP/名稱等清單也顯示）。
// 刻意不採 optimistic onMutate/rollback：web 網路穩定 + 後端回完整狀態，
//   setQueryData 已足夠即時，免去 rollback 複雜度。後續欄位編輯複用此 helper。
function useCharacterStateMutation<TVars>(
  id: string,
  fn: (vars: TVars) => Promise<CharacterSummary>,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (updated) => {
      qc.setQueryData(['character', id], updated)
      qc.invalidateQueries({ queryKey: ['characters'] })
    },
  })
}

/** HP：delta 帶正負（治療/傷害）；tempHp=true 作用於暫時 HP。 */
export function useUpdateHp(id: string) {
  return useCharacterStateMutation<{ delta: number; tempHp: boolean }>(
    id, ({ delta, tempHp }) => characterApi.updateHp(id, delta, tempHp),
  )
}

/** 貨幣：5 幣別絕對值覆寫（PATCH /currency）。 */
export function useUpdateCurrency(id: string) {
  return useCharacterStateMutation<CurrencyUpdate>(
    id, (body) => characterApi.updateCurrency(id, body),
  )
}

/** 法術環位：全量替換快照（PUT /spell-slots）。 */
export function useUpdateSpellSlots(id: string) {
  return useCharacterStateMutation<SpellSlotInput[]>(
    id, (slots) => characterApi.updateSpellSlots(id, slots),
  )
}
