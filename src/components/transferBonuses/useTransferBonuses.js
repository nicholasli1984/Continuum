import { useEffect, useState } from "react";
import { SEED_TRANSFER_BONUSES, activeBonuses, bonusesForUserCurrencies } from "../../constants/transferBonuses";

// Hook: pulls latest transfer-bonus data from Supabase row-id 'current',
// falls back to seed file if the table is empty / errors.
export function useTransferBonuses(supabase) {
  const [data, setData] = useState(SEED_TRANSFER_BONUSES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!supabase) { setLoading(false); return; }
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from("transfer_bonuses")
          .select("payload, updated_at")
          .eq("id", "current")
          .maybeSingle();
        if (cancelled) return;
        if (!error && row?.payload) {
          setData({ ...row.payload, lastUpdated: row.updated_at });
        }
      } catch (_) {
        // keep seed
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  return { data, loading, active: activeBonuses(data), forUser: (ids) => bonusesForUserCurrencies(data, ids) };
}
