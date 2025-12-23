import Phaser from 'phaser';
import { Character } from '../../types/character';
import { Player } from '../classes/Player';
import { Terrain } from '../classes/Terrain';
import { ObstacleManager } from '../classes/Obstacle';

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private terrain?: Terrain;
  private obstacleManager?: ObstacleManager;
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
  private selectedCharacter?: Character;

  // Callback to update React state
  private onScoreUpdate?: (score: number, distance: number, multiplier: number) => void;
  private onGameOver?: (score: number, distance: number) => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  public init(data?: {
    character?: Character;
    onScoreUpdate?: (score: number, distance: number, multiplier: number) => void;
    onGameOver?: (score: number, distance: number) => void;
  }): void {
    // Only set if data is provided (scene restart)
    if (data?.character) {
      this.selectedCharacter = data.character;
      this.onScoreUpdate = data.onScoreUpdate;
      this.onGameOver = data.onGameOver;

      // Reset game state
      this.score = 0;
      this.distance = 0;
      this.comboMultiplier = 1;
    }
  }

  public create(): void {
    // Don't create anything if no character selected (auto-start case)
    if (!this.selectedCharacter) {
      return;
    }

    // Create terrain
    this.terrain = new Terrain(this);

    // Create obstacle manager
    this.obstacleManager = new ObstacleManager(this);

    // Create player
    this.player = new Player(this, 200, 300, this.selectedCharacter);

    // Setup controls
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
    if (!this.player || !this.terrain || !this.obstacleManager) {
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
          // Player just landed - check if they crashed (extremely tight!)
          const landingAngle = Math.abs(this.player.sprite.angle % 360);
          // Crash if landing more than 30° from vertical - very tight!
          const isBadLanding = (landingAngle > 30 && landingAngle < 330);

          if (isBadLanding) {
            // Crashed! Game over
            this.gameOver();
            return;
          }

          this.player.isGrounded = true;

          // Calculate terrain slope angle at landing point
          const slopeAngle = this.getTerrainSlopeAngle(playerPos.x);

          // Set rotation to match terrain slope
          this.player.sprite.setAngle(slopeAngle);

          // DON'T reset lastRotation here - we need it to track if tricks were completed during the air time
          // It will be reset when player becomes airborne again
        }
      }
    } else if (playerBottom < groundY - threshold - 5) {
      // Only set airborne if clearly above ground (extra buffer)
      if (this.player.isGrounded) {
        // Just became airborne - reset rotation tracking for new tricks
        this.lastRotation = 0;
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

    // Handle WASD trick inputs
    if (this.wasdKeys) {
      if (this.wasdKeys.W.isDown) {
        this.player.performTrick('w');
      } else {
        this.player.stopTrick('w');
      }

      if (this.wasdKeys.A.isDown) {
        this.player.performTrick('a');
      } else {
        this.player.stopTrick('a');
      }

      if (this.wasdKeys.S.isDown) {
        this.player.performTrick('s');
      } else {
        this.player.stopTrick('s');
      }

      if (this.wasdKeys.D.isDown) {
        this.player.performTrick('d');
      } else {
        this.player.stopTrick('d');
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

    const currentRotation = this.player.getRotation();

    // Only check tricks while in the air
    if (!this.player.isGrounded) {
      // Check for backflip (negative rotation past -360)
      if (currentRotation <= -360 && this.lastRotation > -360) {
        this.completeTrick('Backflip', 150);
        this.lastRotation = -360;
      }
      // Check for multiple backflips
      else if (currentRotation <= -720 && this.lastRotation > -720) {
        this.completeTrick('Double Backflip', 300);
        this.lastRotation = -720;
      }

      // Check for frontflip (positive rotation past 360)
      if (currentRotation >= 360 && this.lastRotation < 360) {
        this.completeTrick('Frontflip', 150);
        this.lastRotation = 360;
      }
      // Check for multiple frontflips
      else if (currentRotation >= 720 && this.lastRotation < 720) {
        this.completeTrick('Double Frontflip', 300);
        this.lastRotation = 720;
      }
    }
  }

  private completeTrick(trickName: string, basePoints: number): void {
    const points = basePoints * this.comboMultiplier;
    this.score += points;
    this.comboMultiplier = Math.min(this.comboMultiplier + 0.5, 5);

    // Show trick text
    this.showTrickText(trickName, points);
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

    // Calculate slope angle - the character should stand perpendicular to the ground
    // with skis flat on the slope
    const deltaY = y2 - y1;
    const deltaX = sampleDistance * 2;

    // Use atan to get the perpendicular angle (90 degrees to the slope)
    const perpAngleRadians = Math.atan(-deltaX / deltaY);
    const perpAngleDegrees = perpAngleRadians * (180 / Math.PI);

    return perpAngleDegrees;
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

  private gameOver(): void {
    this.scene.pause();
    if (this.onGameOver) {
      this.onGameOver(this.score, this.distance);
    }
  }

  public cleanup(): void {
    if (this.player) {
      this.player.destroy();
    }
  }
}
