import { CATEGORIES, PRICE_LIST } from "./priceList";

export const CATEGORY_GROUPS = [
  { name: "Stables", categories: ["War Horses", "Riding Horses", "Work Horses", "Other Horses", "Tack & Saddles", "Horse Armor"] },
  { name: "Arms & Armor", categories: ["Knightly Weapons", "Other Weapons", "Missile Weapons", "Armor", "Helms", "Shields"] },
  { name: "Camp & Road", categories: ["Travel & War Gear", "Tents", "Carts & Carriages", "Lodging"] },
  { name: "Provisions", categories: ["Food Supplies", "Food Stalls", "Feasts (per guest)", "Livestock", "Hounds & Hawks"] },
  { name: "Finery", categories: ["Clothier", "Tailor", "Jewelry", "Luxury Goods", "Tapestries"] },
  { name: "Hire & Services", categories: ["Services", "Maester / Scribe", "Sept", "Herald", "Entertainment", "Companionship (per night)", "Waterfront"] },
];

// any category missing from the groups above still shows up, under "Other"
const grouped = new Set(CATEGORY_GROUPS.flatMap((group) => group.categories));
const ungrouped = CATEGORIES.filter((category) => !grouped.has(category));
if (ungrouped.length > 0) {
  CATEGORY_GROUPS.push({ name: "Other", categories: ungrouped });
}

export const ORDERED_CATEGORIES = CATEGORY_GROUPS.flatMap((group) => group.categories);

export const GROUP_BY_CATEGORY = Object.fromEntries(
  CATEGORY_GROUPS.flatMap((group) => group.categories.map((category) => [category, group.name]))
);

export const CATEGORY_COUNTS = Object.fromEntries(
  CATEGORIES.map((category) => [category, PRICE_LIST.filter((item) => item.category === category).length])
);

const STATS = /\s*((?:(?:Damage|Charge|Move|Armor|SIZ|HP) [0-9D+]+(?:, |\.)){2,})/;
const SOURCE = /\s*\(((?:pp?\.|Table|GM Handbook)[^)]*)\)\s*$/;

// pulls the book reference and any horse stat line out of the description so they can be shown separately
const splitDescription = (description) => {
  let text = description;
  let source = "";
  let stats = [];

  const sourceMatch = text.match(SOURCE);
  if (sourceMatch) {
    source = sourceMatch[1];
    text = text.slice(0, sourceMatch.index);
  }

  const statsMatch = text.match(STATS);
  if (statsMatch) {
    stats = statsMatch[1]
      .replace(/\.$/, "")
      .split(", ")
      .map((pair) => {
        const [label, value] = pair.split(" ");
        return { label, value };
      });
    text = (text.slice(0, statsMatch.index) + " " + text.slice(statsMatch.index + statsMatch[0].length)).trim();
  }

  return { text: text.trim(), source, stats };
};

export const DETAILS_BY_ID = Object.fromEntries(
  PRICE_LIST.map((item) => [item.id, splitDescription(item.description)])
);
