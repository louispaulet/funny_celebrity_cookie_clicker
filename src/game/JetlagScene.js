import Phaser from "phaser";

const colors = {
  amber: 0xf59e0b,
  cream: 0xfffbeb,
  cyan: 0xcffafe,
  disabled: 0x94a3b8,
  emerald: 0x10b981,
  gold: 0xfbbf24,
  hangar: 0x1f2937,
  ink: 0x0f172a,
  line: 0xcbd5e1,
  muted: 0x64748b,
  panel: 0xffffff,
  paper: 0xf8fafc,
  pr: 0xfce7f3,
  rose: 0xf43f5e,
  slate: 0xf1f5f9,
  teal: 0x0f766e,
  tealSoft: 0xccfbf1
};

const textColor = {
  amber: "#92400e",
  emerald: "#047857",
  ink: "#0f172a",
  muted: "#64748b",
  rose: "#be123c",
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
        left: 0,
        right: 0
      };
      this.scrollMax = {
        left: 0,
        right: 0
      };
      this.leftCollapsed = false;
      this.rightCollapsed = false;
      this.compactPanel = "right";
      this.rightTab = "market";
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
      const compact = width < 980;
      const margin = width < 640 ? 8 : 14;
      const gap = width < 640 ? 6 : 12;
      const railWidth = compact ? 42 : 62;

      if (compact) {
        const minDrawerHeight = Math.min(180, Math.max(124, Math.round(height * 0.28)));
        const maxStageHeight = Math.max(220, height - margin * 2 - gap - minDrawerHeight);
        const stageHeight = Phaser.Math.Clamp(Math.round(height * 0.52), 220, maxStageHeight);
        const stage = {
          x: margin + railWidth + gap,
          y: margin,
          width: Math.max(160, width - margin * 2 - railWidth * 2 - gap * 2),
          height: stageHeight
        };
        const drawerRect = {
          x: margin,
          y: stage.y + stage.height + gap,
          width: width - margin * 2,
          height: Math.max(112, height - stage.y - stage.height - gap - margin)
        };
        const leftActive = this.compactPanel === "left" && !this.leftCollapsed;
        const rightActive = this.compactPanel === "right" && !this.rightCollapsed;

        this.layoutRects = {
          mode: "compact",
          margin,
          gap,
          railWidth,
          stage,
          leftRail: { x: margin, y: stage.y, width: railWidth, height: stage.height },
          rightRail: { x: width - margin - railWidth, y: stage.y, width: railWidth, height: stage.height },
          leftDrawer: leftActive ? { ...drawerRect, collapsed: false } : null,
          rightDrawer: rightActive ? { ...drawerRect, collapsed: false } : null
        };
        return;
      }

      const leftWidth = this.leftCollapsed ? railWidth : Phaser.Math.Clamp(Math.round(width * 0.24), 276, 346);
      const rightWidth = this.rightCollapsed ? railWidth : Phaser.Math.Clamp(Math.round(width * 0.29), 330, 430);
      const panelHeight = height - margin * 2;
      this.layoutRects = {
        mode: "wide",
        margin,
        gap,
        railWidth,
        leftDrawer: { x: margin, y: margin, width: leftWidth, height: panelHeight, collapsed: this.leftCollapsed },
        stage: {
          x: margin + leftWidth + gap,
          y: margin,
          width: width - margin * 2 - leftWidth - rightWidth - gap * 2,
          height: panelHeight
        },
        rightDrawer: {
          x: width - margin - rightWidth,
          y: margin,
          width: rightWidth,
          height: panelHeight,
          collapsed: this.rightCollapsed
        }
      };
    }

    drawBackground(width, height) {
      this.background.clear();
      this.background.fillGradientStyle(0xcffafe, 0xdbeafe, 0xfef3c7, 0xf8fafc, 1);
      this.background.fillRect(0, 0, width, height);
      this.background.fillStyle(0x34d399, 0.13);
      this.background.fillCircle(width * 0.16, height * 0.88, Math.max(width, height) * 0.34);
      this.background.fillStyle(0xf59e0b, 0.09);
      this.background.fillCircle(width * 0.86, height * 0.18, Math.max(width, height) * 0.28);
      this.background.lineStyle(2, 0xffffff, 0.32);
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
      const scale = Phaser.Math.Clamp(Math.min(rect.width, rect.height) / 430, 0.42, 1.04);
      this.cookieBaseScale = scale;
      this.cookieTween?.stop();
      this.cookieTween = null;
      this.cookie.setScale(scale);
      this.cookie.setPosition(rect.x + rect.width * 0.5, rect.y + rect.height * 0.6);
      this.clickZone.setPosition(this.cookie.x, this.cookie.y);
      this.clickZone.setSize(210 * scale, 210 * scale);
      this.jet.setPosition(rect.x + rect.width * 0.52, rect.y + Math.max(44, rect.height * 0.23));
      this.jet.setScale(Phaser.Math.Clamp(rect.width / 760, 0.34, 0.84));
    }

    renderUi() {
      if (!this.dataSnapshot || !this.layoutRects.stage) {
        return;
      }

      this.uiLayer.removeAll(true);
      this.stagePanel.clear();
      this.drawStagePanel();
      this.drawLeftDock();
      this.drawRightDock();
      this.clampScroll("left");
      this.clampScroll("right");
    }

    drawStagePanel() {
      const rect = this.layoutRects.stage;
      this.stagePanel.lineStyle(2, 0xffffff, 0.72);
      this.stagePanel.fillStyle(0xffffff, 0.24);
      this.stagePanel.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 14);
      this.stagePanel.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 14);
      this.addUiText("Tap the carbon cookie", rect.x + 18, rect.y + 16, rect.width < 360 ? 13 : 16, textColor.ink, {
        fontStyle: "900",
        maxChars: rect.width < 360 ? 20 : 28
      });
      this.addUiText("Parody benchmark. No live tracking.", rect.x + rect.width / 2, rect.y + rect.height - 22, 12, textColor.muted, {
        align: "center",
        maxChars: Math.max(24, Math.floor(rect.width / 8)),
        originX: 0.5
      });
    }

    drawLeftDock() {
      const { leftDrawer, leftRail, mode } = this.layoutRects;
      if (mode === "compact") {
        this.drawLeftRail(leftRail, this.compactPanel === "left" && !this.leftCollapsed);
        if (leftDrawer) {
          this.drawStatsDesk(leftDrawer);
        }
        return;
      }

      if (leftDrawer?.collapsed) {
        this.drawLeftRail(leftDrawer, false);
        return;
      }
      this.drawStatsDesk(leftDrawer);
    }

    drawRightDock() {
      const { rightDrawer, rightRail, mode } = this.layoutRects;
      if (mode === "compact") {
        this.drawRightRail(rightRail, this.compactPanel === "right" && !this.rightCollapsed);
        if (rightDrawer) {
          this.drawCommerceDesk(rightDrawer);
        }
        return;
      }

      if (rightDrawer?.collapsed) {
        this.drawRightRail(rightDrawer, false);
        return;
      }
      this.drawCommerceDesk(rightDrawer);
    }

    drawLeftRail(rect, active) {
      if (!rect) {
        return;
      }
      this.drawRailShell(rect, active);
      this.drawLogoBadge(rect.x + 7, rect.y + 10, Math.min(34, rect.width - 14), this.uiLayer);
      this.makeButton(rect.x + 6, rect.y + 56, rect.width - 12, 34, rect.width < 50 ? "JB" : "Stats", true, () => {
        this.leftCollapsed = false;
        this.compactPanel = "left";
        this.layout();
      }, active, this.uiLayer);
      this.addUiText("Desk", rect.x + rect.width / 2, rect.y + rect.height - 22, 10, active ? textColor.ink : textColor.white, {
        align: "center",
        fontStyle: "900",
        originX: 0.5
      });
    }

    drawRightRail(rect, active) {
      if (!rect) {
        return;
      }
      this.drawRailShell(rect, active);
      this.makeButton(rect.x + 6, rect.y + 12, rect.width - 12, 34, rect.width < 50 ? "M" : "Market", true, () => {
        this.rightTab = "market";
        this.rightCollapsed = false;
        this.compactPanel = "right";
        this.layout();
      }, active && this.rightTab === "market", this.uiLayer);
      this.makeButton(rect.x + 6, rect.y + 54, rect.width - 12, 34, "PR", true, () => {
        this.rightTab = "pr";
        this.rightCollapsed = false;
        this.compactPanel = "right";
        this.layout();
      }, active && this.rightTab === "pr", this.uiLayer);
      this.addUiText("Dock", rect.x + rect.width / 2, rect.y + rect.height - 22, 10, active ? textColor.ink : textColor.white, {
        align: "center",
        fontStyle: "900",
        originX: 0.5
      });
    }

    drawRailShell(rect, active) {
      const rail = this.add.graphics();
      rail.fillStyle(active ? colors.panel : colors.ink, active ? 0.92 : 0.88);
      rail.lineStyle(1, active ? colors.line : 0xffffff, active ? 0.88 : 0.2);
      rail.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 12);
      rail.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 12);
      this.uiLayer.add(rail);
    }

    drawStatsDesk(rect) {
      if (!rect) {
        return;
      }
      const headerHeight = 92;
      const contentTop = rect.y + headerHeight;
      const contentBottom = rect.y + rect.height - 12;
      const viewportHeight = Math.max(1, contentBottom - contentTop);
      let y = contentTop - this.scroll.left;

      this.drawPanelShell(rect, {
        title: "",
        eyebrow: "",
        color: colors.teal,
        fill: colors.panel
      });
      this.drawStatsHeader(rect);

      const content = this.createClipContainer(rect, contentTop, viewportHeight);
      y = this.drawBalanceCard(content, rect, y);
      y = this.drawMetrics(content, rect, y);
      y = this.drawBenchmarkBars(content, rect, y);
      y = this.drawCommandButtons(content, rect, y);
      y = this.drawMoralLicensing(content, rect, y);
      y = this.drawCampaignLog(content, rect, y);
      y = this.drawAchievements(content, rect, y);

      const contentHeight = y - contentTop + this.scroll.left;
      this.scrollMax.left = Math.max(0, contentHeight - viewportHeight);
      this.drawScrollbar("left", rect, contentTop, viewportHeight, contentHeight, colors.teal);
    }

    drawStatsHeader(rect) {
      this.drawLogoBadge(rect.x + 14, rect.y + 18, 38, this.uiLayer);
      this.addUiText(this.dataSnapshot.brand?.name || "Jetlag Billionaire", rect.x + 62, rect.y + 18, 15, textColor.white, {
        fontStyle: "900",
        maxChars: Math.max(18, Math.floor((rect.width - 122) / 8))
      });
      this.addUiText("Stats Desk", rect.x + 62, rect.y + 40, 10, "#ccfbf1", {
        fontStyle: "900",
        maxChars: Math.max(18, Math.floor((rect.width - 122) / 7))
      });
      this.addUiText(this.dataSnapshot.privacyStatus, rect.x + 14, rect.y + 68, 10, textColor.muted, {
        fontStyle: "900",
        maxChars: Math.max(24, Math.floor((rect.width - 84) / 7))
      });
      this.makeButton(rect.x + rect.width - 64, rect.y + 18, 48, 30, "Fold", true, () => {
        this.leftCollapsed = true;
        this.layout();
      }, false, this.uiLayer);
    }

    drawBalanceCard(parent, rect, y) {
      const width = rect.width - 28;
      const height = 84;
      const x = rect.x + 14;
      const bg = this.add.graphics();
      bg.fillStyle(colors.ink, 0.94);
      bg.lineStyle(1, colors.gold, 0.7);
      bg.fillRoundedRect(x, y, width, height, 10);
      bg.strokeRoundedRect(x, y, width, height, 10);
      parent.add(bg);
      this.addUiText(this.dataSnapshot.balance.label, x + 14, y + 12, 10, "#fde68a", {
        fontStyle: "900",
        parent
      });
      this.addUiText(this.dataSnapshot.balance.value, x + 14, y + 32, rect.width < 300 ? 20 : 24, textColor.white, {
        fontStyle: "900",
        maxChars: Math.max(14, Math.floor(width / 10)),
        parent
      });
      this.addUiText(this.dataSnapshot.balance.status, x + 14, y + 62, 10, "#cbd5e1", {
        fontStyle: "900",
        maxChars: Math.max(22, Math.floor(width / 7)),
        parent
      });
      return y + height + 12;
    }

    drawMetrics(parent, rect, y) {
      const metrics = this.dataSnapshot.metrics || [];
      const gap = 8;
      const columns = rect.width >= 300 ? 2 : 1;
      const cardWidth = (rect.width - 28 - gap * (columns - 1)) / columns;
      const cardHeight = 56;

      metrics.forEach((metric, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = rect.x + 14 + col * (cardWidth + gap);
        const cardY = y + row * (cardHeight + gap);
        this.drawCard(x, cardY, cardWidth, cardHeight, colors.paper, 0.96, parent);
        this.addUiText(metric.label, x + 10, cardY + 9, 10, textColor.muted, {
          fontStyle: "900",
          maxChars: Math.max(10, Math.floor(cardWidth / 7)),
          parent
        });
        this.addUiText(metric.value, x + 10, cardY + 29, 13, textColor.ink, {
          fontStyle: "900",
          maxChars: Math.max(10, Math.floor(cardWidth / 8)),
          parent
        });
      });

      return y + Math.ceil(metrics.length / columns) * (cardHeight + gap) + 6;
    }

    drawBenchmarkBars(parent, rect, y) {
      this.addUiText("Fictional benchmark chase", rect.x + 14, y, 11, textColor.teal, {
        fontStyle: "900",
        parent
      });
      this.addUiText("Outrun the excuse.", rect.x + 14, y + 18, rect.width < 300 ? 19 : 22, textColor.ink, {
        fontStyle: "900",
        maxChars: Math.max(18, Math.floor((rect.width - 28) / 9)),
        parent
      });
      y += 54;
      this.drawProgress(parent, rect.x + 14, y, rect.width - 28, "Benchmark", this.dataSnapshot.progress, colors.teal, colors.emerald);
      this.drawProgress(parent, rect.x + 14, y + 42, rect.width - 28, `Guilt: ${this.dataSnapshot.guiltLabel}`, this.dataSnapshot.guilt, colors.amber, colors.rose);
      return y + 88;
    }

    drawCommandButtons(parent, rect, y) {
      const gap = 8;
      const saveWidth = 72;
      this.makeButton(rect.x + 14, y, rect.width - 28 - saveWidth - gap, 36, "Emit guilt", true, () => this.handleEmit(), false, parent);
      this.makeButton(rect.x + rect.width - 14 - saveWidth, y, saveWidth, 36, "Save", true, () => actions.save(), false, parent);
      this.makeButton(rect.x + 14, y + 44, rect.width - 28, 36, "Offset and restart", this.dataSnapshot.canPrestige, () => actions.prestige(), false, parent);
      return y + 92;
    }

    drawMoralLicensing(parent, rect, y) {
      this.drawCard(rect.x + 14, y, rect.width - 28, 62, colors.cream, 0.94, parent);
      this.addUiText("Moral licensing", rect.x + 26, y + 12, 10, textColor.amber, {
        fontStyle: "900",
        parent
      });
      this.addUiText(String(this.dataSnapshot.moralCredits), rect.x + rect.width - 34, y + 10, 24, textColor.ink, {
        align: "right",
        fontStyle: "900",
        originX: 1,
        parent
      });
      this.addUiText("Permanent reset multiplier", rect.x + 26, y + 38, 12, textColor.muted, {
        maxChars: 32,
        parent
      });
      return y + 76;
    }

    drawCampaignLog(parent, rect, y) {
      this.addUiText("Campaign log", rect.x + 14, y, 13, textColor.ink, {
        fontStyle: "900",
        parent
      });
      y += 22;
      this.dataSnapshot.log.slice(0, 5).forEach((entry) => {
        this.drawCard(rect.x + 14, y, rect.width - 28, 34, colors.panel, 0.88, parent);
        this.addUiText(entry, rect.x + 24, y + 10, 11, textColor.muted, {
          maxChars: rect.width < 290 ? 34 : 43,
          parent
        });
        y += 40;
      });
      return y + 8;
    }

    drawAchievements(parent, rect, y) {
      const earned = this.dataSnapshot.achievements.filter((achievement) => achievement.earned);
      this.addUiText(`Achievements ${earned.length}/${this.dataSnapshot.achievements.length}`, rect.x + 14, y, 13, textColor.ink, {
        fontStyle: "900",
        parent
      });
      y += 24;

      if (earned.length === 0) {
        this.drawCard(rect.x + 14, y, rect.width - 28, 42, colors.panel, 0.78, parent);
        this.addUiText("Nothing framed yet.", rect.x + 24, y + 13, 12, textColor.muted, {
          parent
        });
        return y + 54;
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

    drawCommerceDesk(rect) {
      if (!rect) {
        return;
      }
      const headerHeight = 108;
      const contentTop = rect.y + headerHeight;
      const contentBottom = rect.y + rect.height - 12;
      const viewportHeight = Math.max(1, contentBottom - contentTop);
      const items = this.rightTab === "market" ? this.dataSnapshot.emitters : this.dataSnapshot.upgrades;
      const rowHeight = this.rightTab === "market" ? 118 : 122;
      const contentHeight = Math.max(viewportHeight, items.length * rowHeight + 8);

      this.drawPanelShell(rect, {
        title: this.rightTab === "market" ? "Hangar Market" : "PR Firm",
        eyebrow: this.rightTab === "market" ? "Emitter inventory" : "Approval counter",
        color: this.rightTab === "market" ? colors.hangar : colors.rose,
        fill: this.rightTab === "market" ? colors.panel : 0xfff7fb
      });
      this.drawCommerceHeader(rect);

      const content = this.createClipContainer(rect, contentTop, viewportHeight);
      let y = contentTop - this.scroll.right;
      items.forEach((item) => {
        if (y < contentBottom && y + rowHeight > contentTop) {
          this.drawCommerceCard(rect.x + 14, y, rect.width - 28, rowHeight - 8, item, content);
        }
        y += rowHeight;
      });

      if (items.length === 0) {
        this.drawCard(rect.x + 14, contentTop, rect.width - 28, 58, colors.slate, 0.9, content);
        this.addUiText(this.rightTab === "market" ? "No new inventory." : "All visible campaigns approved.", rect.x + 28, contentTop + 21, 12, textColor.muted, {
          maxChars: 38,
          parent: content
        });
      }

      this.scrollMax.right = Math.max(0, contentHeight - viewportHeight);
      this.drawScrollbar("right", rect, contentTop, viewportHeight, contentHeight, this.rightTab === "market" ? colors.amber : colors.rose);
    }

    drawCommerceHeader(rect) {
      this.makeButton(rect.x + rect.width - 64, rect.y + 18, 48, 30, "Fold", true, () => {
        this.rightCollapsed = true;
        this.layout();
      }, false, this.uiLayer);

      const tabY = rect.y + 62;
      const tabWidth = (rect.width - 36) / 2;
      this.makeButton(rect.x + 14, tabY, tabWidth, 32, "Market", true, () => {
        this.rightTab = "market";
        this.scroll.right = 0;
        this.renderUi();
      }, this.rightTab === "market", this.uiLayer);
      this.makeButton(rect.x + 22 + tabWidth, tabY, tabWidth, 32, "PR Firm", true, () => {
        this.rightTab = "pr";
        this.scroll.right = 0;
        this.renderUi();
      }, this.rightTab === "pr", this.uiLayer);
    }

    drawCommerceCard(x, y, width, height, item, parent) {
      const approved = Boolean(item.approved);
      const available = Boolean(item.canBuy);
      const fill = approved ? 0xecfdf5 : available ? 0xf0fdfa : colors.paper;
      const accent = approved ? colors.emerald : available ? colors.teal : colors.disabled;
      this.drawCard(x, y, width, height, fill, 0.96, parent);

      const stripe = this.add.graphics();
      stripe.fillStyle(accent, available || approved ? 0.9 : 0.52);
      stripe.fillRoundedRect(x, y, 6, height, 4);
      parent.add(stripe);

      const status = approved ? "APPROVED" : available ? "READY" : "SAVING UP";
      const statusColor = approved || available ? textColor.emerald : textColor.muted;
      this.addUiText(item.detail, x + 16, y + 10, 10, this.rightTab === "market" ? textColor.teal : textColor.rose, {
        fontStyle: "900",
        maxChars: Math.max(16, Math.floor(width / 11)),
        parent
      });
      this.addUiText(status, x + width - 12, y + 10, 10, statusColor, {
        align: "right",
        fontStyle: "900",
        originX: 1,
        parent
      });
      this.addUiText(item.name, x + 16, y + 30, 14, textColor.ink, {
        fontStyle: "900",
        maxChars: Math.max(18, Math.floor(width / 9)),
        parent
      });
      this.addUiText(item.description, x + 16, y + 52, 11, textColor.muted, {
        maxChars: Math.max(25, Math.floor(width / 8)),
        parent
      });

      const ownedText = typeof item.owned === "number" ? `Owned ${item.owned}` : "";
      if (ownedText) {
        this.addUiText(ownedText, x + width - 12, y + 30, 10, textColor.muted, {
          align: "right",
          fontStyle: "900",
          originX: 1,
          parent
        });
      }

      const priceColor = available ? textColor.teal : approved ? textColor.emerald : textColor.muted;
      this.drawPricePill(parent, x + 16, y + height - 34, Math.min(148, width - 116), 26, item.price, priceColor);
      const label = approved ? "Approved" : this.rightTab === "market" ? "Buy" : "Approve";
      this.makeButton(x + width - 92, y + height - 38, 80, 32, label, available, () => {
        if (this.rightTab === "market") {
          actions.buyEmitter(item.id);
        } else {
          actions.buyUpgrade(item.id);
        }
      }, available, parent);
    }

    drawPanelShell(rect, { title, eyebrow, color, fill }) {
      const shell = this.add.graphics();
      shell.fillStyle(fill, 0.9);
      shell.lineStyle(1, colors.line, 0.82);
      shell.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 12);
      shell.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 12);
      shell.fillStyle(color, 0.92);
      shell.fillRoundedRect(rect.x + 8, rect.y + 8, rect.width - 16, 44, 10);
      shell.fillRect(rect.x + 8, rect.y + 30, rect.width - 16, 22);
      this.uiLayer.add(shell);

      if (eyebrow) {
        this.addUiText(eyebrow, rect.x + 20, rect.y + 15, 10, "#e2e8f0", {
          fontStyle: "900",
          maxChars: Math.max(16, Math.floor((rect.width - 92) / 7))
        });
      }
      if (title) {
        this.addUiText(title, rect.x + 20, rect.y + 31, 17, textColor.white, {
          fontStyle: "900",
          maxChars: Math.max(14, Math.floor((rect.width - 98) / 9))
        });
      }
    }

    drawLogoBadge(x, y, size, parent) {
      const badge = this.add.graphics();
      badge.fillStyle(colors.ink, 1);
      badge.fillRoundedRect(x, y, size, size, 8);
      badge.lineStyle(1, 0xffffff, 0.2);
      badge.strokeRoundedRect(x, y, size, size, 8);
      parent.add(badge);
      this.addUiText("JB", x + size / 2, y + size / 2 - 1, Math.max(11, Math.round(size * 0.36)), textColor.white, {
        align: "center",
        fontStyle: "900",
        originX: 0.5,
        originY: 0.5,
        parent
      });
    }

    drawPricePill(parent, x, y, width, height, label, color) {
      const pill = this.add.graphics();
      pill.fillStyle(0xffffff, 0.86);
      pill.lineStyle(1, colors.line, 0.82);
      pill.fillRoundedRect(x, y, width, height, height / 2);
      pill.strokeRoundedRect(x, y, width, height, height / 2);
      parent.add(pill);
      this.addUiText(label, x + 10, y + 7, 10, color, {
        fontStyle: "900",
        maxChars: Math.max(10, Math.floor((width - 16) / 7)),
        parent
      });
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
      bg.fillRoundedRect(x, y + 18, Math.max(8, (width * Math.min(100, value)) / 100), 10, 5);
      parent.add(bg);
    }

    drawScrollbar(key, rect, y, height, contentHeight, color) {
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
      bar.fillStyle(color, 0.9);
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
        .text(Math.round(width / 2), Math.round(height / 2), truncate(label, Math.max(4, Math.floor(width / 7))), {
          color: selected ? textColor.white : enabled ? textColor.ink : "#64748b",
          fontFamily: "Arial, sans-serif",
          fontSize: `${height < 30 ? 10 : 12}px`,
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
      if (contains(this.layoutRects.leftDrawer, x, y)) {
        return "left";
      }
      if (contains(this.layoutRects.rightDrawer, x, y)) {
        return "right";
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
