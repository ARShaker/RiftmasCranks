import Phaser from 'phaser';

export class Terrain {
  private scene: Phaser.Scene;
  private groundGraphics: Phaser.GameObjects.Graphics;
  private groundBody: Phaser.Physics.Arcade.Body;
  private segmentWidth = 20; // Even smaller segments for smoother hills
  private lastSegmentX = -1000; // Start far off-screen to the left
  private baseY = 450;
  private points: { x: number; y: number }[] = [];

  // Sine wave parameters for varied hills
  private waveOffset = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.groundGraphics = scene.add.graphics();

    // Create initial terrain points
    this.generateInitialTerrain();
    this.drawTerrain();
  }

  private generateInitialTerrain(): void {
    // Generate points for several screens worth
    for (let i = 0; i < 150; i++) {
      this.addPoint();
    }
  }

  private addPoint(): void {
    const x = this.lastSegmentX + this.segmentWidth;

    // Create large swooping mountains with random variation
    // Much larger amplitudes and lower frequencies for big, smooth slopes
    const wave1 = Math.sin((x + this.waveOffset) * 0.0008) * 250;  // Massive hills
    const wave2 = Math.sin((x + this.waveOffset) * 0.002) * 150;   // Large variation
    const wave3 = Math.sin((x + this.waveOffset) * 0.005) * 80;    // Medium slopes
    const wave4 = Math.sin((x + this.waveOffset) * 0.012) * 30;    // Small details

    const y = this.baseY - wave1 - wave2 - wave3 - wave4;

    this.points.push({ x, y });
    this.lastSegmentX = x;
  }

  private drawTerrain(): void {
    this.groundGraphics.clear();

    if (this.points.length < 2) return;

    // Draw white filled terrain
    this.groundGraphics.fillStyle(0xFFFFFF, 1); // White color
    this.groundGraphics.lineStyle(3, 0xFFFFFF, 1);

    // Start the path
    this.groundGraphics.beginPath();
    this.groundGraphics.moveTo(this.points[0].x, this.points[0].y);

    // Draw smooth curve through all points
    for (let i = 1; i < this.points.length; i++) {
      this.groundGraphics.lineTo(this.points[i].x, this.points[i].y);
    }

    // Close the shape by drawing down and back
    const lastPoint = this.points[this.points.length - 1];
    this.groundGraphics.lineTo(lastPoint.x, 800); // Down to bottom
    this.groundGraphics.lineTo(this.points[0].x, 800); // Back to start x
    this.groundGraphics.lineTo(this.points[0].x, this.points[0].y); // Up to start

    this.groundGraphics.closePath();
    this.groundGraphics.fillPath();
    this.groundGraphics.strokePath();
  }

  public update(cameraX: number): void {
    // Remove points that are far off-screen to the left
    while (this.points.length > 0 && this.points[0].x < cameraX - 400) {
      this.points.shift();
    }

    // Add new points as needed
    while (this.lastSegmentX < cameraX + 1200) {
      this.addPoint();
    }

    // Redraw terrain
    this.drawTerrain();
  }

  public getPlatforms(): Phaser.Physics.Arcade.StaticGroup {
    // This method is kept for compatibility but we'll handle collision differently
    return this.scene.physics.add.staticGroup();
  }

  public getGroundY(x: number): number {
    // Find the ground height at a specific x position
    if (this.points.length < 2) return this.baseY;

    // Find the two points that x is between
    for (let i = 0; i < this.points.length - 1; i++) {
      if (x >= this.points[i].x && x <= this.points[i + 1].x) {
        // Linear interpolation between the two points
        const t = (x - this.points[i].x) / (this.points[i + 1].x - this.points[i].x);
        return this.points[i].y + (this.points[i + 1].y - this.points[i].y) * t;
      }
    }

    // If x is beyond our points, return the last point's y
    return this.points[this.points.length - 1]?.y || this.baseY;
  }

  public getPoints(): { x: number; y: number }[] {
    return this.points;
  }

  public checkCollision(playerX: number, playerY: number, playerHeight: number): boolean {
    const groundY = this.getGroundY(playerX);
    return playerY + playerHeight / 2 >= groundY;
  }
}
