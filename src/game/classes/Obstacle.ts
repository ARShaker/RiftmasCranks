import Phaser from 'phaser';
import { ObstacleData } from '../../types/game';

export class ObstacleManager {
  private scene: Phaser.Scene;
  private obstacles: Phaser.Physics.Arcade.Group;
  private lastObstacleX = 800;
  private minDistance = 300;
  private maxDistance = 600;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.obstacles = scene.physics.add.group({
      immovable: true,
      allowGravity: false,
    });
  }

  public update(cameraX: number): void {
    // Remove obstacles that are off-screen
    this.obstacles.children.entries.forEach((obstacle) => {
      const sprite = obstacle as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < cameraX - 800) {
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

    const types: ObstacleData['type'][] = ['rock', 'ramp', 'gap'];
    const type = Phaser.Utils.Array.GetRandom(types);

    const baseY = 450; // Approximate ground level

    switch (type) {
      case 'rock':
        this.createRock(this.lastObstacleX, baseY);
        break;
      case 'ramp':
        this.createRamp(this.lastObstacleX, baseY);
        break;
      case 'gap':
        this.createGap(this.lastObstacleX, baseY);
        break;
    }
  }

  private createRock(x: number, y: number): void {
    const width = Phaser.Math.Between(30, 60);
    const height = Phaser.Math.Between(40, 80);

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x696969, 1); // Dark gray
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(`rock_${x}`, width, height);
    graphics.destroy();

    const rock = this.obstacles.create(x, y - height / 2, `rock_${x}`);
    rock.setImmovable(true);
    rock.body.allowGravity = false;
  }

  private createRamp(x: number, y: number): void {
    const width = 150;
    const height = 60;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x8B4513, 1); // Brown
    graphics.fillTriangle(0, height, width, height, width, 0);
    graphics.generateTexture(`ramp_${x}`, width, height);
    graphics.destroy();

    const ramp = this.obstacles.create(x, y - height / 2, `ramp_${x}`);
    ramp.setImmovable(true);
    ramp.body.allowGravity = false;
  }

  private createGap(x: number, y: number): void {
    // Gap is represented by lack of terrain
    // We'll create invisible markers for scoring/danger zones
    const width = Phaser.Math.Between(100, 200);

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRect(0, 0, width, 10);
    graphics.generateTexture(`gap_${x}`, width, 10);
    graphics.destroy();

    const gap = this.obstacles.create(x, y + 50, `gap_${x}`);
    gap.setImmovable(true);
    gap.body.allowGravity = false;
    gap.setAlpha(0.3);
  }

  public getObstacles(): Phaser.Physics.Arcade.Group {
    return this.obstacles;
  }
}
