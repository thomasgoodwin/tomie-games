export const SOCIAL_STATUS = {
  poor: { label: "Poor", maxAnnualSc: 1500 },
  modest: { label: "Modest", maxAnnualSc: 3000 },
  comfortable: { label: "Comfortable", maxAnnualSc: 6000 },
  wealthy: { label: "Wealthy", maxAnnualSc: 12000 },
  aristocratic: { label: "Aristocratic", maxAnnualSc: Infinity },
};

const statusFromAnnualIncome = (incomeCc) => {
  const sc = incomeCc / 10;
  for (const [key, tier] of Object.entries(SOCIAL_STATUS))
  {
    if (sc < tier.maxAnnualSc)
    {
      return key;
    }
  }
  return "aristocratic";
};

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

// GiG numbers: the miller keeps a sixth, milling loses 30%, feed is mostly eaten in the cold months
export const FARM = {
  millerShare: 1 / 6,
  millingLoss: 0.3,
  seasonYield: { Spring: 0.75, Summer: 1.5, Autumn: 1.25, Winter: 0 },
  feedWeight: { Spring: 0.2, Summer: 0.15, Autumn: 0.25, Winter: 0.4 },
  annualFeedNeed: 7000,
  annualSeedLb: 1424,
};

// farmer Joe's 30 acres from the GiG example family: 18 cropped plus garden, homestead and 10 fallow
export const CROPS = {
  wheat: { acres: 6, lbPerAcre: 360, pool: "grain" },
  rye: { acres: 1, lbPerAcre: 616, pool: "grain" },
  barley: { acres: 1, lbPerAcre: 528, pool: "grain" },
  corn: { acres: 2, lbPerAcre: 1568, pool: "feed" },
  hay: { acres: 1.5, lbPerAcre: 4000, pool: "feed" },
  oats: { acres: 1.5, lbPerAcre: 240, pool: "feed" },
  cabbage: { acres: 1, lbPerAcre: 2400, pool: "produce" },
  apples: { acres: 2, lbPerAcre: 1920, pool: "apples" },
  squash: { acres: 1, lbPerAcre: 3600, pool: "cash", priceCc: 0.5 },
  hemp: { acres: 1, lbPerAcre: 150, pool: "cash", priceCc: 20 },
};

export const PRICES = {
  flourLb: 5,
  breadLb: 10,
  meatLb: 2.5,
  produceLb: 0.75,
  cheeseLb: 12,
  grainLb: 3,
  feedLb: 1.25,
  ciderGal: 26,
  woolLb: 20,
  pig: 100,
  goatKid: 50,
  ox: 1200,
  sow: 100,
  goat: 80,
  hen: 10,
  sheep: 200,
};

// a family eats 2 lb of bread a day plus meat, vegetables and dairy
export const NEEDS = {
  grainLb: 312,
  meatLb: 200,
  produceLb: 800,
  cheeseLb: 91,
  minDairyGoats: 4,
};

// seasonal household costs in cc, paid to a local craftsman if there is one, else to town at a markup
export const EXPENSES = {
  tools: 50,
  containers: 80,
  clothing: 80,
  preserving: 100,
  townMarkup: 1.5,
};

export const CRAFTS = {
  miller: { label: "Miller", needsMill: true },
  smith: { label: "Smith", expense: "tools" },
  cooper: { label: "Cooper", expense: "containers" },
  weaver: { label: "Weaver", expense: "clothing" },
  butcher: { label: "Butcher" },
  carpenter: { label: "Carpenter" },
};

const CRAFT_ORDER = ["smith", "butcher", "cooper", "weaver", "carpenter", "miller"];
const CRAFT_SAVINGS_NEEDED = 5000;

// GiG property tax: 14 sc per acre plus buildings, about 460 sc a year per farmstead
export const TAX = {
  perSeasonCc: 1150,
  rates: { low: 0.5, normal: 1, high: 1.5 },
  emigrateChance: 0.3,
};

export const CARAVAN = {
  incomeMult: 1.5,
  robberyChance: 0.25,
  guardedRobberyChance: 0.1,
  guardsNeeded: 5,
};

export const WOOL = { lbPerSheep: 6, homespunMin: 4 };

export const HEALER = { threshold: 70, costCc: 500, heal: 30 };

// GiG community service: families drill for safety at the cost of field time
export const MILITIA = { safetyPerFamily: 3, harvestFactor: 0.9 };

