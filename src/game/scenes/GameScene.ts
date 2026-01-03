import Phaser from 'phaser';
import { Character } from '../../types/character';
import { Player } from '../classes/Player';
import { Terrain } from '../classes/Terrain';
import { ObstacleManager } from '../classes/Obstacle';

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private terrain?: Terrain;
  private obstacleManager?: ObstacleManager;
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

  // Game state
  private score = 0;
  private distance = 0;
  private comboMultiplier = 1;
  private lastRotation = 0;
  private airborneStartAngle = 0; // Track the angle when becoming airborne
  private lastFrameAngle = 0; // Track angle from previous frame to calculate delta
  private cumulativeRotation = 0; // Track total rotation since becoming airborne
  private selectedCharacter?: Character;
  private isGameOver = false;

  // Trick state
  private currentTrickPoints = 0;
  private currentTrickName = '';
  private currentTrickStartTime = 0;
  private trickPointsPerSecond = 10; // Points earned per second while holding trick
  private pendingTrickPoints = 0; // Points waiting to be awarded on landing

  // Callback to update React state
  private onScoreUpdate?: (score: number, distance: number, multiplier: number) => void;
  private onTrickUpdate?: (points: number, trickName: string) => void;
  private onGameOver?: (score: number, distance: number, landingAngle?: number) => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  public preload(): void {
    // Load the ski spritesheet
    this.load.spritesheet('skier', 'src/assets/ski_assets_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  public init(data?: {
    character?: Character;
    onScoreUpdate?: (score: number, distance: number, multiplier: number) => void;
    onTrickUpdate?: (points: number, trickName: string) => void;
    onGameOver?: (score: number, distance: number, landingAngle?: number) => void;
  }): void {
    // Only set if data is provided (scene restart)
    if (data?.character) {
      this.selectedCharacter = data.character;
      this.onScoreUpdate = data.onScoreUpdate;
      this.onTrickUpdate = data.onTrickUpdate;
      this.onGameOver = data.onGameOver;

      // Reset game state
      this.score = 0;
      this.distance = 0;
      this.comboMultiplier = 1;
      this.isGameOver = false;
      this.currentTrickPoints = 0;
      this.currentTrickName = '';
      this.pendingTrickPoints = 0;
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

    // Create terrain
    this.terrain = new Terrain(this);

    // Create obstacle manager
    this.obstacleManager = new ObstacleManager(this);

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

    // Setup camera to follow player
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Add score update loop
    this.time.addEvent({
      delay: 100,
      callback: this.updateScore,
      callbackScope: this,
      loop: true,
    });
  }

  public update(): void {
    if (!this.player || !this.terrain || !this.obstacleManager || this.isGameOver) {
      return;
    }

    // Update terrain
    const playerPos = this.player.getPosition();
    this.terrain.update(playerPos.x);
    this.obstacleManager.update(playerPos.x);

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
          // Player just landed - check if still holding a trick button
          const isHoldingTrick = this.arrowKeys && (
            this.arrowKeys.up.isDown ||
            this.arrowKeys.down.isDown ||
            this.arrowKeys.left.isDown ||
            this.arrowKeys.right.isDown
          );

          if (isHoldingTrick) {
            // Crash! Still holding trick on landing
            this.gameOver(999); // Use special value to indicate trick-hold crash
            return;
          }

          // Calculate terrain slope angle at landing point
          const slopeAngle = this.getTerrainSlopeAngle(playerPos.x);

          // Calculate the angle RELATIVE to the slope (not absolute)
          const playerAngle = this.player.sprite.angle;
          let relativeAngle = Math.abs(playerAngle - slopeAngle);

          // Normalize to 0-180 range
          if (relativeAngle > 180) {
            relativeAngle = 360 - relativeAngle;
          }

          // Crash if landing more than 30° from perpendicular to slope - very tight!
          const isBadLanding = relativeAngle > 30;

          if (isBadLanding) {
            // Crashed! Game over - pass the relative angle for display
            this.gameOver(relativeAngle);
            return;
          }

          this.player.isGrounded = true;

          // Award pending trick points on successful landing
          if (this.pendingTrickPoints > 0) {
            this.score += this.pendingTrickPoints;
            this.showTrickText(this.currentTrickName, this.pendingTrickPoints);
            this.pendingTrickPoints = 0;
            this.currentTrickPoints = 0;
            this.currentTrickName = '';
            this.updateTrickHUD();
          }

          // Set rotation to match terrain slope
          this.player.sprite.setAngle(slopeAngle);

          // DON'T reset lastRotation here - we need it to track if tricks were completed during the air time
          // It will be reset when player becomes airborne again
        }
      }
    } else if (playerBottom < groundY - threshold - 5) {
      // Only set airborne if clearly above ground (extra buffer)
      if (this.player.isGrounded) {
        // Just became airborne - reset all rotation tracking
        this.airborneStartAngle = this.player.sprite.angle;
        this.lastFrameAngle = this.player.sprite.angle;
        this.cumulativeRotation = 0;
        this.lastRotation = 0;
        console.log(`BECAME AIRBORNE - Starting angle: ${this.airborneStartAngle.toFixed(1)}°`);
      }
      this.player.isGrounded = false;
    }

    // Update player physics
    this.player.update();

    // Keep character perpendicular to terrain when grounded
    if (this.player.isGrounded) {
      const slopeAngle = this.getTerrainSlopeAngle(playerPos.x);
      this.player.sprite.setAngle(slopeAngle);
    }

    // Handle spacebar (crouch to charge, release to jump)
    if (this.spaceKey!.isDown) {
      if (this.player.isGrounded) {
        // Crouch to charge jump
        this.player.startCrouch();
      } else {
        // In air, boost gravity to fall faster
        this.player.startGravityBoost();
      }
    } else {
      // Spacebar released
      if (this.player.isCrouching && this.player.isGrounded) {
        // Release crouch = jump!
        this.player.stopCrouch();
        this.player.jump();
      } else {
        this.player.stopCrouch();
        this.player.stopGravityBoost();
      }
    }

    // Handle WASD rotation inputs in air
    if (this.wasdKeys && !this.player.isGrounded) {
      // Taller characters rotate slower (harder to complete tricks)
      const rotationSpeed = 10 / this.player.character.height;

      if (this.wasdKeys.W.isDown) {
        // Front flip
        this.player.sprite.angle += rotationSpeed;
      }
      if (this.wasdKeys.S.isDown) {
        // Back flip
        this.player.sprite.angle -= rotationSpeed;
      }
      if (this.wasdKeys.A.isDown) {
        // Roll left
        this.player.sprite.angle -= rotationSpeed * 0.5;
      }
      if (this.wasdKeys.D.isDown) {
        // Roll right
        this.player.sprite.angle += rotationSpeed * 0.5;
      }
    }

    // Handle arrow key trick inputs (grabs)
    if (this.arrowKeys && !this.player.isGrounded) {
      const currentTime = this.time.now;

      // Check which trick is being performed
      let trickName = '';
      if (this.arrowKeys.up.isDown) {
        trickName = 'Indy';
      } else if (this.arrowKeys.down.isDown) {
        trickName = 'Melon';
      } else if (this.arrowKeys.left.isDown) {
        trickName = 'Stalefish';
      } else if (this.arrowKeys.right.isDown) {
        trickName = 'Tail Grab';
      }

      if (trickName) {
        // Start new trick or continue existing
        if (this.currentTrickName !== trickName) {
          // New trick started
          this.currentTrickName = trickName;
          this.currentTrickStartTime = currentTime;
          this.currentTrickPoints = 0;
        }

        // Calculate points (accumulate over time)
        const timeHeld = (currentTime - this.currentTrickStartTime) / 1000; // seconds
        this.currentTrickPoints = Math.floor(timeHeld * this.trickPointsPerSecond);
        this.pendingTrickPoints = this.currentTrickPoints;

        // Update HUD
        this.updateTrickHUD();
      } else if (this.currentTrickName) {
        // Released trick button while in air - reset current trick display but keep pending points
        this.currentTrickPoints = 0;
        this.currentTrickName = '';
        this.updateTrickHUD();
      }
    }

    // Check for completed tricks (full rotation)
    this.checkTrickCompletion();

    // Update distance
    this.distance = Math.floor(playerPos.x / 10);

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

      // Debug log every 60 frames (about once per second)
      if (this.time.now % 1000 < 16) {
        console.log(`Current angle: ${currentAngle.toFixed(1)}°, Delta: ${deltaAngle.toFixed(1)}°, Cumulative: ${this.cumulativeRotation.toFixed(1)}°, Last: ${this.lastRotation}`);
      }

      // Check for backflip (negative rotation past -360)
      if (this.cumulativeRotation <= -360 && this.lastRotation > -360) {
        console.log('BACKFLIP TRIGGERED!');
        this.completeTrick('Backflip', 100);
        this.lastRotation = -360;
      }
      // Check for multiple backflips
      else if (this.cumulativeRotation <= -720 && this.lastRotation > -720) {
        console.log('DOUBLE BACKFLIP TRIGGERED!');
        this.completeTrick('Double Backflip', 100);
        this.lastRotation = -720;
      }
      else if (this.cumulativeRotation <= -1080 && this.lastRotation > -1080) {
        console.log('TRIPLE BACKFLIP TRIGGERED!');
        this.completeTrick('Triple Backflip', 100);
        this.lastRotation = -1080;
      }

      // Check for frontflip (positive rotation past 360)
      if (this.cumulativeRotation >= 360 && this.lastRotation < 360) {
        console.log('FRONTFLIP TRIGGERED!');
        this.completeTrick('Frontflip', 100);
        this.lastRotation = 360;
      }
      // Check for multiple frontflips
      else if (this.cumulativeRotation >= 720 && this.lastRotation < 720) {
        console.log('DOUBLE FRONTFLIP TRIGGERED!');
        this.completeTrick('Double Frontflip', 100);
        this.lastRotation = 720;
      }
      else if (this.cumulativeRotation >= 1080 && this.lastRotation < 1080) {
        console.log('TRIPLE FRONTFLIP TRIGGERED!');
        this.completeTrick('Triple Frontflip', 100);
        this.lastRotation = 1080;
      }
    }
  }

  private completeTrick(trickName: string, basePoints: number): void {
    // Add points immediately (don't wait for landing)
    this.score += basePoints;

    // Increase combo multiplier for subsequent tricks
    this.comboMultiplier = Math.min(this.comboMultiplier + 0.25, 5);

    // Show trick text
    this.showTrickText(trickName, basePoints);
  }

  private showTrickText(trickName: string, points: number): void {
    if (!this.player) return;

    const pos = this.player.getPosition();
    const text = this.add.text(pos.x, pos.y - 100, `${trickName}\n+${points}pts`, {
      fontSize: '24px',
      color: '#FFD700',
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
      this.onScoreUpdate(this.score, this.distance, this.comboMultiplier);
    }

    // Reset combo if grounded
    if (this.player?.isGrounded) {
      this.comboMultiplier = 1;
    }
  }

  private updateTrickHUD(): void {
    if (this.onTrickUpdate) {
      this.onTrickUpdate(this.currentTrickPoints, this.currentTrickName);
    }
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

    // Create a semi-transparent overlay with fixed position
    const overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width * 2,
      this.cameras.main.height * 2,
      0x000000,
      0.6
    );
    overlay.setScrollFactor(0);
    overlay.setDepth(1000);
    overlay.setOrigin(0);

    // Display game over text with angle information
    const gameOverText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      'GAME OVER',
      {
        fontSize: '64px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8,
      }
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(1001);

    // Display crash reason
    const crashMessage = displayAngle === 999
      ? 'Still holding trick on landing!'
      : `Landing Angle: ${displayAngle.toFixed(1)}°\n(Max: 30°)`;

    const angleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      crashMessage,
      {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      }
    );
    angleText.setOrigin(0.5);
    angleText.setScrollFactor(0);
    angleText.setDepth(1001);

    // Display score
    const scoreText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 80,
      `Score: ${this.score}\nDistance: ${this.distance}m`,
      {
        fontSize: '28px',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      }
    );
    scoreText.setOrigin(0.5);
    scoreText.setScrollFactor(0);
    scoreText.setDepth(1001);

    // Call the game over callback with landing angle but DON'T pause
    // This keeps the scene visible with the freeze frame
    if (this.onGameOver) {
      // Don't pass 999 special value to the callback
      const angleToReport = displayAngle === 999 ? undefined : displayAngle;
      this.onGameOver(this.score, this.distance, angleToReport);
    }
  }

  public cleanup(): void {
    if (this.player) {
      this.player.destroy();
    }
  }
}
