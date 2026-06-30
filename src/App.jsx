import { useEffect, useMemo, useState } from "react";
import GameCanvas from "./components/GameCanvas.jsx";
import {
  CELEBRITY_BENCHMARK_KG,
  PRIVATE_FLIGHT_AVG_KG,
  achievements,
  buyableEmitters,
  buyableUpgrades,
  canSee,
  emitterCost,
  formatMass,
  formatNumber,
  getClickAmount,
  getProductionPerSecond,
  kgToMolecules,
  moleculesToKg,
  progressSnapshot
} from "./game/mechanics.js";
import { useIdleGame } from "./hooks/useIdleGame.js";

const routes = {
  "/": "home",
  "/about": "about"
};

function getHashPath() {
  if (typeof window === "undefined") {
    return "/";
  }
  const path = window.location.hash.replace(/^#/, "");
  return routes[path] ? path : "/";
}

export default function App() {
  const [path, setPath] = useState(getHashPath);

  useEffect(() => {
    const onHashChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="min-h-svh bg-[#f6f8fb] text-slate-950">
      <div className="flex min-h-svh flex-col">
        <Navbar path={path} />
        <main className="min-h-0 flex-1">{path === "/about" ? <AboutPage /> : <HomePage />}</main>
        <Footer />
      </div>
    </div>
  );
}

function Navbar({ path }) {
  return (
    <header className="h-16 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
        <a className="group flex min-w-0 items-center gap-3" href="#/">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
            JB
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black leading-tight">Jetlag Billionaire</span>
            <span className="block truncate text-xs font-bold uppercase tracking-normal text-teal-700">
              Satirical idle game
            </span>
          </span>
        </a>
        <div className="flex items-center gap-2">
          <NavLink active={path === "/"} href="#/">
            Game
          </NavLink>
          <NavLink active={path === "/about"} href="#/about">
            About
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ active, href, children }) {
  return (
    <a
      className={[
        "rounded-md px-3 py-2 text-sm font-extrabold transition",
        active
          ? "bg-slate-950 text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
      ].join(" ")}
      href={href}
    >
      {children}
    </a>
  );
}

function HomePage() {
  const { state, actions } = useIdleGame();
  const gameData = useMemo(() => buildGameData(state), [state]);

  return (
    <section className="home-screen mx-auto h-[calc(100svh-7rem)] w-full max-w-[1600px] p-2 md:p-4">
      <GameCanvas actions={actions} data={gameData} />
    </section>
  );
}

function buildGameData(state) {
  const snapshot = progressSnapshot(state);
  const production = getProductionPerSecond(state);
  const clickAmount = getClickAmount(state);
  const moralMultiplier = 1 + state.moralCredits * 0.25;
  const totalKg = moleculesToKg(state.totalMolecules);
  const visibleEmitters = buyableEmitters.filter((item) => canSee(item, state));
  const visibleUpgrades = buyableUpgrades.filter((item) => canSee(item, state) && !state.upgrades[item.id]);

  return {
    stats: [
      { label: "Visible", value: state.privacyMode ? "Classified" : formatMass(state.molecules) },
      { label: "Rate", value: `${formatMass(production)} / sec` },
      { label: "Tap power", value: formatMass(clickAmount) },
      { label: "Fictional ratio", value: `${formatNumber(snapshot.ratio)} Stars` },
      { label: "Lifetime", value: formatMass(kgToMolecules(totalKg), { forceMass: true }) }
    ],
    progress: snapshot.progress,
    guilt: snapshot.guilt,
    guiltLabel: snapshot.guiltLabel,
    moralCredits: state.moralCredits,
    canPrestige: totalKg >= 1000,
    log: state.log,
    achievements: achievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      detail: achievement.detail,
      earned: Boolean(state.achievements[achievement.id])
    })),
    emitters: visibleEmitters.map((item) => {
      const cost = emitterCost(item, state);
      const output = item.cps * state.productionMultiplier * moralMultiplier;
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        detail: `${formatMass(output)} / sec each`,
        owned: state.emitters[item.id],
        price: formatMass(cost),
        canBuy: state.molecules >= cost
      };
    }),
    upgrades: visibleUpgrades.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      detail: "Public relations",
      price: formatMass(item.cost),
      canBuy: state.molecules >= item.cost
    }))
  };
}

function AboutPage() {
  return (
    <section className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-10 md:px-6">
      <div>
        <p className="text-xs font-black uppercase tracking-normal text-teal-700">About the game</p>
        <h1 className="mt-2 text-4xl font-black leading-none md:text-5xl">A parody idle game with a real scoreboard shape.</h1>
      </div>
      <div className="grid gap-4 text-base leading-7 text-slate-700">
        <p>
          Jetlag Billionaire is a fictionalized climate-satire clicker about tiny choices scaling into absurd
          emissions. The celebrity benchmark is intentionally labeled as parody, and the game does not use live
          flight tracking, personal-location data, or real-time claims about any real person.
        </p>
        <p>
          The mechanics use public-estimate-style benchmarks to give the numbers a readable arc. One in-game
          private-flight milestone is set at {PRIVATE_FLIGHT_AVG_KG.toLocaleString()} kg CO2e, and the fictional
          celebrity benchmark is {Math.round(CELEBRITY_BENCHMARK_KG / 1000).toLocaleString()} tCO2e.
        </p>
        <p>
          Built with React, Vite, Tailwind CSS, and Phaser. The Phaser scene owns the visible game, including the
          shop, PR upgrades, reset controls, stats, achievements, and the click target.
        </p>
      </div>
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black">Background reading</h2>
        <a
          className="font-bold text-teal-700 underline-offset-4 hover:underline"
          href="https://apnews.com/article/taylor-swift-climate-jet-carbon-emissions-kelce-chiefs-02ac425d24281bd26d73bfdf4590bc82"
          rel="noreferrer"
          target="_blank"
        >
          AP News coverage of public debate around celebrity jet-emissions estimates
        </a>
        <a
          className="font-bold text-teal-700 underline-offset-4 hover:underline"
          href="https://www.nature.com/articles/s43247-024-01775-z"
          rel="noreferrer"
          target="_blank"
        >
          Nature Communications Earth & Environment study on private aviation emissions
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer flex h-12 shrink-0 items-center overflow-hidden border-t border-slate-200 bg-white px-4">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 text-xs font-bold text-slate-500">
        <span className="shrink-0">Jetlag Billionaire</span>
        <span className="min-w-0 truncate text-right">Parody only. No live flight tracking or personal-location data.</span>
      </div>
    </footer>
  );
}
