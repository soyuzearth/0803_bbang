export const BREADS = [
  { id: "redbean", name: "팥 붕어빵", shortName: "팥", fillColor: "#743322", unlockLevel: 1 },
  { id: "custard", name: "슈크림 붕어빵", shortName: "슈크림", fillColor: "#ffd76d", unlockLevel: 2 },
  { id: "choco", name: "초코 붕어빵", shortName: "초코", fillColor: "#4c2921", unlockLevel: 3 },
] as const;

export type Bread = (typeof BREADS)[number];
export type BreadId = Bread["id"];

export function getAvailableBreads(level: number): Bread[] {
  return BREADS.filter((bread) => bread.unlockLevel <= level);
}

export function getLevel(score: number) {
  if (score >= 28) return 3;
  if (score >= 10) return 2;
  return 1;
}

export function getOrderLength(level: number) {
  if (level >= 3) return 4;
  if (level >= 2) return 3;
  return 2;
}
