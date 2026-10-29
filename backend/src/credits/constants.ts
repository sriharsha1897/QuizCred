export const WELCOME_BONUS_CREDITS = 500;

export const CREDIT_PACKS = [
  { id: 'pack_200', credits: 200, priceLabel: '$2.00' },
  { id: 'pack_500', credits: 500, priceLabel: '$4.50' },
  { id: 'pack_1000', credits: 1000, priceLabel: '$8.00' },
] as const;

export function findPack(id: string) {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