export const MINE = { incomeCc: 8000, raidPenalty: 15, discoverChance: 0.05, minTurn: 8 };

export const PROJECTS = {
  mill: { label: "Mill", cost: 80000, desc: "The miller's sixth stays in the village" },
  smokehouse: { label: "Smokehouse", cost: 10000, desc: "Halves preserving costs" },
  wards: { label: "Warded Fields", cost: 50000, desc: "Enchanted wards make bandits burn fewer fields" },
  homestead: { label: "New Homestead", cost: 25000, desc: "Clears 30 acres; a settler family arrives", repeatable: true },
  mine: { label: "Iron Mine", cost: 100000, desc: "Steady treasury income, but draws bandits", needsOre: true },
};

const CARPENTER_DISCOUNT = 0.8;

export const BASE_LIVESTOCK = { ox: 1, goats: 6, sows: 2, hens: 18, sheep: 4 };

const FLOUR_PER_GRAIN = (1 - FARM.millerShare) * (1 - FARM.millingLoss);
const YIELD_TOTAL = Object.values(FARM.seasonYield).reduce((sum, y) => sum + y, 0);
const GRAIN_RESERVE = NEEDS.grainLb * 2;
const PRODUCE_RESERVE = NEEDS.produceLb;
const MEAT_RESERVE = 600;
const FEED_CAP = 8000;

export const SECURITY = {
  recruitCost: 5000,
  safetyPerRetinue: 20,
  maxSafety: 95,
  retinueDeathRange: [0.5, 0.9],
  villagerDeathRange: [0.25, 0.5],
  fieldsBurnedShare: 0.5,
  wardedBurnedShare: 0.25,
  wealthKeptShare: 0.2,
  foodKeptShare: 0.5,
  livestockKeptShare: 0.5,
  oxStolenChance: 0.5,
  truceSeasons: 2,
};

export const calcSafety = (game) => {
  if (game.truce > 0)
  {
    return 100;
  }
  const militia = game.policies.militia ? game.villagers.length * MILITIA.safetyPerFamily : 0;
  const base = Math.min(SECURITY.maxSafety, game.retinue.length * SECURITY.safetyPerRetinue + militia);
  return Math.max(0, base - (game.built.mine ? MINE.raidPenalty : 0));
};

const VILLAGER_NAMES = [
  "Alric", "Bertha", "Cedric", "Dunstan", "Edith", "Falk",
  "Gisela", "Hamond", "Isolde", "Jocelin", "Kenric", "Leofa",
  "Mabel", "Odo", "Petronilla", "Rowan", "Sibyl", "Tilda",
];

const SETTLER_NAMES = [
  "Ulric", "Verena", "Wulfric", "Ysolt", "Aldred", "Brunhild", "Colby", "Demelza",
];

const STARTING_RETINUE_NAMES = ["Godfrey", "Hilda", "Osric"];

export const createRetinue = () =>
  STARTING_RETINUE_NAMES.map((name, i) => ({ id: `guard-${i}`, name }));

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const createVillager = (id, name, angle, random) => {
  const field = {
    x: 50 + Math.cos(angle) * (30 + random() * 12),
    y: 50 + Math.sin(angle) * (26 + random() * 12),
    rotation: (random() - 0.5) * 24,
  };
  return {
    id,
    name,
    occupation: "Farmer",
    craft: null,
    status: "poor",
    acres: 30,
    savings: 0,
    incomeYear: 0,
    health: 100,
    pantry: { grain: GRAIN_RESERVE, meat: 300, produce: PRODUCE_RESERVE },
    feed: 2000,
    livestock: { ...BASE_LIVESTOCK },
    piglets: 0,
    kids: 0,
    x: field.x + (random() - 0.5) * 7,
    y: field.y + (random() - 0.5) * 7,
    field,
  };
};

export const createVillagers = () => {
  const random = mulberry32(7);
  return VILLAGER_NAMES.map((name, i) =>
    createVillager(i, name, (i / VILLAGER_NAMES.length) * Math.PI * 2 + (random() - 0.5) * 0.2, random)
  );
};

export const createGame = () => ({
  turn: 0,
  villagers: createVillagers(),
  retinue: createRetinue(),
  truce: 0,
  treasury: 0,
  policies: { tax: "normal", caravans: false, militia: false },
  built: { mill: false, smokehouse: false, wards: false, mine: false },
  oreFound: false,
  pendingSettlers: 0,
  settlersArrived: 0,
  report: null,
});

