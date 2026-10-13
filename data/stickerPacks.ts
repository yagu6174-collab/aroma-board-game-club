/** Merged from packs 1,3,4,5(cats),6,7,8 — local preview until user ships. */
export const MERGED_STICKERS = [
  // 1 桌边闲聊
  "😊",
  "🎲",
  "☕",
  "🌙",
  "✨",
  "🧡",
  "🫖",
  "🍪",
  // 3 派对热闹
  "🎉",
  "🥳",
  "🎊",
  "🎈",
  "🪅",
  "🤩",
  "💥",
  "🎆",
  // 4 天气心情
  "☀️",
  "🌤️",
  "🌧️",
  "🌈",
  "⭐",
  "💫",
  "🫧",
  // 5 猫咪 only
  "🐱",
  "😺",
  "😸",
  "😻",
  "🐈",
  // 6 轻松牌桌
  "♟️",
  "🧩",
  "🃏",
  "🎯",
  "🧢",
  "🪄",
  "📦",
  // 7 甜品小食
  "🍩",
  "🍰",
  "🧁",
  "🍓",
  "🍫",
  "🍬",
  "🧇",
  // 8 手势互动
  "👋",
  "👍",
  "🤞",
  "🤟",
  "👏",
  "🙌",
  "🤝",
  "✌️",
] as const;

export type StickerPackId = "merged";

export type StickerPack = {
  id: StickerPackId;
  title: string;
  note: string;
  stickers: string[];
};

export const STICKER_PACK_KEY = "aroma-sticker-pack";

export const STICKER_PACKS: StickerPack[] = [
  {
    id: "merged",
    title: "合并精选",
    note: "桌边闲聊 + 派对 + 天气 + 猫咪 + 轻松牌桌 + 甜品 + 手势（去重）。",
    stickers: [...MERGED_STICKERS],
  },
];

export function getStickerPack(_id?: string | null): StickerPack {
  return STICKER_PACKS[0]!;
}
