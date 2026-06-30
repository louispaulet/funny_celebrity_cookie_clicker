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

    const container = containerRef.current;
    const getContainerSize = () => {
      const rect = container.getBoundingClientRect();
      return {
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height))
      };
    };
    const initialSize = getContainerSize();

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
      parent: container,
      backgroundColor: "#cffafe",
      scale: {
        mode: Phaser.Scale.NONE,
        parent: container,
        width: initialSize.width,
        height: initialSize.height,
        autoRound: true
      },
      render: {
        antialias: true,
        pixelArt: false
      },
      scene: Scene,
      transparent: false
    });

    const resizeGame = () => {
      const game = gameRef.current;
      if (!game) {
        return;
      }
      const nextSize = getContainerSize();
      if (nextSize.width !== game.scale.width || nextSize.height !== game.scale.height) {
        game.scale.resize(nextSize.width, nextSize.height);
      }
    };
    const resizeObserver = new ResizeObserver(resizeGame);
    resizeObserver.observe(container);
    const resizeFrame = requestAnimationFrame(resizeGame);

    return () => {
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
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