export const recruitRetinue = (game) => {
  if (game.treasury < SECURITY.recruitCost || game.villagers.length === 0)
  {
    return game;
  }
  const recruit = game.villagers[Math.floor(Math.random() * game.villagers.length)];
  return {
    ...game,
    treasury: game.treasury - SECURITY.recruitCost,
    villagers: game.villagers.filter((v) => v.id !== recruit.id),
    retinue: [...game.retinue, { id: recruit.id, name: recruit.name }],
  };
};

export const projectCost = (game, key) => {
  const discount = game.villagers.some((v) => v.craft === "carpenter") ? CARPENTER_DISCOUNT : 1;
  return Math.round(PROJECTS[key].cost * discount);
};

export const canBuild = (game, key) => {
  const project = PROJECTS[key];
  if (!project.repeatable && game.built[key])
  {
    return false;
  }
  if (project.needsOre && !game.oreFound)
  {
    return false;
  }
  return game.treasury >= projectCost(game, key);
};

export const buildProject = (game, key) => {
  if (!canBuild(game, key))
  {
    return game;
  }
  const next = { ...game, treasury: game.treasury - projectCost(game, key) };
  if (key === "homestead")
  {
    next.pendingSettlers = game.pendingSettlers + 1;
  }
  else
  {
    next.built = { ...game.built, [key]: true };
  }
  return next;
};

const rollBetween = ([min, max]) => min + Math.random() * (max - min);

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const consume = (pantry, key, need) => {
  const used = Math.min(pantry[key], need);
  pantry[key] -= used;
  return need - used;
};

