import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createJetlagScene } from "../game/JetlagScene.js";

export default function GameCanvas({ actions, data }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const actionsRef = useRef(actions);
  const dataRef = useRef(data);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return undefined;
    }

    const Scene = createJetlagScene({
      getData: () => dataRef.current,
      actions: {
        emit: () => actionsRef.current.emit(),
        save: () => actionsRef.current.save(),
        prestige: () => actionsRef.current.prestige(),
        buyEmitter: (id) => actionsRef.current.buyEmitter(id),
        buyUpgrade: (id) => actionsRef.current.buyUpgrade(id)
      }
    });

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "#cffafe",
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: containerRef.current,
        width: "100%",
        height: "100%"
      },
      render: {
        antialias: true,
        pixelArt: false
      },
      scene: Scene,
      transparent: false
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.events.emit("jetlag:update", data);
  }, [data]);

  return (
    <div
      ref={containerRef}
      aria-label="Playable Jetlag Billionaire game"
      className="phaser-stage h-full min-h-0 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
      role="application"
    />
  );
}
