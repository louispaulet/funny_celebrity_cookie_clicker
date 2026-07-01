import Phaser from "phaser";

const colors = {
  amber: 0xf59e0b,
  cyan: 0xcffafe,
  disabled: 0x94a3b8,
  emerald: 0x10b981,
  ink: 0x0f172a,
  line: 0xcbd5e1,
  muted: 0x64748b,
  panel: 0xffffff,
  rose: 0xf43f5e,
  slate: 0xf8fafc,
  teal: 0x0f766e
};

const textColor = {
  ink: "#0f172a",
  muted: "#64748b",
  teal: "#0f766e",
  white: "#ffffff"
};

const textResolution = 2;

const assetRoot = `${import.meta.env?.BASE_URL || "/"}assets/game/`;
const gameAssets = {
  backdrop: `${assetRoot}stage-backdrop.png`,
  cookie: `${assetRoot}carbon-cookie.png`,
  jet: `${assetRoot}private-jet.png`
};

export function createJetlagScene({ actions, getData }) {
  return class JetlagScene extends Phaser.Scene {
    constructor() {
      super("JetlagScene");
      this.dataSnapshot = null;
      this.dragScroll = null;
      this.layoutRects = {};
      this.scroll = {
        command: 0,
        shop: 0
      };
      this.scrollMax = {
        command: 0,
        shop: 0
      };
      this.shopTab = "emitters";
      this.cookieBaseScale = 1;
      this.cookieTween = null;
    }

    preload() {
      this.load.image("stage-backdrop", gameAssets.backdrop);
      this.load.image("private-jet", gameAssets.jet);
      this.load.image("carbon-cookie", gameAssets.cookie);
    }

    create() {
      this.background = this.add.graphics();
      this.stageBackdrop = this.add.image(0, 0, "stage-backdrop").setOrigin(0.5).setAlpha(0.95);
      this.stagePanel = this.add.graphics();
      this.cloudLayer = this.add.container();
      this.jet = this.add.container();
      this.cookie = this.add.container();
      this.effectsLayer = this.add.container();
      this.uiLayer = this.add.container();

      this.createCookie();
      this.buildClouds();
      this.drawJet();

      this.input.on("wheel", this.handleWheel, this);
      this.input.on("pointerdown", this.handlePointerDown, this);
      this.input.on("pointermove", this.handlePointerMove, this);
      this.input.on("pointerup", this.handlePointerUp, this);
      this.input.on("pointerupoutside", this.handlePointerUp, this);
      this.scale.on("resize", this.layout, this);
      this.game.events.on("jetlag:update", this.updateGameData, this);

      this.updateGameData(getData?.());
      this.layout();
    }

    createCookie() {
      this.cookieGlow = this.add.circle(0, 0, 104, 0x14b8a6, 0.16);
      this.cookieBody = this.add.image(0, 0, "carbon-cookie").setDisplaySize(154, 155);
      this.cookieRing = this.add.circle(0, 0, 82).setStrokeStyle(4, colors.amber, 0.78);
      this.cookieText = this.add
        .text(0, -8, "CO2", {
          color: textColor.white,
          fontFamily: "Arial, sans-serif",
          fontSize: "36px",
          fontStyle: "900",
          resolution: textResolution
        })
        .setOrigin(0.5)
        .setShadow(0, 2, "#0f172a", 4, true, true);
      this.cookieHint = this.add
        .text(0, 36, "TAP", {
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          fontStyle: "900",
          resolution: textResolution
        })
        .setOrigin(0.5);
      this.cookie.add([this.cookieGlow, this.cookieBody, this.cookieRing, this.cookieText, this.cookieHint]);

      this.clickZone = this.add.zone(0, 0, 190, 190).setInteractive({ cursor: "pointer" });
      this.clickZone.on("pointerdown", (pointer, localX, localY, event) => {
        event.stopPropagation();
        this.handleEmit(pointer);
      });
    }

    buildClouds() {
      this.cloudLayer.removeAll(true);
      this.cloudSpecs = [
        [0.16, 0.22, 72, 20, 0.22],
        [0.34, 0.14, 110, 26, 0.18],
        [0.72, 0.25, 95, 24, 0.2],
        [0.86, 0.42, 130, 28, 0.14]
      ];
      this.cloudSpecs.forEach(() => {
        this.cloudLayer.add(this.add.graphics());
      });
    }

    drawJet() {
      this.jet.removeAll(true);
      this.jetSprite = this.add.image(0, 0, "private-jet").setOrigin(0.5);
      this.jetSprite.setDisplaySize(360, 106);
      this.jet.add(this.jetSprite);
    }

    updateGameData(data) {
      if (!data) {
        return;
      }
      this.dataSnapshot = data;
      this.renderUi();
    }

    layout() {
      const width = this.scale.width;
      const height = this.scale.height;
      this.cameras.main.setSize(width, height);
      this.computeLayout(width, height);
      this.drawBackground(width, height);
      this.positionStageBackdrop();
      this.drawClouds();
      this.positionStageObjects();
      this.renderUi();
    }

    computeLayout(width, height) {
      const margin = width < 640 ? 8 : 14;
      const gap = width < 640 ? 8 : 12;
      const stacked = width < 920;
      const statsHeight = stacked ? 58 : 76;
      const top = margin + statsHeight + gap;
      const bottom = height - margin;

      if (stacked) {
        const available = Math.max(420, height - top - margin);
        const stageHeight = Phaser.Math.Clamp(Math.round(available * 0.43), 210, 340);
        const panelHeight = Math.max(116, Math.floor((available - stageHeight - gap * 2) / 2));
        const stage = {
          x: margin,
          y: top,
          width: width - margin * 2,
          height: stageHeight
        };
        const command = {
          x: margin,
          y: stage.y + stage.height + gap,
          width: stage.width,
          height: panelHeight
        };
        const shop = {
          x: margin,
          y: command.y + command.height + gap,
          width: stage.width,
          height: Math.max(108, bottom - command.y - command.height - gap)
        };

        this.layoutRects = {
          mode: "stacked",
          margin,
          gap,
          stats: { x: margin, y: margin, width: width - margin * 2, height: statsHeight },
          stage,
          command,
          shop
        };
        return;
      }

      const sideWidth = Phaser.Math.Clamp(Math.round(width * 0.24), 252, 320);
      const shopWidth = Phaser.Math.Clamp(Math.round(width * 0.29), 310, 400);
      const panelHeight = height - top - margin;
      this.layoutRects = {
        mode: "wide",
        margin,
        gap,
        stats: { x: margin, y: margin, width: width - margin * 2, height: statsHeight },
        command: { x: margin, y: top, width: sideWidth, height: panelHeight },
        stage: {
          x: margin + sideWidth + gap,
          y: top,
          width: width - margin * 2 - sideWidth - shopWidth - gap * 2,
          height: panelHeight
        },
        shop: { x: width - margin - shopWidth, y: top, width: shopWidth, height: panelHeight }
      };
    }

    drawBackground(width, height) {
      this.background.clear();
      this.background.fillGradientStyle(0xcffafe, 0xdbeafe, 0xfef3c7, 0xf8fafc, 1);
      this.background.fillRect(0, 0, width, height);
      this.background.fillStyle(0x34d399, 0.16);
      this.background.fillCircle(width * 0.16, height * 0.88, Math.max(width, height) * 0.36);
      this.background.fillStyle(0xf43f5e, 0.08);
      this.background.fillCircle(width * 0.88, height * 0.18, Math.max(width, height) * 0.26);
      this.background.lineStyle(2, 0xffffff, 0.36);
      for (let index = 0; index < 5; index += 1) {
        const y = height * (0.18 + index * 0.14);
        this.background.lineBetween(0, y, width, y + 28);
      }
    }

    positionStageBackdrop() {
      const rect = this.layoutRects.stage;
      if (!rect || !this.stageBackdrop) {
        return;
      }

      const image = this.textures.get("stage-backdrop").getSourceImage();
      const imageRatio = image.width / image.height;
      const rectRatio = rect.width / rect.height;
      let cropWidth = image.width;
      let cropHeight = image.height;

      if (imageRatio > rectRatio) {
        cropWidth = image.height * rectRatio;
      } else {
        cropHeight = image.width / rectRatio;
      }

      this.stageBackdrop
        .setPosition(rect.x + rect.width / 2, rect.y + rect.height / 2)
        .setCrop((image.width - cropWidth) / 2, (image.height - cropHeight) / 2, cropWidth, cropHeight)
        .setScale(rect.width / cropWidth, rect.height / cropHeight);
    }

    drawClouds() {
      const rect = this.layoutRects.stage;
      if (!rect) {
        return;
      }
      this.cloudLayer.list.forEach((cloud, index) => {
        const [x, y, w, h, alpha] = this.cloudSpecs[index];
        cloud.clear();
        cloud.fillStyle(0xffffff, alpha);
        cloud.fillEllipse(rect.x + rect.width * x, rect.y + rect.height * y, w, h);
        cloud.fillEllipse(rect.x + rect.width * x + w * 0.22, rect.y + rect.height * y - h * 0.2, w * 0.58, h * 1.18);
        cloud.fillEllipse(rect.x + rect.width * x - w * 0.22, rect.y + rect.height * y + h * 0.05, w * 0.52, h * 0.9);
      });
    }

    positionStageObjects() {
      const rect = this.layoutRects.stage;
      if (!rect) {
        return;
      }
      const scale = Phaser.Math.Clamp(Math.min(rect.width, rect.height) / 430, 0.48, 1.02);
      this.cookieBaseScale = scale;
      this.cookieTween?.stop();
      this.cookieTween = null;
      this.cookie.setScale(scale);
      this.cookie.setPosition(rect.x + rect.width * 0.5, rect.y + rect.height * 0.58);
      this.clickZone.setPosition(this.cookie.x, this.cookie.y);
      this.clickZone.setSize(210 * scale, 210 * scale);
      this.jet.setPosition(rect.x + rect.width * 0.52, rect.y + Math.max(48, rect.height * 0.22));
      this.jet.setScale(Phaser.Math.Clamp(rect.width / 760, 0.38, 0.82));
    }

    renderUi() {
      if (!this.dataSnapshot || !this.layoutRects.stage) {
        return;
      }

      this.uiLayer.removeAll(true);
      this.stagePanel.clear();
      this.drawStagePanel();
      this.drawStats();
      this.drawCommandPanel();
      this.drawShopPanel();
      this.clampScroll("command");
      this.clampScroll("shop");
    }

    drawStagePanel() {
      const rect = this.layoutRects.stage;
      this.stagePanel.lineStyle(2, 0xffffff, 0.68);
      this.stagePanel.fillStyle(0xffffff, 0.28);
      this.stagePanel.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 14);
      this.stagePanel.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 14);
      this.addUiText("Tap the carbon cookie", rect.x + 18, rect.y + 16, 16, textColor.ink, {
        fontStyle: "900"
      });
      this.addUiText("Parody benchmark. No live tracking.", rect.x + rect.width / 2, rect.y + rect.height - 22, 12, textColor.muted, {
        align: "center",
        originX: 0.5
      });
    }

    drawStats() {
      const rect = this.layoutRects.stats;
      const compact = this.scale.width < 700;
      const stats = compact ? this.dataSnapshot.stats.slice(0, 3) : this.dataSnapshot.stats;
      const gap = compact ? 6 : 10;
      const cardWidth = (rect.width - gap * (stats.length - 1)) / stats.length;

      stats.forEach((stat, index) => {
        const x = rect.x + index * (cardWidth + gap);
        this.drawCard(x, rect.y, cardWidth, rect.height, colors.panel, 0.92);
        this.addUiText(stat.label, x + 10, rect.y + 10, compact ? 10 : 11, textColor.muted, {
          fontStyle: "900",
          maxChars: compact ? 12 : 18
        });
        this.addUiText(stat.value, x + 10, rect.y + (compact ? 29 : 36), compact ? 13 : 17, textColor.ink, {
          fontStyle: "900",
          maxChars: compact ? 14 : 24
        });
      });
    }

    drawCommandPanel() {
      const rect = this.layoutRects.command;
      const contentTop = rect.y + 14;
      const contentBottom = rect.y + rect.height - 12;
      const viewportHeight = contentBottom - contentTop;
      let y = contentTop - this.scroll.command;

      this.drawPanel(rect, "Command Deck");

      const content = this.createClipContainer(rect, contentTop, viewportHeight);
      y = this.commandTitle(content, rect, y);
      y = this.commandBars(content, rect, y);
      y = this.commandButtons(content, rect, y);
      y = this.commandMoral(content, rect, y);
      y = this.commandLog(content, rect, y);
      y = this.commandAchievements(content, rect, y);

      const contentHeight = y - contentTop + this.scroll.command;
      this.scrollMax.command = Math.max(0, contentHeight - viewportHeight);
      this.drawScrollbar("command", rect, contentTop, viewportHeight, contentHeight);
    }

    commandTitle(parent, rect, y) {
      this.addUiText("Fictional benchmark chase", rect.x + 14, y, 10, textColor.teal, {
        fontStyle: "900",
        parent
      });
      this.addUiText("Outrun the excuse.", rect.x + 14, y + 18, rect.width < 290 ? 19 : 22, textColor.ink, {
        fontStyle: "900",
        maxChars: 24,
        parent
      });
      return y + 54;
    }

    commandBars(parent, rect, y) {
      this.drawProgress(parent, rect.x + 14, y, rect.width - 28, "Benchmark", this.dataSnapshot.progress, colors.teal, colors.emerald);
      this.drawProgress(parent, rect.x + 14, y + 42, rect.width - 28, `Guilt: ${this.dataSnapshot.guiltLabel}`, this.dataSnapshot.guilt, colors.amber, colors.rose);
      return y + 88;
    }

    commandButtons(parent, rect, y) {
      const gap = 8;
      const saveWidth = 76;
      this.makeButton(rect.x + 14, y, rect.width - 28 - saveWidth - gap, 36, "Emit guilt", true, () => this.handleEmit(), false, parent);
      this.makeButton(rect.x + rect.width - 14 - saveWidth, y, saveWidth, 36, "Save", true, () => actions.save(), false, parent);
      this.makeButton(rect.x + 14, y + 44, rect.width - 28, 36, "Offset and restart", this.dataSnapshot.canPrestige, () => actions.prestige(), false, parent);
      return y + 92;
    }

    commandMoral(parent, rect, y) {
      this.drawCard(rect.x + 14, y, rect.width - 28, 62, colors.slate, 0.92, parent);
      this.addUiText("Moral licensing", rect.x + 26, y + 12, 10, textColor.muted, {
        fontStyle: "900",
        parent
      });
      this.addUiText(String(this.dataSnapshot.moralCredits), rect.x + rect.width - 34, y + 10, 24, textColor.ink, {
        align: "right",
        fontStyle: "900",
        originX: 1,
        parent
      });
      this.addUiText("Resets add a permanent 25% multiplier.", rect.x + 26, y + 36, 12, textColor.muted, {
        maxChars: 36,
        parent
      });
      return y + 76;
    }

    commandLog(parent, rect, y) {
      this.addUiText("Campaign log", rect.x + 14, y, 13, textColor.ink, {
        fontStyle: "900",
        parent
      });
      y += 22;
      this.dataSnapshot.log.slice(0, 5).forEach((entry) => {
        this.drawCard(rect.x + 14, y, rect.width - 28, 34, colors.panel, 0.9, parent);
        this.addUiText(entry, rect.x + 24, y + 10, 11, textColor.muted, {
          maxChars: rect.width < 290 ? 34 : 43,
          parent
        });
        y += 40;
      });
      return y + 8;
    }

    commandAchievements(parent, rect, y) {
      const earned = this.dataSnapshot.achievements.filter((achievement) => achievement.earned);
      this.addUiText(`Achievements ${earned.length}/${this.dataSnapshot.achievements.length}`, rect.x + 14, y, 13, textColor.ink, {
        fontStyle: "900",
        parent
      });
      y += 24;

      if (earned.length === 0) {
        this.drawCard(rect.x + 14, y, rect.width - 28, 40, colors.panel, 0.78, parent);
        this.addUiText("Nothing framed yet.", rect.x + 24, y + 12, 12, textColor.muted, {
          parent
        });
        return y + 52;
      }

      earned.slice(0, 6).forEach((achievement) => {
        this.drawCard(rect.x + 14, y, rect.width - 28, 48, 0xecfdf5, 0.94, parent);
        this.addUiText(achievement.name, rect.x + 24, y + 9, 12, textColor.ink, {
          fontStyle: "900",
          maxChars: rect.width < 290 ? 28 : 36,
          parent
        });
        this.addUiText(achievement.detail, rect.x + 24, y + 27, 10, textColor.muted, {
          maxChars: rect.width < 290 ? 32 : 42,
          parent
        });
        y += 54;
      });
      return y + 8;
    }

    drawShopPanel() {
      const rect = this.layoutRects.shop;
      const headerHeight = 88;
      const contentTop = rect.y + headerHeight;
      const contentBottom = rect.y + rect.height - 12;
      const viewportHeight = contentBottom - contentTop;
      const items = this.shopTab === "emitters" ? this.dataSnapshot.emitters : this.dataSnapshot.upgrades;
      const rowHeight = this.layoutRects.mode === "wide" ? 112 : 108;
      const contentHeight = Math.max(viewportHeight, items.length * rowHeight + 8);

      this.drawPanel(rect, "Hangar Shop");

      const content = this.createClipContainer(rect, contentTop, viewportHeight);
      let y = contentTop - this.scroll.shop;
      items.forEach((item) => {
        if (y < contentBottom && y + rowHeight > contentTop) {
          this.drawShopCard(rect.x + 14, y, rect.width - 28, rowHeight - 8, item, content);
        }
        y += rowHeight;
      });

      if (items.length === 0) {
        this.drawCard(rect.x + 14, contentTop, rect.width - 28, 58, colors.slate, 0.9, content);
        this.addUiText("Nothing else has cleared legal yet.", rect.x + 28, contentTop + 21, 12, textColor.muted, {
          maxChars: 38,
          parent: content
        });
      }

      this.scrollMax.shop = Math.max(0, contentHeight - viewportHeight);
      this.drawShopHeader(rect);
      this.drawScrollbar("shop", rect, contentTop, viewportHeight, contentHeight);
    }

    drawShopHeader(rect) {
      this.addUiText("Hangar Shop", rect.x + 14, rect.y + 14, 16, textColor.ink, {
        fontStyle: "900"
      });
      this.addUiText("Wheel or drag the list", rect.x + rect.width - 14, rect.y + 17, 10, textColor.muted, {
        align: "right",
        fontStyle: "900",
        originX: 1
      });
      const tabY = rect.y + 42;
      const tabWidth = (rect.width - 36) / 2;
      this.makeButton(rect.x + 14, tabY, tabWidth, 32, "Emitters", true, () => {
        this.shopTab = "emitters";
        this.scroll.shop = 0;
        this.renderUi();
      }, this.shopTab === "emitters");
      this.makeButton(rect.x + 22 + tabWidth, tabY, tabWidth, 32, "PR", true, () => {
        this.shopTab = "pr";
        this.scroll.shop = 0;
        this.renderUi();
      }, this.shopTab === "pr");
    }

    drawShopCard(x, y, width, height, item, parent) {
      this.drawCard(x, y, width, height, colors.slate, 0.95, parent);
      this.addUiText(item.detail, x + 12, y + 10, 10, textColor.teal, {
        fontStyle: "900",
        maxChars: Math.max(16, Math.floor(width / 11)),
        parent
      });
      this.addUiText(item.name, x + 12, y + 28, 14, textColor.ink, {
        fontStyle: "900",
        maxChars: Math.max(18, Math.floor(width / 9)),
        parent
      });
      this.addUiText(item.description, x + 12, y + 50, 11, textColor.muted, {
        maxChars: Math.max(25, Math.floor(width / 8)),
        parent
      });
      const ownedText = typeof item.owned === "number" ? `Owned ${item.owned}` : "";
      if (ownedText) {
        this.addUiText(ownedText, x + width - 12, y + 10, 10, textColor.muted, {
          align: "right",
          fontStyle: "900",
          originX: 1,
          parent
        });
      }
      this.addUiText(item.price, x + 12, y + height - 28, 10, textColor.muted, {
        fontStyle: "900",
        maxChars: Math.max(15, Math.floor(width / 12)),
        parent
      });
      this.makeButton(x + width - 90, y + height - 40, 78, 32, "Buy", item.canBuy, () => {
        if (this.shopTab === "emitters") {
          actions.buyEmitter(item.id);
        } else {
          actions.buyUpgrade(item.id);
        }
      }, false, parent);
    }

    drawPanel(rect, title) {
      this.drawCard(rect.x, rect.y, rect.width, rect.height, colors.panel, 0.86);
      const line = this.add.graphics();
      line.lineStyle(1, colors.line, 0.8);
      line.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 12);
      this.uiLayer.add(line);
      if (title === "Command Deck") {
        this.addUiText(title, rect.x + 14, rect.y + rect.height - 22, 10, textColor.muted, {
          fontStyle: "900"
        });
      }
    }

    drawProgress(parent, x, y, width, label, value, startColor, endColor) {
      this.addUiText(label, x, y, 10, textColor.muted, {
        fontStyle: "900",
        maxChars: Math.floor(width / 8),
        parent
      });
      this.addUiText(`${formatPercent(value)}%`, x + width, y, 10, textColor.ink, {
        align: "right",
        fontStyle: "900",
        originX: 1,
        parent
      });
      const bg = this.add.graphics();
      bg.fillStyle(0xe2e8f0, 1);
      bg.fillRoundedRect(x, y + 18, width, 10, 5);
      bg.fillGradientStyle(startColor, endColor, startColor, endColor, 1);
      bg.fillRoundedRect(x, y + 18, Math.max(8, width * Math.min(100, value) / 100), 10, 5);
      parent.add(bg);
    }

    drawScrollbar(key, rect, y, height, contentHeight) {
      if (contentHeight <= height + 4) {
        return;
      }
      const x = rect.x + rect.width - 9;
      const max = this.scrollMax[key];
      const thumbHeight = Phaser.Math.Clamp((height / contentHeight) * height, 28, height);
      const thumbY = y + (height - thumbHeight) * (max === 0 ? 0 : this.scroll[key] / max);
      const bar = this.add.graphics();
      bar.fillStyle(0xe2e8f0, 0.86);
      bar.fillRoundedRect(x, y, 4, height, 2);
      bar.fillStyle(colors.teal, 0.9);
      bar.fillRoundedRect(x - 1, thumbY, 6, thumbHeight, 3);
      this.uiLayer.add(bar);
    }

    makeButton(x, y, width, height, label, enabled, callback, selected = false, parent = this.uiLayer) {
      const container = this.add.container(Math.round(x), Math.round(y));
      const bg = this.add.graphics();
      const fill = selected ? colors.ink : enabled ? colors.panel : 0xe2e8f0;
      const border = selected ? colors.ink : enabled ? colors.line : 0xcbd5e1;
      bg.fillStyle(fill, 1);
      bg.lineStyle(1, border, 1);
      bg.fillRoundedRect(0, 0, width, height, 7);
      bg.strokeRoundedRect(0, 0, width, height, 7);
      const text = this.add
        .text(Math.round(width / 2), Math.round(height / 2), label, {
          color: selected ? textColor.white : enabled ? textColor.ink : "#64748b",
          fontFamily: "Arial, sans-serif",
          fontSize: `${height < 30 ? 11 : 12}px`,
          fontStyle: "900",
          resolution: textResolution
        })
        .setOrigin(0.5);
      const hitTarget = this.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0);
      container.add([bg, text, hitTarget]);
      container.setSize(width, height);
      if (enabled) {
        hitTarget.setInteractive({
          cursor: "pointer",
          hitArea: new Phaser.Geom.Rectangle(0, 0, width, height),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        hitTarget.on("pointerdown", (pointer, localX, localY, event) => {
          event.stopPropagation();
          callback();
        });
      }
      container.setAlpha(enabled ? 1 : 0.5);
      parent.add(container);
      return container;
    }

    createClipContainer(rect, y, height) {
      const container = this.add.container();
      const maskShape = this.add.graphics();
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(rect.x, y, rect.width, height);
      container.setMask(maskShape.createGeometryMask());
      maskShape.setVisible(false);
      this.uiLayer.add(maskShape);
      this.uiLayer.add(container);
      return container;
    }

    drawCard(x, y, width, height, fillColor = colors.panel, alpha = 1, parent = this.uiLayer) {
      const card = this.add.graphics();
      card.fillStyle(fillColor, alpha);
      card.lineStyle(1, colors.line, 0.72);
      card.fillRoundedRect(x, y, width, height, 8);
      card.strokeRoundedRect(x, y, width, height, 8);
      parent.add(card);
      return card;
    }

    addUiText(text, x, y, size, color, options = {}) {
      const label = this.add.text(Math.round(x), Math.round(y), truncate(text, options.maxChars), {
        align: options.align || "left",
        color,
        fontFamily: "Arial, sans-serif",
        fontSize: `${size}px`,
        fontStyle: options.fontStyle || "700",
        resolution: textResolution
      });
      label.setOrigin(options.originX || 0, options.originY || 0);
      (options.parent || this.uiLayer).add(label);
      return label;
    }

    handleEmit(pointer = null) {
      const result = actions.emit?.() || { label: "1 molecule" };
      const x = pointer?.x || this.cookie.x;
      const y = pointer?.y || this.cookie.y;
      this.spawnPuffs(x, y, result.label);
      const baseScale = this.cookieBaseScale || 1;
      this.cookieTween?.stop();
      this.cookie.setScale(baseScale);
      this.cookieTween = this.tweens.add({
        targets: this.cookie,
        scaleX: baseScale * 0.92,
        scaleY: baseScale * 0.92,
        duration: 55,
        yoyo: true,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.cookie.setScale(baseScale);
          this.cookieTween = null;
        }
      });
    }

    spawnPuffs(x, y, label) {
      for (let index = 0; index < 12; index += 1) {
        const dot = this.add.circle(x, y, Phaser.Math.Between(4, 9), colors.teal, 0.72);
        this.effectsLayer.add(dot);
        this.tweens.add({
          targets: dot,
          alpha: 0,
          scale: Phaser.Math.FloatBetween(1.4, 2.6),
          x: x + Phaser.Math.Between(-120, 120),
          y: y + Phaser.Math.Between(-145, -28),
          duration: Phaser.Math.Between(520, 900),
          ease: "Cubic.easeOut",
          onComplete: () => dot.destroy()
        });
      }

      const text = this.add
        .text(x, y - 88, `+${label}`, {
          color: textColor.ink,
          fontFamily: "Arial, sans-serif",
          fontSize: "18px",
          fontStyle: "900",
          resolution: textResolution
        })
        .setOrigin(0.5)
        .setShadow(0, 2, "#ffffff", 2, true, true);
      this.effectsLayer.add(text);
      this.tweens.add({
        targets: text,
        alpha: 0,
        y: y - 150,
        duration: 850,
        ease: "Cubic.easeOut",
        onComplete: () => text.destroy()
      });
    }

    handleWheel(pointer, gameObjects, deltaX, deltaY) {
      const key = this.panelAt(pointer.x, pointer.y);
      if (key) {
        this.scrollPanel(key, deltaY);
        this.renderUi();
      }
    }

    handlePointerDown(pointer, gameObjects) {
      if (gameObjects.length > 0) {
        return;
      }
      const key = this.panelAt(pointer.x, pointer.y);
      if (!key || this.scrollMax[key] <= 0) {
        return;
      }
      this.dragScroll = {
        key,
        lastY: pointer.y
      };
    }

    handlePointerMove(pointer) {
      if (!this.dragScroll) {
        return;
      }
      const delta = this.dragScroll.lastY - pointer.y;
      this.dragScroll.lastY = pointer.y;
      this.scrollPanel(this.dragScroll.key, delta);
      this.renderUi();
    }

    handlePointerUp() {
      this.dragScroll = null;
    }

    panelAt(x, y) {
      if (contains(this.layoutRects.shop, x, y)) {
        return "shop";
      }
      if (contains(this.layoutRects.command, x, y)) {
        return "command";
      }
      return null;
    }

    scrollPanel(key, delta) {
      this.scroll[key] = Phaser.Math.Clamp(this.scroll[key] + delta, 0, this.scrollMax[key]);
    }

    clampScroll(key) {
      this.scroll[key] = Phaser.Math.Clamp(this.scroll[key], 0, this.scrollMax[key]);
    }

    update(time) {
      const rect = this.layoutRects.stage;
      if (!rect) {
        return;
      }
      this.jet.x = rect.x + rect.width * 0.5 + Math.sin(time * 0.00045) * rect.width * 0.22;
      this.jet.y += Math.sin(time * 0.002) * 0.05;
      this.cookieRing.rotation += 0.006;
      this.cookieGlow.scale = 1 + Math.sin(time * 0.004) * 0.05;
      this.cloudLayer.x = Math.sin(time * 0.00018) * 18;
    }

    shutdown() {
      this.game.events.off("jetlag:update", this.updateGameData, this);
      this.scale.off("resize", this.layout, this);
      this.input.off("wheel", this.handleWheel, this);
      this.input.off("pointerdown", this.handlePointerDown, this);
      this.input.off("pointermove", this.handlePointerMove, this);
      this.input.off("pointerup", this.handlePointerUp, this);
      this.input.off("pointerupoutside", this.handlePointerUp, this);
    }
  };
}

function contains(rect, x, y) {
  return Boolean(rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "100";
  }
  if (value < 0.01 && value > 0) {
    return value.toExponential(1);
  }
  if (value < 10) {
    return value.toFixed(2).replace(/\.?0+$/, "");
  }
  return Math.round(value).toString();
}

function truncate(value, maxChars) {
  const text = String(value || "");
  if (!maxChars || text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(1, maxChars - 3))}...`;
}
