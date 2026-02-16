import Phaser from 'phaser';
import { Terrain } from './Terrain';

export class CoinManager {
  private scene: Phaser.Scene;
  private coins: Phaser.Physics.Arcade.Group;
  private terrain?: Terrain;
  private spawnChance = 0.30; // 25% spawn rate
  private coinScale = 0.18; // Scale for the favicon image
  private floatOffset = 80; // How high above ground/obstacle the coin floats
  private spawnedPositions: Set<string> = new Set(); // Track where coins have been spawned

  constructor(scene: Phaser.Scene, terrain?: Terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.coins = scene.physics.add.group({
      immovable: true,
      allowGravity: false,
    });
  }

  public getCoins(): Phaser.Physics.Arcade.Group {
    return this.coins;
  }

  public update(cameraX: number): void {
    // Remove coins that are off-screen to the left
    this.coins.children.entries.forEach((coin) => {
      const sprite = coin as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < cameraX - 500) {
        this.spawnedPositions.delete(`${Math.round(sprite.x)}`);
        sprite.destroy();
      }
    });

    // Add floating animation to coins
    const time = this.scene.time.now;
    this.coins.children.entries.forEach((coin) => {
      const sprite = coin as Phaser.Physics.Arcade.Sprite;
      const baseY = sprite.getData('baseY') as number;
      if (baseY !== undefined) {
        // Gentle floating motion
        sprite.y = baseY + Math.sin(time * 0.003 + sprite.x * 0.01) * 8;
      }
    });
  }

  // Spawn a coin at ramp edge (called by Terrain when ramp is created)
  public trySpawnAtRampEdge(x: number, y: number): void {
    const posKey = `${Math.round(x)}`;
    if (this.spawnedPositions.has(posKey)) return;

    if (Math.random() < this.spawnChance) {
      this.createCoin(x, y - this.floatOffset);
      this.spawnedPositions.add(posKey);
    }
  }

  // Spawn a coin above an obstacle (called by ObstacleManager when obstacle is created)
  public trySpawnAboveObstacle(x: number, y: number, obstacleHeight: number): void {
    const posKey = `${Math.round(x)}`;
    if (this.spawnedPositions.has(posKey)) return;

    if (Math.random() < this.spawnChance) {
      // Position coin above the obstacle
      const coinY = y - obstacleHeight - this.floatOffset;
      this.createCoin(x, coinY);
      this.spawnedPositions.add(posKey);
    }
  }

  private createCoin(x: number, y: number): void {
    const coin = this.coins.create(x, y, 'coin') as Phaser.Physics.Arcade.Sprite;
    coin.setScale(this.coinScale);
    coin.setImmovable(true);
    (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Store base Y for floating animation
    coin.setData('baseY', y);

    // Set circular hitbox for better collection feel
    const body = coin.body as Phaser.Physics.Arcade.Body;
    const size = Math.min(coin.width, coin.height) * 0.8;
    body.setCircle(size / 2, (coin.width - size) / 2, (coin.height - size) / 2);
  }

  public collectCoin(coin: Phaser.Physics.Arcade.Sprite): void {
    // Show +50 popup
    this.showPointsPopup(coin.x, coin.y);

    // Remove from tracking
    this.spawnedPositions.delete(`${Math.round(coin.x)}`);

    // Destroy the coin
    coin.destroy();
  }

  private showPointsPopup(x: number, y: number): void {
    const text = this.scene.add.text(x, y, '+50', {
      fontSize: '28px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5);

    // Animate upward and fade out
    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scale: 1.3,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  public clearAll(): void {
    this.coins.clear(true, true);
    this.spawnedPositions.clear();
  }
}
