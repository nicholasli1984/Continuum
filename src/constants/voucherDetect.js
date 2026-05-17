// Heuristic mapping of card-benefit IDs/labels to voucher kinds. Used by the
// Dashboard "available from your cards" section to surface companion vouchers,
// hotel free-night certs, and upgrade certs directly from a user's linked
// cards instead of forcing them to type each one in by hand.
//
// Returns one of: 'companion_voucher' | 'free_night' | 'upgrade_voucher'
// or null if the benefit is not a date-bound voucher (lounge passes, statement
// credits, status grants, fee rebates, etc. are not vouchers).
export function detectVoucherKind(benefitId, label) {
  const t = ((benefitId || "") + " " + (label || "")).toLowerCase();
  if (/free.?night|anniversary.?night|fourth.?night|4th.?night|night.?award/.test(t)) return "free_night";
  if (/upgrade/.test(t)) return "upgrade_voucher";
  if (/companion/.test(t)) return "companion_voucher";
  if (/travel.?together/.test(t)) return "companion_voucher";
  return null;
}

// Build potential vouchers across the user's linked cards. Returns an array of
// { source_card_id, source_benefit_id, kind, title, value_estimate, cardName }.
// Caller filters out any that already exist in user_vouchers (matched on the
// source_card_id + source_benefit_id pair) before rendering.
export function derivePotentialVouchers(linkedCards) {
  const out = [];
  (linkedCards || []).forEach(card => {
    (card.benefits || []).forEach(b => {
      const kind = detectVoucherKind(b.id, b.label);
      if (!kind) return;
      out.push({
        source_card_id: card.id,
        source_benefit_id: b.id,
        kind,
        title: b.label,
        value_estimate: b.maxValue || null,
        cardName: card.name,
      });
    });
  });
  return out;
}
