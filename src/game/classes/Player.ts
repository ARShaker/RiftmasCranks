import Phaser from 'phaser';
import { Character } from '../../types/character';
import { Trick } from '../../types/game';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public character: Character;
  private scene: Phaser.Scene;

  // Physics properties
  private baseJumpVelocity = -600;
  private baseSpeed = 200;
  private crouchMultiplier = 0.5;
  private gravityBoostMultiplier = 2.5;

  // State
  public isGrounded = false;
  public isCrouching = false;
  public isBoostingGravity = false;
  private rotation = 0;

  // Trick tracking
  public currentTrick: Trick | null = null;
  public activeTrickKeys: Set<string> = new Set();

  constructor(scene: Phaser.Scene, x: number, y: number, character: Character) {
    this.scene = scene;
    this.character = character;

    // Create sprite using the spritesheet
    this.sprite = scene.physics.add.sprite(x, y, 'skier', 0);

    // Scale based on character height
    const scale = character.height * 1.5;
    this.sprite.setScale(scale);

    this.sprite.setCollideWorldBounds(false);

    // Apply physics properties based on character stats
    this.applyCharacterPhysics();
  }

  private applyCharacterPhysics(): void {
    // Heavier characters have more mass and fall faster
    // Taller characters have larger hitboxes
    this.sprite.body!.setSize(32, 32); // Use the actual sprite size
  }

  public jump(): void {
    if (this.isGrounded) {
      // Taller characters get more jump height
      const jumpPower = this.baseJumpVelocity * (0.9 + this.character.height * 0.1);
      this.sprite.setVelocityY(jumpPower);
      this.isGrounded = false;
    }
  }

  public startCrouch(): void {
    if (this.isGrounded) {
      this.isCrouching = true;
      this.sprite.setScale(1, this.crouchMultiplier);
    } else {
      // In air, boost gravity
      this.startGravityBoost();
    }
  }

  public stopCrouch(): void {
    this.isCrouching = false;
    this.sprite.setScale(1, 1);
    this.stopGravityBoost();
  }

  public startGravityBoost(): void {
    if (!this.isGrounded) {
      this.isBoostingGravity = true;
    }
  }

  public stopGravityBoost(): void {
    this.isBoostingGravity = false;
  }

  public update(): void {
    // Apply gravity modifications based on character weight and boost
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      const baseGravity = 800;
      let gravityMultiplier = this.character.weight;

      if (this.isBoostingGravity && !this.isGrounded) {
        gravityMultiplier *= this.gravityBoostMultiplier;
      }

      body.setGravityY(baseGravity * (gravityMultiplier - 1));

      // Apply horizontal speed based on weight (heavier = faster)
      const currentSpeed = this.baseSpeed * this.character.weight;
      this.sprite.setVelocityX(currentSpeed);

      // Track rotation for tricks
      this.rotation = this.sprite.angle;

      // Note: isGrounded is now managed by GameScene's custom terrain collision
      // Don't check sprite.body.touching.down here as we use custom collision
    }
  }

  public performTrick(key: string): void {
    if (!this.isGrounded) {
      this.activeTrickKeys.add(key);

      // Rotate based on key - much faster rotation!
      // Taller characters rotate slower (harder to complete tricks)
      const rotationSpeed = 10 / this.character.height; // Doubled from 5 to 10

      switch(key) {
        case 'w': // Front flip
          this.sprite.angle += rotationSpeed;
          break;
        case 's': // Back flip
          this.sprite.angle -= rotationSpeed;
          break;
        case 'a': // Roll left
          this.sprite.angle -= rotationSpeed * 0.5;
          break;
        case 'd': // Roll right
          this.sprite.angle += rotationSpeed * 0.5;
          break;
      }
    }
  }

  public stopTrick(key: string): void {
    this.activeTrickKeys.delete(key);
  }

  public getRotation(): number {
    return this.sprite.angle;
  }

  public getPosition(): { x: number; y: number } {
    return {
      x: this.sprite.x,
      y: this.sprite.y,
    };
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
