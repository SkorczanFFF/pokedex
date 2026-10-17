import type { TypeResource } from "@/types/damage";
import { get } from "./client";

/**
 * One type's damage relations, today's and every earlier set. The chart is
 * eighteen of these — one request per type rather than a table written from
 * memory, because the relations have changed four times across the
 * generations and PokéAPI dates every change.
 */
export const getType = (name: string): Promise<TypeResource> =>
  get<TypeResource>(`type/${name}`, `Failed to fetch type ${name}`);
