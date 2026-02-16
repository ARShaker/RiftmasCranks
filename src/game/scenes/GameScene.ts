import Phaser from 'phaser';
import { Character } from '../../types/character';
import { GameOverData, TrailType } from '../../types/game';
import { Player } from '../classes/Player';
import { Terrain } from '../classes/Terrain';
import { ObstacleManager } from '../classes/Obstacle';
import { CoinManager } from '../classes/Coin';

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private terrain?: Terrain;
  private obstacleManager?: ObstacleManager;
  private coinManager?: CoinManager;
  private arrowKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private wasdKeys?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private shiftKey?: Phaser.Input.Keyboard.Key;

  // Game state
  private score = 0;
  private distance = 0;
  private lastScoreTime = 0; // Track last time we added score
  private scoreMultiplier = 1; // Multiplier for time-based scoring
  private maxMultiplier = 1; // Track highest multiplier achieved
  private multiplierDecayTime = 0; // Time when multiplier should decay
  private multiplierDecayDuration = 10000; // 10 seconds in milliseconds
  private pausedDecayTimeRemaining = 0; // Store remaining decay time when crank is active
  private airborneStartAngle = 0; // Track the angle when becoming airborne
  private lastFrameAngle = 0; // Track angle from previous frame to calculate delta
  private cumulativeRotation = 0; // Track total rotation since becoming airborne
  private flipsCompleted = 0; // Track number of flips completed this air time
  private totalLandedFlips = 0; // Track total flips landed across all jumps
  private canCrank = false; // Whether player has unlocked crank ability
  private hasCrankedThisSession = false; // Prevent multiple cranks
  private selectedCharacter?: Character;
  private isGameOver = false;

  // Crank UI
  private flipCounterText?: Phaser.GameObjects.Text;
  private timeToCrankText?: Phaser.GameObjects.Text;
  private crankOverlay?: Phaser.GameObjects.Rectangle;
  private crankImage?: Phaser.GameObjects.Image;
  private crankMessageText?: Phaser.GameObjects.Text;
  private crankBonusText?: Phaser.GameObjects.Text;
  private crankTopGradient?: Phaser.GameObjects.Rectangle;
  private crankBottomGradient?: Phaser.GameObjects.Rectangle;
  private crankContinueText?: Phaser.GameObjects.Text;
  private isCrankScreenActive = false;

  // Trail difficulty system
  private currentTrail: 'green' | 'blue' | 'black' = 'green';
  private trailTransitionDistance = 1000; // Distance in meters between trail changes
  private trailHeaderContainer?: Phaser.GameObjects.Container;
  private trailTintOverlay?: Phaser.GameObjects.Rectangle;
  private trailSpeedMultipliers = {
    green: 1.0,
    blue: 1.4,
    black: 1.8,
  };


  // Multiplier UI
  private multiplierBarBg?: Phaser.GameObjects.Graphics;
  private multiplierBarFill?: Phaser.GameObjects.Graphics;
  private multiplierText?: Phaser.GameObjects.Text;
  private maxMultiplierText?: Phaser.GameObjects.Text;

  // Performance: cache last multiplier bar state to avoid unnecessary redraws
  private lastMultiplierBarPercent = -1;
  private lastMultiplierValue = -1;

  // Performance: pre-computed rainbow colors for crank text
  private rainbowColors: string[] = [];
  private rainbowColorIndex = 0;
  private lastRainbowUpdateTime = 0;

  // Parallax background layers
  private bgLayers: Phaser.GameObjects.TileSprite[] = [];

  // Callback to update React state
  private onScoreUpdate?: (score: number, distance: number, multiplier: number) => void;
  private onGameOver?: (data: GameOverData) => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  public preload(): void {
    // Load the skier images (3 separate files)
    this.load.image('skier-ride', 'assets/skier_ride.png');
    this.load.image('skier-jump', 'assets/skier_jump.png');
    this.load.image('skier-trick', 'assets/skier_trick.png');

    // Load obstacle images
    this.load.image('obstacle-rock', 'assets/rock.png');
    this.load.image('obstacle-tree', 'assets/tree.png');
    this.load.image('obstacle-sign', 'assets/trail_sign.png');

    // Load parallax background layers (1 = furthest back, 5 = closest)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`bg-layer-${i}`, `assets/background/${i}.png`);
    }

    // Load character crank images
    const characterNames = ['jamie', 'mack', 'dygs', 'dave', 'tommy', 'will', 'oliver', 'van', 'shaker'];
    characterNames.forEach(name => {
      this.load.image(`crank-${name}`, `assets/cranks/${name}_crank.png`);
    });

    // Load coin image
    this.load.image('coin', 'assets/singed_favicon.png');
  }

  public init(data?: {
    character?: Character;
    onScoreUpdate?: (score: number, distance: number, multiplier: number) => void;
    onGameOver?: (data: GameOverData) => void;
  }): void {
    // Only set if data is provided (scene restart)
    if (data?.character) {
      this.selectedCharacter = data.character;
      this.onScoreUpdate = data.onScoreUpdate;
      this.onGameOver = data.onGameOver;

      // Reset game state
      this.score = 0;
      this.distance = 0;
      this.lastScoreTime = 0;
      this.currentTrail = 'green';
      this.scoreMultiplier = 1;
      this.maxMultiplier = 1;
      this.multiplierDecayTime = 0;
      this.flipsCompleted = 0;
      this.cumulativeRotation = 0;
      this.totalLandedFlips = 0;
      this.canCrank = false;
      this.hasCrankedThisSession = false;
      this.isGameOver = false;
    }
  }

  public create(): void {
    // Don't create anything if no character selected (auto-start case)
    if (!this.selectedCharacter) {
      return;
    }

    // Re-enable keyboard input (in case it was disabled by game over)
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true;
    }

    // Create parallax background layers (5 = furthest back, 1 = closest)
    // Each layer scrolls at a different rate for depth effect
    this.bgLayers = [];
    const screenHeight = this.cameras.main.height;
    const screenWidth = this.cameras.main.width;

    // Add layers in reverse order (5 first = back, 1 last = front)
    for (let i = 5; i >= 1; i--) {
      // Get the texture dimensions to calculate proper scaling
      const texture = this.textures.get(`bg-layer-${i}`);
      const frame = texture.getSourceImage();
      const imgHeight = frame.height;

      // Calculate scale to fit screen height while maintaining aspect ratio
      const scale = screenHeight / imgHeight;

      const layer = this.add.tileSprite(
        screenWidth / 2,
        screenHeight / 2,
        screenWidth / scale, // Divide by scale since tileSprite will be scaled
        imgHeight,
        `bg-layer-${i}`
      );
      layer.setScale(scale);
      layer.setScrollFactor(0); // Fixed to camera
      layer.setDepth(-10 + (6 - i)); // Layer 5 at depth -9, layer 1 at depth -5
      layer.setAlpha(0.6); // Make background slightly transparent
      this.bgLayers.push(layer);
    }

    // Create terrain
    this.terrain = new Terrain(this);

    // Create coin manager with terrain reference
    this.coinManager = new CoinManager(this, this.terrain);

    // Set coin manager on terrain for ramp coin spawning
    this.terrain.setCoinManager(this.coinManager);

    // Create obstacle manager with terrain and coin manager references
    this.obstacleManager = new ObstacleManager(this, this.terrain, this.coinManager);

    // Create player
    this.player = new Player(this, 200, 300, this.selectedCharacter);

    // Setup controls - arrow keys for tricks, WASD for rotation
    this.arrowKeys = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Setup camera to follow player
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Setup collision between player and obstacles
    this.physics.add.overlap(
      this.player.sprite,
      this.obstacleManager.getObstacles(),
      this.handleObstacleCollision,
      undefined,
      this
    );

    // Setup collision between player and coins
    this.physics.add.overlap(
      this.player.sprite,
      this.coinManager.getCoins(),
      (_player, coin) => this.handleCoinCollection(coin as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );

    // Add score update loop
    this.time.addEvent({
      delay: 100,
      callback: this.updateScore,
      callbackScope: this,
      loop: true,
    });

    // Create multiplier bar UI
    this.createMultiplierBar();

    // Create flip counter UI
    this.createFlipCounterUI();

    // Create trail tint overlay and show initial trail header
    this.createTrailTintOverlay();
    this.showTrailHeader('green');

    // Set score time tracking
    this.lastScoreTime = this.time.now;
  }

  private createMultiplierBar(): void {
    const barWidth = 200;
    const barHeight = 20;
    // Position on right side of screen (with extra padding to avoid cutoff)
    const barX = this.cameras.main.width - barWidth - 50;
    const barY = 160; // Position below score text

    // Background (dark)
    this.multiplierBarBg = this.add.graphics();
    this.multiplierBarBg.fillStyle(0x000000, 0.5);
    this.multiplierBarBg.fillRect(barX, barY, barWidth, barHeight);
    this.multiplierBarBg.setScrollFactor(0);
    this.multiplierBarBg.setDepth(1000);

    // Fill (green to red gradient based on time remaining)
    this.multiplierBarFill = this.add.graphics();
    this.multiplierBarFill.setScrollFactor(0);
    this.multiplierBarFill.setDepth(1001);

    // Multiplier text (on the left of the bar)
    this.multiplierText = this.add.text(barX - 10, barY + barHeight / 2, 'x1', {
      fontSize: '18px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.multiplierText.setOrigin(1, 0.5); // Right-aligned
    this.multiplierText.setScrollFactor(0);
    this.multiplierText.setDepth(1001);

    // MAX text (shown when at x5)
    this.maxMultiplierText = this.add.text(barX + barWidth + 10, barY + barHeight / 2, 'MAX', {
      fontSize: '18px',
      color: '#FF0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.maxMultiplierText.setOrigin(0, 0.5);
    this.maxMultiplierText.setScrollFactor(0);
    this.maxMultiplierText.setDepth(1001);
    this.maxMultiplierText.setVisible(false); // Hidden by default
  }

  private createTrailTintOverlay(): void {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Create a semi-transparent overlay for trail tint
    this.trailTintOverlay = this.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth,
      screenHeight,
      0x00ff00, // Start with green
      0.15 // Light tint
    );
    this.trailTintOverlay.setScrollFactor(0);
    this.trailTintOverlay.setDepth(-4); // Just above background layers
  }

  private showTrailHeader(trail: 'green' | 'blue' | 'black'): void {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Remove existing header if present
    if (this.trailHeaderContainer) {
      this.trailHeaderContainer.destroy();
    }

    // Trail configurations
    const trailConfig = {
      green: {
        name: 'Green Trail',
        color: 0x00ff00,
        textColor: '#00FF00',
        tintColor: 0x00ff00,
      },
      blue: {
        name: 'Blue Trail',
        color: 0x0088ff,
        textColor: '#0088FF',
        tintColor: 0x0088ff,
      },
      black: {
        name: 'Black Diamond',
        color: 0x333333,
        textColor: '#333333',
        tintColor: 0x444444,
      },
    };

    const config = trailConfig[trail];

    // Create container for header elements (positioned 1/3 from top = 2/3 up the screen)
    this.trailHeaderContainer = this.add.container(screenWidth / 2, screenHeight / 3);
    this.trailHeaderContainer.setScrollFactor(0);
    this.trailHeaderContainer.setDepth(3000);

    // Create background panel (smaller and translucent)
    const panelWidth = 300;
    const panelHeight = 100;
    const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.5);
    panel.setStrokeStyle(4, config.color);
    this.trailHeaderContainer.add(panel);

    // Create icon based on trail type (smaller)
    const iconGraphics = this.add.graphics();
    const iconSize = 28;
    const iconX = -110; // Far left of panel with less padding

    if (trail === 'green') {
      // Green circle
      iconGraphics.fillStyle(config.color, 1);
      iconGraphics.fillCircle(iconX, 0, iconSize / 2);
    } else if (trail === 'blue') {
      // Blue square
      iconGraphics.fillStyle(config.color, 1);
      iconGraphics.fillRect(iconX - iconSize / 2, -iconSize / 2, iconSize, iconSize);
    } else {
      // Black diamond (rotated square)
      iconGraphics.fillStyle(config.color, 1);
      iconGraphics.beginPath();
      iconGraphics.moveTo(iconX, -iconSize / 2); // Top
      iconGraphics.lineTo(iconX + iconSize / 2, 0); // Right
      iconGraphics.lineTo(iconX, iconSize / 2); // Bottom
      iconGraphics.lineTo(iconX - iconSize / 2, 0); // Left
      iconGraphics.closePath();
      iconGraphics.fillPath();
    }
    this.trailHeaderContainer.add(iconGraphics);

    // Create trail name text (positioned to the right of the icon, smaller)
    const trailText = this.add.text(iconX + iconSize / 2 + 15, 0, config.name, {
      fontSize: '32px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    trailText.setOrigin(0, 0.5); // Left-aligned
    this.trailHeaderContainer.add(trailText);

    // Update tint overlay color
    if (this.trailTintOverlay) {
      this.trailTintOverlay.setFillStyle(config.tintColor, 0.15);
    }

    // Animate: scale in, pause, then fade out (start translucent)
    this.trailHeaderContainer.setScale(0);
    this.trailHeaderContainer.setAlpha(0.85);

    this.tweens.add({
      targets: this.trailHeaderContainer,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 2 seconds, then fade out
        this.time.delayedCall(2000, () => {
          if (this.trailHeaderContainer) {
            this.tweens.add({
              targets: this.trailHeaderContainer,
              alpha: 0,
              duration: 500,
              onComplete: () => {
                if (this.trailHeaderContainer) {
                  this.trailHeaderContainer.destroy();
                  this.trailHeaderContainer = undefined;
                }
              },
            });
          }
        });
      },
    });
  }

  private createFlipCounterUI(): void {
    const barX = this.cameras.main.width - 250;
    const barY = 190; // Position below multiplier bar

    // Flip counter text (X/10)
    this.flipCounterText = this.add.text(barX + 200, barY, '0/10 Flips', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.flipCounterText.setOrigin(1, 0); // Right-aligned
    this.flipCounterText.setScrollFactor(0);
    this.flipCounterText.setDepth(1001);

    // "TIME TO CRANK" rainbow text (hidden initially)
    this.timeToCrankText = this.add.text(barX + 200, barY + 30, 'TIME TO CRANK', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.timeToCrankText.setOrigin(1, 0);
    this.timeToCrankText.setScrollFactor(0);
    this.timeToCrankText.setDepth(1001);
    this.timeToCrankText.setVisible(false);
  }

  private checkTrailTransition(): void {
    const blueThreshold = this.trailTransitionDistance;
    const blackThreshold = this.trailTransitionDistance * 2;

    let newTrail: 'green' | 'blue' | 'black' = 'green';
    if (this.distance >= blackThreshold) {
      newTrail = 'black';
    } else if (this.distance >= blueThreshold) {
      newTrail = 'blue';
    }

    // Only trigger transition if trail changed
    if (newTrail !== this.currentTrail) {
      this.currentTrail = newTrail;
      this.showTrailHeader(newTrail);
    }
  }

  private updateFlipCounterUI(): void {
    if (!this.flipCounterText || !this.timeToCrankText) return;

    // Update flip counter text
    const displayFlips = Math.min(this.totalLandedFlips, 10);
    this.flipCounterText.setText(`${displayFlips}/10 Flips`);

    // Show/hide "TIME TO CRANK" and animate rainbow colors
    if (this.canCrank && !this.hasCrankedThisSession) {
      this.timeToCrankText.setVisible(true);

      // Only update rainbow color every 50ms instead of every frame
      const now = this.time.now;
      if (now - this.lastRainbowUpdateTime > 50) {
        this.lastRainbowUpdateTime = now;

        // Use pre-computed colors if available, otherwise generate on first use
        if (this.rainbowColors.length === 0) {
          // Pre-generate 60 rainbow colors (covers ~3 seconds of animation)
          for (let i = 0; i < 60; i++) {
            const t = i / 10;
            const r = Math.sin(t) * 127 + 128;
            const g = Math.sin(t + 2) * 127 + 128;
            const b = Math.sin(t + 4) * 127 + 128;
            this.rainbowColors.push(Phaser.Display.Color.RGBToString(Math.floor(r), Math.floor(g), Math.floor(b), 255, '#'));
          }
        }

        // Cycle through pre-computed colors
        this.timeToCrankText.setColor(this.rainbowColors[this.rainbowColorIndex]);
        this.rainbowColorIndex = (this.rainbowColorIndex + 1) % this.rainbowColors.length;
      }
    } else {
      this.timeToCrankText.setVisible(false);
    }
  }

  private activateCrank(): void {
    if (!this.player || !this.selectedCharacter || !this.terrain || !this.obstacleManager) return;

    this.hasCrankedThisSession = true;
    this.isCrankScreenActive = true;

    // Pause the multiplier decay timer
    if (this.multiplierDecayTime > 0) {
      this.pausedDecayTimeRemaining = Math.max(0, this.multiplierDecayTime - this.time.now);
    }

    // Add 1000 points
    this.score += 1000;

    // Clear all obstacles on screen
    this.obstacleManager.clearAll();

    // Get character name for the crank image
    const characterName = this.selectedCharacter.name.toLowerCase();

    // Create full-screen overlay
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const cameraX = this.cameras.main.scrollX;
    const cameraY = this.cameras.main.scrollY;

    // Dark overlay behind the image
    this.crankOverlay = this.add.rectangle(
      cameraX + screenWidth / 2,
      cameraY + screenHeight / 2,
      screenWidth,
      screenHeight,
      0x000000,
      1.0
    );
    this.crankOverlay.setDepth(2000);
    this.crankOverlay.setScrollFactor(0);

    // Show character crank image centered with buffer
    this.crankImage = this.add.image(
      screenWidth / 2,
      screenHeight / 2,
      `crank-${characterName}`
    );
    this.crankImage.setDepth(2001);
    this.crankImage.setScrollFactor(0);

    // Scale to fit within screen with 100px buffer on each side
    const bufferSize = 100;
    const availableWidth = screenWidth - bufferSize * 2;
    const availableHeight = screenHeight - bufferSize * 2;
    const scaleX = availableWidth / this.crankImage.width;
    const scaleY = availableHeight / this.crankImage.height;
    const fitScale = Math.min(scaleX, scaleY);
    this.crankImage.setScale(fitScale);

    // Add "+1000" text at top of screen
    this.crankBonusText = this.add.text(
      screenWidth / 2,
      80,
      '+1000',
      {
        fontSize: '72px',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8,
      }
    );
    this.crankBonusText.setOrigin(0.5);
    this.crankBonusText.setDepth(2003);
    this.crankBonusText.setScrollFactor(0);

    // Add character's custom crank message at the bottom with flowing rainbow text
    this.crankMessageText = this.add.text(
      screenWidth / 2,
      screenHeight - 120,
      this.selectedCharacter.crankMessage,
      {
        fontSize: '48px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
        wordWrap: { width: screenWidth - 100, useAdvancedWrap: true },
        align: 'center',
      }
    );
    this.crankMessageText.setOrigin(0.5);
    this.crankMessageText.setDepth(2003);
    this.crankMessageText.setScrollFactor(0);

    // Add "Press SPACE to continue" hint
    this.crankContinueText = this.add.text(
      screenWidth / 2,
      screenHeight - 50,
      'Press SPACE to continue',
      {
        fontSize: '20px',
        color: '#AAAAAA',
        stroke: '#000000',
        strokeThickness: 3,
      }
    );
    this.crankContinueText.setOrigin(0.5);
    this.crankContinueText.setDepth(2003);
    this.crankContinueText.setScrollFactor(0);

    // Pause physics
    this.physics.pause();

    // Calculate target ground position for gentle landing
    const playerPos = this.player.getPosition();
    const groundY = this.terrain.getGroundY(playerPos.x);
    const playerHeight = this.player.sprite.displayHeight;
    const targetY = groundY - playerHeight / 2;
    const slopeAngle = this.getTerrainSlopeAngle(playerPos.x);

    // Gently tween the player to the ground (happens in background)
    this.tweens.add({
      targets: this.player.sprite,
      y: targetY,
      angle: slopeAngle,
      duration: 800,
      ease: 'Sine.easeInOut',
    });
  }

  private dismissCrankScreen(): void {
    if (!this.isCrankScreenActive) return;

    this.isCrankScreenActive = false;

    // Clean up all crank UI elements
    if (this.crankOverlay) {
      this.crankOverlay.destroy();
      this.crankOverlay = undefined;
    }
    if (this.crankImage) {
      this.crankImage.destroy();
      this.crankImage = undefined;
    }
    if (this.crankMessageText) {
      this.crankMessageText.destroy();
      this.crankMessageText = undefined;
    }
    if (this.crankBonusText) {
      this.crankBonusText.destroy();
      this.crankBonusText = undefined;
    }
    if (this.crankTopGradient) {
      this.crankTopGradient.destroy();
      this.crankTopGradient = undefined;
    }
    if (this.crankBottomGradient) {
      this.crankBottomGradient.destroy();
      this.crankBottomGradient = undefined;
    }
    if (this.crankContinueText) {
      this.crankContinueText.destroy();
      this.crankContinueText = undefined;
    }

    // Set player as grounded and reset flip tracking
    if (this.player) {
      this.player.isGrounded = true;
      this.flipsCompleted = 0;
      this.cumulativeRotation = 0;
    }

    // Reset flip counter so player can earn crank again
    this.totalLandedFlips = 0;
    this.canCrank = false;
    this.hasCrankedThisSession = false;

    // Restore the multiplier decay timer
    if (this.pausedDecayTimeRemaining > 0) {
      this.multiplierDecayTime = this.time.now + this.pausedDecayTimeRemaining;
      this.pausedDecayTimeRemaining = 0;
    }

    // Resume physics
    this.physics.resume();
  }

  private updateMultiplierBar(): void {
    if (!this.multiplierBarFill || !this.multiplierText || !this.maxMultiplierText) return;

    const barWidth = 200;
    const barHeight = 20;
    const barX = this.cameras.main.width - barWidth - 50;
    const barY = 160;

    // Only update text if multiplier changed
    if (this.scoreMultiplier !== this.lastMultiplierValue) {
      this.multiplierText.setText(`x${this.scoreMultiplier}`);
      this.maxMultiplierText.setVisible(this.scoreMultiplier >= 5);
      this.lastMultiplierValue = this.scoreMultiplier;
    }

    // Calculate fill percent for comparison
    let fillPercent = 0;
    if (this.scoreMultiplier > 1 && this.multiplierDecayTime > 0) {
      const timeRemaining = Math.max(0, this.multiplierDecayTime - this.time.now);
      fillPercent = timeRemaining / this.multiplierDecayDuration;
    }

    // Quantize to reduce redraws (only redraw if changed by more than 2%)
    const quantizedPercent = Math.floor(fillPercent * 50) / 50;

    // Only redraw if percent changed significantly
    if (quantizedPercent !== this.lastMultiplierBarPercent) {
      this.multiplierBarFill.clear();

      if (quantizedPercent > 0) {
        const fillWidth = barWidth * fillPercent;

        // Color gradient from green to yellow to red as time decreases
        let color: number;
        if (fillPercent > 0.6) {
          color = 0x00FF00; // Green
        } else if (fillPercent > 0.3) {
          color = 0xFFFF00; // Yellow
        } else {
          color = 0xFF0000; // Red
        }

        this.multiplierBarFill.fillStyle(color, 1);
        this.multiplierBarFill.fillRect(barX, barY, fillWidth, barHeight);
      }

      this.lastMultiplierBarPercent = quantizedPercent;
    }
  }

  public update(_time: number, delta: number): void {
    // Normalize delta to 60fps (16.67ms per frame)
    // This ensures consistent behavior regardless of actual framerate
    const deltaMultiplier = delta / 16.667;
    // Update crank message rainbow animation even when game is paused
    if (this.isCrankScreenActive && this.crankMessageText) {
      // Use pre-computed colors if available, otherwise generate on first use
      if (this.rainbowColors.length === 0) {
        for (let i = 0; i < 60; i++) {
          const t = i / 10;
          const r = Math.sin(t) * 127 + 128;
          const g = Math.sin(t + 2) * 127 + 128;
          const b = Math.sin(t + 4) * 127 + 128;
          this.rainbowColors.push(Phaser.Display.Color.RGBToString(Math.floor(r), Math.floor(g), Math.floor(b), 255, '#'));
        }
      }

      // Update rainbow color every 50ms
      const now = this.time.now;
      if (now - this.lastRainbowUpdateTime > 50) {
        this.lastRainbowUpdateTime = now;
        this.crankMessageText.setColor(this.rainbowColors[this.rainbowColorIndex]);
        this.rainbowColorIndex = (this.rainbowColorIndex + 1) % this.rainbowColors.length;
      }
    }

    if (!this.player || !this.terrain || !this.obstacleManager || this.isGameOver) {
      return;
    }

    // Don't update game while crank screen is active (except for spacebar handling above)
    if (this.isCrankScreenActive) {
      // Still handle spacebar to dismiss
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey!)) {
        this.dismissCrankScreen();
      }
      return;
    }

    // Update parallax background layers (delta-time based)
    // Array order: index 0 = layer 5 (back, slowest), index 4 = layer 1 (front, fastest)
    for (let i = 0; i < this.bgLayers.length; i++) {
      const scrollSpeed = (5 - i) * 0.1; // Layer 5: 0.1, Layer 1: 0.5
      this.bgLayers[i].tilePositionX += scrollSpeed * deltaMultiplier;
    }

    // Update terrain
    const playerPos = this.player.getPosition();
    this.terrain.update(playerPos.x);
    this.obstacleManager.update(playerPos.x);
    this.coinManager?.update(playerPos.x);

    // Custom terrain collision with smoother landing - DO THIS FIRST
    const groundY = this.terrain.getGroundY(playerPos.x);
    const playerHeight = this.player.sprite.displayHeight;
    const playerBottom = playerPos.y + playerHeight / 2;
    const velocityY = this.player.sprite.body?.velocity.y || 0;

    // Increase threshold to prevent rapid grounded/airborne switching
    const threshold = 10;

    if (playerBottom >= groundY - threshold && this.player.sprite.body) {
      // Player is touching or below ground
      if (velocityY >= -10) { // Allow small upward velocity to still count as grounded
        this.player.sprite.y = groundY - playerHeight / 2;
        this.player.sprite.setVelocityY(0);

        if (!this.player.isGrounded) {
          // Player just landed - calculate terrain slope angle at landing point
          const slopeAngle = this.getTerrainSlopeAngle(playerPos.x);

          // Calculate the angle RELATIVE to the slope (not absolute)
          const playerAngle = this.player.sprite.angle;
          let relativeAngle = Math.abs(playerAngle - slopeAngle);

          // Normalize to 0-180 range
          if (relativeAngle > 180) {
            relativeAngle = 360 - relativeAngle;
          }

          // Crash if landing more than 42° from perpendicular to slope
          const isBadLanding = relativeAngle > 42;

          if (isBadLanding) {
            // Crashed! Game over - pass the relative angle for display
            this.gameOver(relativeAngle);
            return;
          }

          this.player.isGrounded = true;

          // Award flips on successful landing
          if (this.flipsCompleted > 0) {
            const flipName = this.getFlipName(this.flipsCompleted, this.cumulativeRotation > 0);
            const wasAtMax = this.scoreMultiplier >= 5;

            // Update multiplier (but cap at 5)
            this.completeTrick(flipName, this.flipsCompleted);

            // Track total landed flips
            console.log(`LANDING: flipsCompleted=${this.flipsCompleted}, totalBefore=${this.totalLandedFlips}, totalAfter=${this.totalLandedFlips + this.flipsCompleted}`);
            this.totalLandedFlips += this.flipsCompleted;
            if (this.totalLandedFlips >= 10 && !this.canCrank) {
              this.canCrank = true;
            }

            // Show MAX if was or is now at max multiplier
            if (wasAtMax || this.scoreMultiplier >= 5) {
              this.showTrickText(flipName, 'MAX');
            } else {
              this.showTrickText(flipName, `x${this.scoreMultiplier}`);
            }
          }

          // Set rotation to match terrain slope
          this.player.sprite.setAngle(slopeAngle);

          // Reset flip tracking
          this.flipsCompleted = 0;
          this.cumulativeRotation = 0;
        }
      }
    } else if (playerBottom < groundY - threshold - 5) {
      // Only set airborne if clearly above ground (extra buffer)
      if (this.player.isGrounded) {
        // Just became airborne - reset all rotation tracking
        this.airborneStartAngle = this.player.sprite.angle;
        this.lastFrameAngle = this.player.sprite.angle;
        this.cumulativeRotation = 0;
        this.flipsCompleted = 0;
        console.log(`BECAME AIRBORNE - Starting angle: ${this.airborneStartAngle.toFixed(1)}°`);
      }
      this.player.isGrounded = false;
    }

    // Update player physics
    this.player.update();

    // Update player animation based on state
    this.player.updateAnimation();

    // Keep character perpendicular to terrain when grounded
    if (this.player.isGrounded) {
      const slopeAngle = this.getTerrainSlopeAngle(playerPos.x);
      this.player.sprite.setAngle(slopeAngle);
    }

    // Handle spacebar or up arrow - jump immediately on press
    const jumpKeyPressed = Phaser.Input.Keyboard.JustDown(this.spaceKey!) ||
                          Phaser.Input.Keyboard.JustDown(this.arrowKeys!.up);
    if (jumpKeyPressed) {
      if (this.isCrankScreenActive) {
        // Dismiss crank screen
        this.dismissCrankScreen();
      } else if (this.player.isGrounded) {
        // Jump immediately on press
        this.player.jump();
      } else if (this.canCrank && !this.hasCrankedThisSession) {
        // Activate crank ability in air
        this.activateCrank();
      }
    }

    // Handle shift key for speed boost (only when grounded)
    if (this.shiftKey!.isDown && this.player.isGrounded) {
      this.player.startSpeedBoost();
    } else {
      this.player.stopSpeedBoost();
    }

    // Handle rotation inputs in air (both WASD and arrow keys work the same)
    // Delta-time based rotation for consistent speed regardless of framerate
    if (!this.player.isGrounded) {
      const rotationSpeed = 8; // Flat rotation speed for all characters

      // Check if any trick input is being pressed (up arrow is now jump, not spin)
      const isTrickInput =
        (this.wasdKeys?.A.isDown || this.wasdKeys?.D.isDown) ||
        (this.arrowKeys?.left.isDown || this.arrowKeys?.right.isDown);

      this.player.isDoingTrick = !!isTrickInput;

      // A or Left = Roll left
      if ((this.wasdKeys && this.wasdKeys.A.isDown) || (this.arrowKeys && this.arrowKeys.left.isDown)) {
        this.player.sprite.angle -= rotationSpeed * 0.5 * deltaMultiplier;
      }
      // D or Right = Roll right
      if ((this.wasdKeys && this.wasdKeys.D.isDown) || (this.arrowKeys && this.arrowKeys.right.isDown)) {
        this.player.sprite.angle += rotationSpeed * 0.5 * deltaMultiplier;
      }
    } else {
      this.player.isDoingTrick = false;
    }

    // Handle gravity boost with S or Down arrow
    if ((this.wasdKeys && this.wasdKeys.S.isDown) || (this.arrowKeys && this.arrowKeys.down.isDown)) {
      if (!this.player.isGrounded) {
        this.player.startGravityBoost();
      }
    } else {
      this.player.stopGravityBoost();
    }

    // Check for completed tricks (full rotation)
    this.checkTrickCompletion();

    // Update distance (for display only)
    this.distance = Math.floor(playerPos.x / 10);

    // Check for trail transitions based on distance
    this.checkTrailTransition();

    // Update score based on time (10 points per second * multiplier)
    const currentTime = this.time.now;
    const timeSinceLastScore = currentTime - this.lastScoreTime;
    if (timeSinceLastScore >= 100) { // Update every 100ms
      const pointsToAdd = Math.floor((timeSinceLastScore / 1000) * 10 * this.scoreMultiplier);
      this.score += pointsToAdd;
      this.lastScoreTime = currentTime;
    }

    // Apply trail-based speed multiplier (set once, applied in Player.update())
    this.player.setSpeedMultiplier(this.trailSpeedMultipliers[this.currentTrail]);

    // Check if multiplier should decay
    if (this.multiplierDecayTime > 0 && this.time.now >= this.multiplierDecayTime) {
      this.scoreMultiplier = Math.max(1, this.scoreMultiplier - 1);
      if (this.scoreMultiplier > 1) {
        // Reset timer for next decay
        this.multiplierDecayTime = this.time.now + this.multiplierDecayDuration;
      } else {
        this.multiplierDecayTime = 0;
      }
    }

    // Update multiplier bar
    this.updateMultiplierBar();

    // Update flip counter UI
    this.updateFlipCounterUI();

    // Check if player fell off the world
    if (playerPos.y > 1000) {
      this.gameOver();
    }
  }

  private checkTrickCompletion(): void {
    if (!this.player) return;

    // Only check tricks while in the air
    if (!this.player.isGrounded) {
      // Get current angle and calculate delta from last frame
      const currentAngle = this.player.getRotation();
      let deltaAngle = currentAngle - this.lastFrameAngle;

      // Handle angle wrapping (Phaser normalizes angles to -180 to 180)
      // If delta is > 180, we wrapped backwards (e.g., from 179° to -179° = clockwise)
      // If delta is < -180, we wrapped forwards (e.g., from -179° to 179° = counter-clockwise)
      if (deltaAngle > 180) {
        deltaAngle -= 360;
      } else if (deltaAngle < -180) {
        deltaAngle += 360;
      }

      // Accumulate the rotation
      this.cumulativeRotation += deltaAngle;
      this.lastFrameAngle = currentAngle;

      // Count flips based on 270° threshold
      const absRotation = Math.abs(this.cumulativeRotation);
      const newFlipCount = Math.floor(absRotation / 270);

      if (newFlipCount > this.flipsCompleted) {
        this.flipsCompleted = newFlipCount;
        console.log(`Flip ${this.flipsCompleted} detected! Total rotation: ${this.cumulativeRotation.toFixed(1)}°`);
      }
    }
  }

  private getFlipName(flipCount: number, isFrontFlip: boolean): string {
    const direction = isFrontFlip ? 'Front' : 'Back';
    switch (flipCount) {
      case 1:
        return `${direction}flip`;
      case 2:
        return `Double ${direction}flip`;
      case 3:
        return `Triple ${direction}flip`;
      default:
        return `${flipCount}x ${direction}flip`;
    }
  }

  private completeTrick(_trickName: string, flipsCompleted: number): void {
    // Increase score multiplier by the number of flips completed, max at 5x
    this.scoreMultiplier = Math.min(5, this.scoreMultiplier + flipsCompleted);

    // Track highest multiplier achieved
    if (this.scoreMultiplier > this.maxMultiplier) {
      this.maxMultiplier = this.scoreMultiplier;
    }

    // Reset/set the decay timer to 10 seconds from now
    this.multiplierDecayTime = this.time.now + this.multiplierDecayDuration;
  }

  private showTrickText(trickName: string, multiplierText: string): void {
    if (!this.player) return;

    const pos = this.player.getPosition();
    const displayText = multiplierText === 'MAX' ? `${trickName}\n${multiplierText}` : `${trickName}\n${multiplierText}`;
    const textColor = multiplierText === 'MAX' ? '#FF0000' : '#FFD700'; // Red for MAX, gold otherwise

    const text = this.add.text(pos.x, pos.y - 100, displayText, {
      fontSize: '24px',
      color: textColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });

    text.setOrigin(0.5);

    // Animate and destroy
    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy(),
    });
  }

  private getTerrainSlopeAngle(x: number): number {
    if (!this.terrain) return 0;

    // Get two nearby points to calculate slope
    const sampleDistance = 20;
    const y1 = this.terrain.getGroundY(x - sampleDistance);
    const y2 = this.terrain.getGroundY(x + sampleDistance);

    // Calculate slope angle
    // deltaY is positive when going downhill (y increases downward in Phaser)
    const deltaY = y2 - y1;
    const deltaX = sampleDistance * 2;

    // atan2 gives us the angle of the slope
    // We use atan2(deltaY, deltaX) to get the slope angle
    const slopeAngleRadians = Math.atan2(deltaY, deltaX);
    const slopeAngleDegrees = slopeAngleRadians * (180 / Math.PI);

    // Return the slope angle directly - the sprite is oriented vertically by default
    // so this will make it stand perpendicular to the slope
    return slopeAngleDegrees;
  }

  private updateScore(): void {
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score, this.distance, this.scoreMultiplier);
    }

    // Note: Multiplier decays over time, not on landing
  }

  private handleObstacleCollision(): void {
    // Any collision with an obstacle causes instant game over
    if (!this.isGameOver) {
      console.log('Player hit an obstacle!');
      this.gameOver(-1); // Use -1 to indicate obstacle collision
    }
  }

  private handleCoinCollection(coin: Phaser.Physics.Arcade.Sprite): void {
    if (!this.coinManager) return;

    // Add 50 points to score
    this.score += 50;

    // Collect the coin (shows popup and destroys it)
    this.coinManager.collectCoin(coin);
  }

  private gameOver(relativeAngle?: number): void {
    if (!this.player || this.isGameOver) return;

    // Set game over flag to stop update loop
    this.isGameOver = true;

    // Stop player movement and freeze physics
    this.player.sprite.setVelocity(0, 0);

    // Disable physics body completely
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setEnable(false);
    }

    // Disable all input
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false;
    }

    // Stop all timed events to prevent updates
    this.time.removeAllEvents();

    // Use the provided relative angle, or calculate it if not provided (e.g., fell off world)
    let displayAngle = relativeAngle;
    if (displayAngle === undefined) {
      const slopeAngle = this.getTerrainSlopeAngle(this.player.sprite.x);
      const playerAngle = this.player.sprite.angle;
      displayAngle = Math.abs(playerAngle - slopeAngle);
      if (displayAngle > 180) {
        displayAngle = 360 - displayAngle;
      }
    }

    // Call the game over callback - React will handle the UI
    if (this.onGameOver) {
      // Don't pass 999 or -1 special values to the callback
      const angleToReport = (displayAngle === 999 || displayAngle === -1) ? undefined : displayAngle;

      // Convert internal trail name to display format
      const trailDisplayNames: Record<string, TrailType> = {
        'green': 'Green',
        'blue': 'Blue',
        'black': 'Black Diamond'
      };

      this.onGameOver({
        score: this.score,
        distance: this.distance,
        tricksCompleted: this.totalLandedFlips,
        maxMultiplier: this.maxMultiplier,
        trailReached: trailDisplayNames[this.currentTrail],
        landingAngle: angleToReport
      });
    }
  }

  public cleanup(): void {
    if (this.player) {
      this.player.destroy();
    }
  }
}
