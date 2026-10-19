import { useState } from "react";

export type Edits = Readonly<Record<string, number>>;

/**
 * Numbers a reader typed over computed ones, forgotten the moment what they
 * were typed over changes — `basis` names that: another Pokémon, another level,
 * another era. Clearing a field forgets that one, so the computed value comes
 * back. No effect, and nothing to reset: a basis that no longer matches simply
 * reads as empty.
 */
export const useEdited = (basis: string) => {
  const [state, setState] = useState<{ basis: string; values: Edits }>({
    basis,
    values: {},
  });
  const values: Edits = state.basis === basis ? state.values : {};
  const edit = (name: string, value: number | null) => {
    const next: Record<string, number> = { ...values };
    if (value === null) delete next[name];
    else next[name] = value;
    setState({ basis, values: next });
  };
  return [values, edit] as const;
};