export const simulateSeason = (game) => {
  const season = SEASONS[game.turn % SEASONS.length];
  const share = FARM.seasonYield[season] / YIELD_TOTAL;
  const taxRate = TAX.rates[game.policies.tax];
  const report = {
    season,
    harvested: 0,
    income: 0,
    spent: 0,
    taxCollected: 0,
    flourSold: 0,
    ciderSold: 0,
    woolSold: 0,
    meatSold: 0,
    hunted: 0,
    foraged: 0,
    underfed: 0,
    starved: [],
    left: [],
    settled: [],
    newCrafts: [],
    healed: 0,
    robbed: false,
    oreFound: false,
    raid: null,
  };

  let villagers = [...game.villagers];
  let treasury = game.treasury;

  if (game.pendingSettlers > 0)
  {
    const random = mulberry32(Date.now() & 0xffff);
    for (let i = 0; i < game.pendingSettlers; i++)
    {
      const name = SETTLER_NAMES[(game.settlersArrived + i) % SETTLER_NAMES.length];
      const settler = createVillager(`settler-${game.settlersArrived + i}`, name, Math.random() * Math.PI * 2, random);
      villagers.push(settler);
      report.settled.push(name);
    }
  }

  const robbed = game.policies.caravans &&
    Math.random() < (game.retinue.length >= CARAVAN.guardsNeeded ? CARAVAN.guardedRobberyChance : CARAVAN.robberyChance);
  const saleMult = game.policies.caravans ? (robbed ? 0 : CARAVAN.incomeMult) : 1;
  report.robbed = robbed;

  const hasCraft = (craft) => villagers.some((v) => v.craft === craft);
  const craftEarnings = {};
  const earn = (craft, cc) => {
    craftEarnings[craft] = (craftEarnings[craft] || 0) + cc;
  };

  const updated = [];
  for (const villager of villagers)
  {
    const pantry = { ...villager.pantry };
    const livestock = { ...villager.livestock };
    let { feed, savings, health, piglets, kids } = villager;
    let income = 0;
    let flourMilled = 0;
    const growing = share > 0 && !villager.field.burned;
    const plowFactor = (livestock.ox > 0 ? 1 : 0.5) * (game.policies.militia ? MILITIA.harvestFactor : 1);

    // a burned field lost its seed reserve, so replanting takes pantry grain or bought seed
    if (villager.field.burned && share > 0)
    {
      const seedLb = FARM.annualSeedLb * share;
      const fromPantry = Math.min(pantry.grain, seedLb);
      pantry.grain -= fromPantry;
      const cost = Math.min(savings, (seedLb - fromPantry) * PRICES.grainLb);
      savings -= cost;
      report.spent += cost;
    }

    if (growing)
    {
      for (const crop of Object.values(CROPS))
      {
        const net = crop.acres * crop.lbPerAcre * share * plowFactor;
        report.harvested += net;
        if (crop.pool === "grain")
        {
          pantry.grain += net;
        }
        else if (crop.pool === "feed")
        {
          feed += net;
        }
        else if (crop.pool === "produce")
        {
          pantry.produce += net;
        }
        else if (crop.pool === "apples")
        {
          pantry.produce += net / 2;
          const gallons = (net / 2 / 48) * 3.25;
          income += gallons * PRICES.ciderGal * saleMult;
          report.ciderSold += gallons;
        }
        else
        {
          income += net * crop.priceCc * saleMult;
        }
      }
    }

    const feedScale =
      0.4 * (livestock.goats / BASE_LIVESTOCK.goats) +
      0.3 * (livestock.ox > 0 ? 1 : 0) +
      0.17 * (livestock.hens / BASE_LIVESTOCK.hens) +
      0.13 * (livestock.sows / BASE_LIVESTOCK.sows);
    const feedNeed = FARM.annualFeedNeed * FARM.feedWeight[season] * feedScale;
    let fedFactor = 1;
    if (feed >= feedNeed)
    {
      feed -= feedNeed;
    }
    else
    {
      let deficit = feedNeed - feed;
      feed = 0;
      const bought = Math.min(savings, deficit * PRICES.feedLb);
      savings -= bought;
      report.spent += bought;
      deficit -= bought / PRICES.feedLb;
      fedFactor = Math.max(0.4, 1 - deficit / feedNeed);
      if (season === "Winter" && fedFactor < 0.7)
      {
        livestock.goats = Math.max(0, livestock.goats - 1);
        livestock.hens = Math.max(0, livestock.hens - 4);
      }
    }

    if (season === "Spring")
    {
      piglets = livestock.sows * 4;
      kids = livestock.goats;
      const wool = livestock.sheep * WOOL.lbPerSheep;
      income += wool * PRICES.woolLb * saleMult;
      report.woolSold += wool;
    }
    pantry.meat += (livestock.hens / BASE_LIVESTOCK.hens) * 78 * fedFactor;
    if (season === "Autumn")
    {
      const pigsEaten = Math.min(piglets, 6);
      pantry.meat += pigsEaten * 80 * fedFactor;
      income += (piglets - pigsEaten) * PRICES.pig * saleMult;
      const kidsEaten = Math.min(kids, 3);
      pantry.meat += kidsEaten * 20;
      income += (kids - kidsEaten) * PRICES.goatKid * saleMult;
      piglets = 0;
      kids = 0;
    }

    let grainShort = consume(pantry, "grain", NEEDS.grainLb);
    let meatShort = consume(pantry, "meat", NEEDS.meatLb);
    let produceShort = consume(pantry, "produce", NEEDS.produceLb);
    flourMilled += (NEEDS.grainLb - grainShort) * FLOUR_PER_GRAIN;

    // cutting corners: stretch grain, hunt, forage, buy, then butcher the dairy goats
    if (produceShort > 0 && pantry.grain > 0)
    {
      const used = Math.min(produceShort, pantry.grain);
      pantry.grain -= used;
      produceShort -= used;
    }
    if (meatShort > 0)
    {
      const game_ = Math.min(meatShort, Math.random() * 80);
      meatShort -= game_;
      report.hunted += game_;
    }
    if (produceShort > 0 && season !== "Winter")
    {
      const found = Math.min(produceShort, Math.random() * 60);
      produceShort -= found;
      report.foraged += found;
    }
    const buy = (short, priceCc) => {
      const lb = Math.min(short, savings / priceCc);
      savings -= lb * priceCc;
      report.spent += lb * priceCc;
      return short - lb;
    };
    grainShort = buy(grainShort * FLOUR_PER_GRAIN, PRICES.breadLb) / FLOUR_PER_GRAIN;
    meatShort = buy(meatShort, PRICES.meatLb);
    produceShort = buy(produceShort, PRICES.produceLb);
    if (livestock.goats < NEEDS.minDairyGoats)
    {
      buy(NEEDS.cheeseLb * (NEEDS.minDairyGoats - livestock.goats) / NEEDS.minDairyGoats, PRICES.cheeseLb);
    }
    while (meatShort > 25 && livestock.goats > 0)
    {
      livestock.goats -= 1;
      meatShort = Math.max(0, meatShort - 25);
    }

    const deficit =
      0.5 * (grainShort / NEEDS.grainLb) +
      0.25 * (meatShort / NEEDS.meatLb) +
      0.25 * (produceShort / NEEDS.produceLb);
    if (deficit > 0.02)
    {
      health -= Math.round(40 * deficit);
      report.underfed += 1;
    }
    else
    {
      health = Math.min(100, health + 15);
    }
    if (health <= 0)
    {
      report.starved.push(villager.name);
      continue;
    }

    const grainSurplus = Math.max(0, pantry.grain - GRAIN_RESERVE);
    pantry.grain -= grainSurplus;
    const flour = grainSurplus * FLOUR_PER_GRAIN;
    flourMilled += flour;
    income += flour * PRICES.flourLb * saleMult;
    report.flourSold += flour;
    const produceSurplus = Math.max(0, pantry.produce - PRODUCE_RESERVE);
    pantry.produce -= produceSurplus;
    income += produceSurplus * PRICES.produceLb * saleMult;
    const meatSurplus = Math.max(0, pantry.meat - MEAT_RESERVE);
    pantry.meat -= meatSurplus;
    income += meatSurplus * PRICES.meatLb * (hasCraft("butcher") ? 1 : 0.6) * saleMult;
    report.meatSold += meatSurplus;
    feed = Math.min(feed, FEED_CAP);

    savings += income;

    const payExpense = (craft, baseCc) => {
      const local = hasCraft(craft);
      const cost = Math.min(savings, local ? baseCc : baseCc * EXPENSES.townMarkup);
      savings -= cost;
      report.spent += cost;
      if (local && villager.craft !== craft)
      {
        earn(craft, cost);
      }
    };
    payExpense("smith", EXPENSES.tools);
    payExpense("cooper", EXPENSES.containers);
    const homespun = livestock.sheep >= WOOL.homespunMin ? 0.5 : 1;
    payExpense("weaver", EXPENSES.clothing * homespun);
    const preserving = Math.min(savings, EXPENSES.preserving * (game.built.smokehouse ? 0.5 : 1));
    savings -= preserving;
    report.spent += preserving;
    if (flourMilled > 0 && game.built.mill && hasCraft("miller"))
    {
      earn("miller", flourMilled * PRICES.flourLb * FARM.millerShare);
    }
    if (hasCraft("butcher") && villager.craft !== "butcher")
    {
      earn("butcher", meatSurplus * 0.5);
    }
    if (hasCraft("carpenter") && villager.craft !== "carpenter")
    {
      const fee = Math.min(savings, 30);
      savings -= fee;
      report.spent += fee;
      earn("carpenter", fee);
    }

    const due = TAX.perSeasonCc * taxRate;
    const paid = Math.min(savings, due);
    savings -= paid;
    report.taxCollected += paid;
    if (paid < due && game.policies.tax === "high" && Math.random() < TAX.emigrateChance)
    {
      report.left.push(villager.name);
      continue;
    }

    if (livestock.ox === 0 && savings >= PRICES.ox)
    {
      savings -= PRICES.ox;
      livestock.ox = 1;
    }
    for (const [animal, price] of [["sows", PRICES.sow], ["goats", PRICES.goat], ["sheep", PRICES.sheep], ["hens", PRICES.hen]])
    {
      while (livestock[animal] < BASE_LIVESTOCK[animal] && savings >= price)
      {
        savings -= price;
        livestock[animal] += 1;
      }
    }

    report.income += income;
    const incomeYear = villager.incomeYear + income;
    const recovered = villager.field.burned && share > 0;
    updated.push({
      ...villager,
      pantry,
      livestock,
      feed,
      savings: Math.max(0, savings),
      health,
      piglets,
      kids,
      incomeYear: season === "Winter" ? 0 : incomeYear,
      status: season === "Winter" ? statusFromAnnualIncome(incomeYear) : villager.status,
      field: recovered ? { ...villager.field, burned: false } : villager.field,
    });
  }

  for (const [craft, cc] of Object.entries(craftEarnings))
  {
    const craftsman = updated.find((v) => v.craft === craft);
    if (craftsman)
    {
      craftsman.savings += cc;
      craftsman.incomeYear += cc;
      report.income += cc;
    }
  }

  for (const craft of CRAFT_ORDER)
  {
    if (updated.some((v) => v.craft === craft))
    {
      continue;
    }
    if (CRAFTS[craft].needsMill && !game.built.mill)
    {
      continue;
    }
    const candidate = updated
      .filter((v) => v.craft === null && v.savings >= CRAFT_SAVINGS_NEEDED)
      .sort((a, b) => b.savings - a.savings)[0];
    if (candidate)
    {
      candidate.craft = craft;
      candidate.occupation = `Farmer & ${CRAFTS[craft].label}`;
      report.newCrafts.push(`${candidate.name} (${CRAFTS[craft].label})`);
    }
  }

  treasury += report.taxCollected;
  if (game.built.mine)
  {
    treasury += MINE.incomeCc;
  }

  for (const v of updated)
  {
    if (v.health < HEALER.threshold && treasury >= HEALER.costCc)
    {
      treasury -= HEALER.costCc;
      v.health = Math.min(100, v.health + HEALER.heal);
      report.healed += 1;
    }
  }

  let oreFound = game.oreFound;
  if (!oreFound && game.turn >= MINE.minTurn && Math.random() < MINE.discoverChance)
  {
    oreFound = true;
    report.oreFound = true;
  }

  const baseGame = {
    ...game,
    turn: game.turn + 1,
    pendingSettlers: 0,
    settlersArrived: game.settlersArrived + report.settled.length,
    oreFound,
    report,
  };

  report.safety = calcSafety(game);

  if (game.truce > 0)
  {
    return { ...baseGame, villagers: updated, treasury, truce: game.truce - 1 };
  }

  report.roll = Math.random() * 100;

  if (report.roll <= report.safety)
  {
    return { ...baseGame, villagers: updated, treasury, truce: 0 };
  }

  const retinueLost = Math.round(game.retinue.length * rollBetween(SECURITY.retinueDeathRange));
  const villagersLost = Math.round(updated.length * rollBetween(SECURITY.villagerDeathRange));
  const survivors = shuffle([...updated]).slice(villagersLost);
  const burnedShare = game.built.wards ? SECURITY.wardedBurnedShare : SECURITY.fieldsBurnedShare;
  const burnSet = new Set(
    shuffle(survivors.map((_, i) => i)).slice(0, Math.ceil(survivors.length * burnedShare))
  );

  report.raid = { retinueLost, villagersLost, fieldsBurned: burnSet.size };

  return {
    ...baseGame,
    treasury: treasury * SECURITY.wealthKeptShare,
    truce: SECURITY.truceSeasons,
    retinue: shuffle([...game.retinue]).slice(retinueLost),
    villagers: survivors.map((villager, i) => ({
      ...villager,
      savings: villager.savings * SECURITY.wealthKeptShare,
      feed: villager.feed * SECURITY.foodKeptShare,
      pantry: {
        grain: villager.pantry.grain * SECURITY.foodKeptShare,
        meat: villager.pantry.meat * SECURITY.foodKeptShare,
        produce: villager.pantry.produce * SECURITY.foodKeptShare,
      },
      livestock: {
        ox: Math.random() < SECURITY.oxStolenChance ? 0 : villager.livestock.ox,
        goats: Math.floor(villager.livestock.goats * SECURITY.livestockKeptShare),
        sows: Math.floor(villager.livestock.sows * SECURITY.livestockKeptShare),
        hens: Math.floor(villager.livestock.hens * SECURITY.livestockKeptShare),
        sheep: Math.floor(villager.livestock.sheep * SECURITY.livestockKeptShare),
      },
      piglets: Math.floor(villager.piglets * SECURITY.livestockKeptShare),
      kids: Math.floor(villager.kids * SECURITY.livestockKeptShare),
      field: burnSet.has(i) ? { ...villager.field, burned: true } : villager.field,
    })),
  };
};

export const formatMoney = (cc) => {
  const whole = Math.round(cc);
  const sc = Math.trunc(whole / 10);
  const rest = whole % 10;
  if (sc === 0)
  {
    return `${rest} cc`;
  }
  if (rest === 0)
  {
    return `${sc.toLocaleString()} sc`;
  }
  return `${sc.toLocaleString()} sc ${rest} cc`;
};
