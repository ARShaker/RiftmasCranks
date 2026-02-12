import Phaser from 'phaser';
import { Terrain } from './Terrain';

type ObstacleType = 'rock' | 'tree' | 'sign';

export class ObstacleManager {
  private obstacles: Phaser.Physics.Arcade.Group;
  private lastObstacleX = 800;
  private minDistance = 300;
  private maxDistance = 700;
  private terrain?: Terrain;

  // Base scales and collision box ratios for each obstacle type
  private obstacleConfig: Record<ObstacleType, { baseScale: number; scaleVariance: number; hitboxRatio: { width: number; height: number } }> = {
    rock: { baseScale: 0.1, scaleVariance: 0.03, hitboxRatio: { width: 0.7, height: 0.6 } },
    tree: { baseScale: 0.12, scaleVariance: 0.04, hitboxRatio: { width: 0.3, height: 0.5 } },
    sign: { baseScale: 0.2, scaleVariance: 0.05, hitboxRatio: { width: 0.3, height: 0.8 } },
  };

  constructor(scene: Phaser.Scene, terrain?: Terrain) {
    this.terrain = terrain;
    this.obstacles = scene.physics.add.group({
      immovable: true,
      allowGravity: false,
    });
  }

  public update(cameraX: number): void {
    // Remove obstacles that are off-screen
    this.obstacles.children.entries.forEach((obstacle) => {
      const sprite = obstacle as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < cameraX - 1500) {
        sprite.destroy();
      }
    });

    // Add new obstacles
    if (this.lastObstacleX < cameraX + 1500) {
      this.spawnObstacle();
    }
  }

  private spawnObstacle(): void {
    const distance = Phaser.Math.Between(this.minDistance, this.maxDistance);
    this.lastObstacleX += distance;

    // Don't spawn obstacles on ramps
    if (this.terrain && this.terrain.isOnRamp(this.lastObstacleX)) {
      return;
    }

    // Randomly choose obstacle type
    const types: ObstacleType[] = ['rock', 'tree', 'sign'];
    const obstacleType = types[Phaser.Math.Between(0, types.length - 1)];

    this.createObstacle(this.lastObstacleX, obstacleType);
  }

  private getTerrainSlopeAngle(x: number): number {
    if (!this.terrain) return 0;

    // Get two nearby points to calculate slope
    const sampleDistance = 20;
    const y1 = this.terrain.getGroundY(x - sampleDistance);
    const y2 = this.terrain.getGroundY(x + sampleDistance);

    // Calculate slope angle
    const deltaY = y2 - y1;
    const deltaX = sampleDistance * 2;

    const slopeAngleRadians = Math.atan2(deltaY, deltaX);
    const slopeAngleDegrees = slopeAngleRadians * (180 / Math.PI);

    return slopeAngleDegrees;
  }

  private createObstacle(x: number, type: ObstacleType): void {
    if (!this.terrain) return;

    const config = this.obstacleConfig[type];
    const textureKey = `obstacle-${type}`;

    // Calculate random scale within variance range
    const scale = config.baseScale + Phaser.Math.FloatBetween(-config.scaleVariance, config.scaleVariance);

    // Get ground position and slope angle
    const groundY = this.terrain.getGroundY(x);
    const slopeAngle = this.getTerrainSlopeAngle(x);

    // Create the sprite (use default origin 0.5, 0.5 for proper physics body alignment)
    const obstacle = this.obstacles.create(x, 0, textureKey) as Phaser.Physics.Arcade.Sprite;
    obstacle.setImmovable(true);
    (obstacle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    obstacle.setScale(scale);

    // Position so bottom of sprite sits on ground
    obstacle.y = groundY - obstacle.displayHeight / 2;

    // Rotate to align with slope
    obstacle.setAngle(slopeAngle);

    // Set collision box based on the type's hitbox ratio
    const body = obstacle.body as Phaser.Physics.Arcade.Body;
    const hitboxWidth = obstacle.width * config.hitboxRatio.width;
    const hitboxHeight = obstacle.height * config.hitboxRatio.height;

    body.setSize(hitboxWidth, hitboxHeight);

    // Center the hitbox horizontally, align to bottom of sprite
    const offsetX = (obstacle.width - hitboxWidth) / 2;
    const offsetY = obstacle.height - hitboxHeight;
    body.setOffset(offsetX, offsetY);
  }

  public getObstacles(): Phaser.Physics.Arcade.Group {
    return this.obstacles;
  }

  public clearAll(): void {
    this.obstacles.clear(true, true);
  }
}
