import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { Tooltip } from "../../components/ui/tooltip";
import {
  SEASONS, SOCIAL_STATUS, SECURITY, PROJECTS, TAX, CARAVAN, MILITIA,
  calcSafety, createGame, simulateSeason, recruitRetinue, buildProject,
  canBuild, projectCost, formatMoney,
} from "./villageData";

const fmtLb = (lb) => Math.round(lb).toLocaleString();

const HoverTip = ({ content, children }) => {
  return <Tooltip showArrow openDelay={200} closeDelay={100} content={content}>
    {children}
  </Tooltip>
};

const Field = ({ field, owner }) => {
  return <HoverTip content={`${owner}'s farm, 30 acres: grain, corn & feed, orchard, cabbage, squash, hemp, 10 fallow${field.burned ? " (burned by bandits, recovering)" : ""}`}>
    <svg
      viewBox="0 0 72 48"
      width="72"
      height="48"
      style={{
        position: "absolute",
        left: `${field.x}%`,
        top: `${field.y}%`,
        transform: `translate(-50%, -50%) rotate(${field.rotation}deg)`,
      }}
    >
      <rect x="1" y="1" width="70" height="46" rx="4"
        fill={field.burned ? "#6b6258" : "#e3c876"}
        stroke={field.burned ? "#4a4239" : "#b89b4e"}
        strokeWidth="1.5"
      />
      {[9, 17, 25, 33, 41].map((y) =>
        <line key={y} x1="6" y1={y} x2="66" y2={y}
          stroke={field.burned ? "#4a4239" : "#c2a455"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  </HoverTip>
};

const StickRetinue = ({ guard, index, count }) => {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  return <HoverTip content={`${guard.name}, retinue guard`}>
    <svg
      viewBox="0 0 24 34"
      width="24"
      height="34"
      style={{
        position: "absolute",
        left: `${50 + Math.cos(angle) * 7}%`,
        top: `${50 + Math.sin(angle) * 9}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <g stroke="#5a3030" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <circle cx="10" cy="5" r="4" />
        <line x1="10" y1="9" x2="10" y2="21" />
        <line x1="10" y1="13" x2="4" y2="18" />
        <line x1="10" y1="13" x2="18" y2="14" />
        <line x1="10" y1="21" x2="5" y2="31" />
        <line x1="10" y1="21" x2="15" y2="31" />
      </g>
      <line x1="18" y1="2" x2="18" y2="32" stroke="#7a5230" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="18,1 15.5,7 20.5,7" fill="#8c8c84" />
    </svg>
  </HoverTip>
};

const Well = () => {
  return <HoverTip content="The village well">
    <svg
      viewBox="0 0 48 56"
      width="48"
      height="56"
      style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
    >
      <line x1="10" y1="14" x2="10" y2="38" stroke="#5e3d22" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="14" x2="38" y2="38" stroke="#5e3d22" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="10" x2="24" y2="27" stroke="#7a6a55" strokeWidth="1.5" />
      <rect x="19" y="27" width="10" height="7" rx="1.5" fill="#8a5a33" stroke="#5e3d22" strokeWidth="1.5" />
      <polygon points="4,16 24,2 44,16" fill="#8a5a33" stroke="#5e3d22" strokeWidth="2" strokeLinejoin="round" />
      <rect x="6" y="38" width="36" height="16" rx="6" fill="#a8a89e" stroke="#6f6f66" strokeWidth="2" />
      <line x1="18" y1="38" x2="18" y2="54" stroke="#6f6f66" strokeWidth="1.5" />
      <line x1="30" y1="38" x2="30" y2="54" stroke="#6f6f66" strokeWidth="1.5" />
    </svg>
  </HoverTip>
};

const Mill = () => {
  return <HoverTip content="The village mill keeps the miller's sixth in the village">
    <svg
      viewBox="0 0 40 48"
      width="40"
      height="48"
      style={{ position: "absolute", left: "42%", top: "40%", transform: "translate(-50%, -50%)" }}
    >
      <polygon points="12,18 28,18 25,46 15,46" fill="#b09467" stroke="#6e5a3a" strokeWidth="2" />
      <circle cx="20" cy="14" r="3" fill="#6e5a3a" />
      <g stroke="#8a6f47" strokeWidth="2.5" strokeLinecap="round">
        <line x1="20" y1="14" x2="34" y2="2" />
        <line x1="20" y1="14" x2="6" y2="2" />
        <line x1="20" y1="14" x2="34" y2="26" />
        <line x1="20" y1="14" x2="6" y2="26" />
      </g>
    </svg>
  </HoverTip>
};

const Smokehouse = () => {
  return <HoverTip content="The smokehouse preserves the village's meat for half the salt">
    <svg
      viewBox="0 0 28 34"
      width="28"
      height="34"
      style={{ position: "absolute", left: "57%", top: "42%", transform: "translate(-50%, -50%)" }}
    >
      <path d="M16 12 q-3 -4 0 -7 q3 -3 1 -5" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="6" y="16" width="16" height="16" fill="#7d6248" stroke="#54402c" strokeWidth="2" />
      <polygon points="4,16 14,8 24,16" fill="#54402c" />
    </svg>
  </HoverTip>
};

const Mine = () => {
  return <HoverTip content="The iron mine brings steady income for the treasury, but bandits have noticed">
    <svg
      viewBox="0 0 44 30"
      width="44"
      height="30"
      style={{ position: "absolute", left: "7%", top: "12%", transform: "translate(-50%, -50%)" }}
    >
      <polygon points="2,28 22,4 42,28" fill="#8d8d85" stroke="#5f5f58" strokeWidth="2" />
      <path d="M16 28 a6 7 0 0 1 12 0 z" fill="#3a3a35" />
    </svg>
  </HoverTip>
};

const WardRing = () => {
  return <div style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "34%",
    height: "42%",
    transform: "translate(-50%, -50%)",
    border: "2px dashed #8a6fc8",
    borderRadius: "50%",
    opacity: 0.45,
    pointerEvents: "none",
  }} />
};

const FarmAnimals = ({ villager }) => {
  const { ox, goats, sows, hens, sheep } = villager.livestock;
  if (goats === 0 && sows === 0 && sheep === 0)
  {
    return null;
  }
  const parts = [
    ox > 0 ? "an ox" : null,
    goats > 0 ? `${goats} goats` : null,
    sheep > 0 ? `${sheep} sheep` : null,
    sows > 0 ? `${sows} sows` : null,
    villager.piglets > 0 ? `${villager.piglets} piglets` : null,
    villager.kids > 0 ? `${villager.kids} kids` : null,
    hens > 0 ? `${hens} hens` : null,
  ].filter(Boolean);
  return <HoverTip content={`${villager.name}'s livestock: ${parts.join(", ")}`}>
    <svg
      viewBox="0 0 46 14"
      width="46"
      height="14"
      style={{ position: "absolute", left: `${villager.field.x + 3.5}%`, top: `${villager.field.y + 3.5}%` }}
    >
      {goats > 0 &&
        <g stroke="#6b5a44" strokeWidth="1.5" strokeLinecap="round" fill="none">
          <line x1="3" y1="6" x2="11" y2="6" />
          <line x1="4" y1="6" x2="4" y2="12" />
          <line x1="10" y1="6" x2="10" y2="12" />
          <line x1="11" y1="6" x2="13" y2="3" />
          <line x1="12.5" y1="3.5" x2="11.5" y2="1.5" />
        </g>
      }
      {sows > 0 &&
        <g>
          <ellipse cx="24" cy="8" rx="6" ry="4" fill="#d8a0a0" stroke="#a87070" strokeWidth="1" />
          <circle cx="30.5" cy="7.5" r="1.5" fill="#d8a0a0" stroke="#a87070" strokeWidth="1" />
          <line x1="21" y1="11.5" x2="21" y2="13.5" stroke="#a87070" strokeWidth="1.5" />
          <line x1="27" y1="11.5" x2="27" y2="13.5" stroke="#a87070" strokeWidth="1.5" />
        </g>
      }
      {sheep > 0 &&
        <g>
          <ellipse cx="39" cy="7.5" rx="5.5" ry="4" fill="#ece8df" stroke="#b5ad9c" strokeWidth="1" />
          <circle cx="44" cy="6" r="1.8" fill="#5a5248" />
          <line x1="36" y1="11" x2="36" y2="13.5" stroke="#b5ad9c" strokeWidth="1.5" />
          <line x1="42" y1="11" x2="42" y2="13.5" stroke="#b5ad9c" strokeWidth="1.5" />
        </g>
      }
    </svg>
  </HoverTip>
};

const StickVillager = ({ villager }) => {
  const { ox, goats, sows, hens, sheep } = villager.livestock;
  const tip = <div style={{ textAlign: "center" }}>
    <div style={{ fontWeight: "bold" }}>{villager.name}</div>
    <div>{villager.occupation} ({SOCIAL_STATUS[villager.status].label}) · Health {villager.health}/100</div>
    <div>Savings: {formatMoney(villager.savings)}</div>
    <div>Pantry: {fmtLb(villager.pantry.grain)} lb grain, {fmtLb(villager.pantry.meat)} lb meat, {fmtLb(villager.pantry.produce)} lb fruit & veg</div>
    <div>Feed stores: {fmtLb(villager.feed)} lb</div>
    <div>Livestock: {ox > 0 ? "ox, " : "no ox, "}{goats} goats, {sheep} sheep, {sows} sows, {hens} hens</div>
  </div>;

  return <HoverTip content={tip}>
    <svg
      viewBox="0 0 20 34"
      width="20"
      height="34"
      style={{ position: "absolute", left: `${villager.x}%`, top: `${villager.y}%`, overflow: "visible" }}
    >
      <g stroke="#3a3226" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <circle cx="10" cy="5" r="4" />
        <line x1="10" y1="9" x2="10" y2="21" />
        <line x1="10" y1="13" x2="4" y2="18" />
        <line x1="10" y1="13" x2="16" y2="18" />
        <line x1="10" y1="21" x2="5" y2="31" />
        <line x1="10" y1="21" x2="15" y2="31" />
      </g>
      {villager.craft &&
        <circle cx="16" cy="3" r="2.5" fill="#c8a64b" stroke="#8a6f2f" strokeWidth="1" />
      }
    </svg>
  </HoverTip>
};

const Stat = ({ label, value }) => {
  return <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "0.75rem", color: "#888", textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{value}</div>
  </div>
};

const reportSummary = (report) => {
  const parts = [];
  if (report.harvested > 0)
  {
    parts.push(`Last ${report.season}: harvested ${fmtLb(report.harvested)} lb of crops.`);
  }
  else
  {
    parts.push(`The fields lay fallow through ${report.season}; families lived on their stores.`);
  }
  if (report.robbed)
  {
    parts.push("The caravan was robbed on the road; the season's goods are gone!");
  }
  else if (report.income >= 1)
  {
    parts.push(`Sold ${fmtLb(report.flourSold)} lb of flour, ${Math.round(report.ciderSold)} gal of cider${report.woolSold > 0 ? `, ${fmtLb(report.woolSold)} lb of wool` : ""} and other surplus for ${formatMoney(report.income)}.`);
  }
  if (report.spent >= 1)
  {
    parts.push(`Families spent ${formatMoney(report.spent)} on food, feed, seed, wares and salt.`);
  }
  if (report.taxCollected >= 1)
  {
    parts.push(`Property taxes brought ${formatMoney(report.taxCollected)} to the treasury.`);
  }
  if (report.hunted + report.foraged >= 1)
  {
    parts.push(`Hunting and foraging brought in ${fmtLb(report.hunted + report.foraged)} lb.`);
  }
  if (report.underfed > 0)
  {
    parts.push(`${report.underfed} ${report.underfed === 1 ? "family" : "families"} went hungry.`);
  }
  if (report.healed > 0)
  {
    parts.push(`A traveling healer tended ${report.healed} ${report.healed === 1 ? "family" : "families"}.`);
  }
  if (report.settled.length > 0)
  {
    parts.push(`${report.settled.join(", ")} arrived to settle the new homestead${report.settled.length > 1 ? "s" : ""}.`);
  }
  if (report.newCrafts.length > 0)
  {
    parts.push(`New tradespeople: ${report.newCrafts.join(", ")}.`);
  }
  if (report.oreFound)
  {
    parts.push("Iron ore has been discovered in the hills! The treasury could fund a mine.");
  }
  return parts.join(" ");
};

const VillageSim = () => {
  const [game, setGame] = useState(createGame);

  const { villagers, retinue, truce, treasury, policies, built, report } = game;
  const season = SEASONS[game.turn % SEASONS.length];
  const year = Math.floor(game.turn / SEASONS.length) + 1;
  const totalSavings = villagers.reduce((sum, v) => sum + v.savings, 0);
  const safety = calcSafety(game);

  const setPolicy = (key, value) => {
    setGame({ ...game, policies: { ...policies, [key]: value } });
  };

  const safetyTip = truce > 0
    ? `The bandits are still licking their wounds, no attacks for ${truce} more season${truce > 1 ? "s" : ""}.`
    : <div style={{ textAlign: "center" }}>
        <div>
          {retinue.length} retinue × {SECURITY.safetyPerRetinue}%
          {policies.militia ? ` + ${villagers.length} militia families × ${MILITIA.safetyPerFamily}%` : ""}
          {" "}(max {SECURITY.maxSafety}%){built.mine ? ", −15% for the mine" : ""}
        </div>
        <div>Bandits attack when a d100 roll exceeds this.</div>
      </div>;

  return <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    minHeight: "100vh",
    padding: "1rem",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
      <Stat label="Date" value={`${season}, Year ${year}`} />
      <Stat label="Villagers" value={villagers.length} />
      <Stat label="Retinue" value={retinue.length} />
      <HoverTip content={safetyTip}>
        <div>
          <Stat label="Safety" value={`${safety}%`} />
        </div>
      </HoverTip>
      <Stat label="Treasury" value={formatMoney(treasury)} />
      <Stat label="Villager savings" value={formatMoney(totalSavings)} />
      <Button onClick={() => setGame(simulateSeason(game))}>End Season</Button>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
      <span style={{ fontSize: "0.8rem", color: "#888" }}>TAXES</span>
      {Object.keys(TAX.rates).map((rate) =>
        <Button
          key={rate}
          size="xs"
          variant={policies.tax === rate ? "solid" : "outline"}
          onClick={() => setPolicy("tax", rate)}
        >
          {rate}
        </Button>
      )}
      <span style={{ fontSize: "0.8rem", color: "#888", marginLeft: "1rem" }}>MILITIA</span>
      <HoverTip content={`Every family drills with the militia: +${MILITIA.safetyPerFamily}% safety each, but harvests drop ${Math.round((1 - MILITIA.harvestFactor) * 100)}%`}>
        <Button size="xs" variant={policies.militia ? "solid" : "outline"} onClick={() => setPolicy("militia", !policies.militia)}>
          {policies.militia ? "Drilling" : "Disbanded"}
        </Button>
      </HoverTip>
      <span style={{ fontSize: "0.8rem", color: "#888", marginLeft: "1rem" }}>TRADE</span>
      <HoverTip content={`Caravans to the city fetch ${Math.round((CARAVAN.incomeMult - 1) * 100)}% more, but risk robbery on the road (${CARAVAN.guardsNeeded}+ retinue makes the road safer)`}>
        <Button size="xs" variant="outline" onClick={() => setPolicy("caravans", !policies.caravans)}>
          {policies.caravans ? "Caravans to the city" : "Sell locally"}
        </Button>
      </HoverTip>
      <Button
        size="xs"
        marginLeft="1rem"
        onClick={() => setGame(recruitRetinue(game))}
        disabled={treasury < SECURITY.recruitCost || villagers.length === 0}
      >
        Recruit Retinue ({formatMoney(SECURITY.recruitCost)})
      </Button>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
      <span style={{ fontSize: "0.8rem", color: "#888" }}>PROJECTS</span>
      {Object.entries(PROJECTS).map(([key, project]) => {
        if (!project.repeatable && built[key])
        {
          return <span key={key} style={{ fontSize: "0.85rem", color: "#4a7c45" }}>✓ {project.label}</span>;
        }
        if (project.needsOre && !game.oreFound)
        {
          return null;
        }
        return <HoverTip key={key} content={project.desc}>
          <Button size="xs" variant="outline" onClick={() => setGame(buildProject(game, key))} disabled={!canBuild(game, key)}>
            {project.label} ({formatMoney(projectCost(game, key))})
          </Button>
        </HoverTip>
      })}
    </div>

    {report?.raid &&
      <div style={{ color: "#b3261e", fontWeight: "bold", fontSize: "1.25rem" }}>
        Bandits attacked! {report.raid.villagersLost} villagers and {report.raid.retinueLost} retinue
        were killed, {report.raid.fieldsBurned} fields were burned, and most of the village's wealth was stolen.
      </div>
    }

    <div style={{
      position: "relative",
      width: "75vw",
      height: "70vh",
      backgroundColor: "#F0EAD6",
      borderRadius: "1rem",
      border: "2px solid #d4cdb8",
      overflow: "hidden",
    }}>
      {built.wards && <WardRing />}
      {villagers.map((villager) => <Field key={villager.id} field={villager.field} owner={villager.name} />)}
      {villagers.map((villager) => <FarmAnimals key={villager.id} villager={villager} />)}
      {built.mill && <Mill />}
      {built.smokehouse && <Smokehouse />}
      {built.mine && <Mine />}
      <Well />
      {retinue.map((guard, i) =>
        <StickRetinue key={guard.id} guard={guard} index={i} count={retinue.length} />
      )}
      {villagers.map((villager) => <StickVillager key={villager.id} villager={villager} />)}
    </div>

    {report &&
      <div style={{ color: "#555", fontSize: "0.9rem", maxWidth: "75vw", textAlign: "center" }}>
        {reportSummary(report)}
      </div>
    }

    {report && (report.starved.length > 0 || report.left.length > 0) &&
      <div style={{ color: "#b3261e", fontWeight: "bold", fontSize: "0.95rem" }}>
        {report.starved.length > 0 && `${report.starved.join(", ")} ${report.starved.length === 1 ? "has" : "have"} starved. `}
        {report.left.length > 0 && `${report.left.join(", ")} left the village over taxes.`}
      </div>
    }
  </div>
};

export default VillageSim;
