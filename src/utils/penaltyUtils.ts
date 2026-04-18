export function calculatePenalty(logic, errors, completionRate) {
  if (!logic || errors === 0) return 0;
  switch (logic.type) {
    case 'fixed':
      return errors * (logic.fixedPoints ?? 1);
    case 'percentage':
      return Math.round(completionRate * (logic.percentPerError ?? 1) / 100 * errors);
    case 'tiered': {
      if (!logic.tiers) return 0;
      let totalPenalty = 0;
      let remaining = errors;
      for (const tier of logic.tiers) {
        if (remaining <= 0) break;
        const inTier = Math.min(remaining, tier.maxErrors - tier.minErrors + 1);
        if (errors >= tier.minErrors) {
          totalPenalty += inTier * tier.deduction;
          remaining -= inTier;
        }
      }
      return totalPenalty;
    }
    case 'cap': {
      const raw = errors * (logic.fixedPoints ?? 1);
      return Math.min(raw, logic.maxDeduction ?? raw);
    }
    default:
      return errors;
  }
}
