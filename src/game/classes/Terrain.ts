import Phaser from 'phaser';

export class Terrain {
  private scene: Phaser.Scene;
  private groundGraphics: Phaser.GameObjects.Graphics;
  private segmentWidth = 20; // Even smaller segments for smoother hills
  private lastSegmentX = -1000; // Start far off-screen to the left
  private baseY = 450;
  private points: { x: number; y: number }[] = [];

  // Sine wave parameters for varied hills
  private waveOffset = 0;

  // Ramp generation
  private nextRampX = 1000;
  private rampMinDistance = 800;
  private rampMaxDistance = 1600;
  private rampWidth = 150;
  private activeRamps: { start: number; end: number }[] = [];

  // Performance optimization: track if terrain needs redrawing
  private needsRedraw = true;

  // Performance optimization: cache for getGroundY lookups
  private lastLookupX = -Infinity;
  private lastLookupIndex = 0;

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

    let y = this.baseY - wave1 - wave2 - wave3 - wave4;

    // Check if we should add a ramp here
    if (x >= this.nextRampX && x < this.nextRampX + this.rampWidth) {
      // We're in a ramp section - make it triangular (linear ramp up)
      const rampProgress = (x - this.nextRampX) / this.rampWidth; // 0 to 1 across the ramp
      const rampHeight = 60 * rampProgress; // Linear increase for triangle shape
      y -= rampHeight; // Subtract to make ramp go up

      // Track this ramp for collision avoidance
      const rampStart = this.nextRampX;
      const rampEnd = this.nextRampX + this.rampWidth;
      if (!this.activeRamps.some(r => r.start === rampStart)) {
        this.activeRamps.push({ start: rampStart, end: rampEnd });
      }

      // If we just finished the ramp, schedule the next one
      if (x >= this.nextRampX + this.rampWidth - this.segmentWidth) {
        this.nextRampX = x + Phaser.Math.Between(this.rampMinDistance, this.rampMaxDistance);
        console.log(`Next ramp scheduled at x=${this.nextRampX}`);
      }
    }

    this.points.push({ x, y });
    this.lastSegmentX = x;
  }

  private drawTerrain(): void {
    this.groundGraphics.clear();

    if (this.points.length < 2) return;

    // Draw shaded terrain with multiple layers for gradient effect
    const shadeColors = [
      { color: 0xFFFFFF, offset: 0 },    // White at top (snow surface)
      { color: 0xE8F4F8, offset: 30 },   // Very light blue-white
      { color: 0xD0E8F0, offset: 80 },   // Light icy blue
      { color: 0xB8DCE8, offset: 150 },  // Medium icy blue
      { color: 0xA0D0E0, offset: 300 },  // Deeper blue shadow
    ];

    // Draw shade layers from bottom to top
    for (let s = shadeColors.length - 1; s >= 0; s--) {
      const shade = shadeColors[s];
      this.groundGraphics.fillStyle(shade.color, 1);

      this.groundGraphics.beginPath();
      this.groundGraphics.moveTo(this.points[0].x, this.points[0].y + shade.offset);

      for (let i = 1; i < this.points.length; i++) {
        this.groundGraphics.lineTo(this.points[i].x, this.points[i].y + shade.offset);
      }

      const lastPoint = this.points[this.points.length - 1];
      this.groundGraphics.lineTo(lastPoint.x, 2000);
      this.groundGraphics.lineTo(this.points[0].x, 2000);
      this.groundGraphics.lineTo(this.points[0].x, this.points[0].y + shade.offset);

      this.groundGraphics.closePath();
      this.groundGraphics.fillPath();
    }

    // Draw the top surface line for definition
    this.groundGraphics.lineStyle(2, 0xCCE0E8, 1); // Subtle blue-white line
    this.groundGraphics.beginPath();
    this.groundGraphics.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.groundGraphics.lineTo(this.points[i].x, this.points[i].y);
    }
    this.groundGraphics.strokePath();
  }

  public update(cameraX: number): void {
    const hadPoints = this.points.length > 0;
    const oldFirstX = hadPoints ? this.points[0].x : 0;
    const oldPointCount = this.points.length;

    // Remove points that are far off-screen to the left (keep more behind camera)
    while (this.points.length > 0 && this.points[0].x < cameraX - 2000) {
      this.points.shift();
      // Reset lookup cache when points are removed from the front
      this.lastLookupIndex = 0;
    }

    // Add new points as needed - extend further ahead to cover obstacle spawn distance
    // Obstacles spawn at cameraX + 1500, plus up to 350 distance = need 1850+ buffer
    while (this.lastSegmentX < cameraX + 2000) {
      this.addPoint();
    }

    // Clean up old ramps
    this.cleanupRamps(cameraX);

    // Only redraw terrain if points changed (added or removed)
    const newFirstX = this.points.length > 0 ? this.points[0].x : 0;
    if (this.points.length !== oldPointCount || newFirstX !== oldFirstX) {
      this.needsRedraw = true;
    }

    if (this.needsRedraw) {
      this.drawTerrain();
      this.needsRedraw = false;
    }
  }

  public getPlatforms(): Phaser.Physics.Arcade.StaticGroup {
    // This method is kept for compatibility but we'll handle collision differently
    return this.scene.physics.add.staticGroup();
  }

  public getGroundY(x: number): number {
    // Find the ground height at a specific x position
    if (this.points.length < 2) return this.baseY;

    // Use cached index as starting point for faster lookup
    // Since player generally moves forward, start from last found index
    let startIndex = 0;
    if (x >= this.lastLookupX && this.lastLookupIndex < this.points.length - 1) {
      startIndex = this.lastLookupIndex;
    }

    // Search forward from cached position
    for (let i = startIndex; i < this.points.length - 1; i++) {
      if (x >= this.points[i].x && x <= this.points[i + 1].x) {
        // Cache this lookup for next time
        this.lastLookupX = x;
        this.lastLookupIndex = i;

        // Linear interpolation between the two points
        const t = (x - this.points[i].x) / (this.points[i + 1].x - this.points[i].x);
        return this.points[i].y + (this.points[i + 1].y - this.points[i].y) * t;
      }
    }

    // If not found searching forward, search from beginning (rare case)
    for (let i = 0; i < startIndex; i++) {
      if (x >= this.points[i].x && x <= this.points[i + 1].x) {
        this.lastLookupX = x;
        this.lastLookupIndex = i;
        const t = (x - this.points[i].x) / (this.points[i + 1].x - this.points[i].x);
        return this.points[i].y + (this.points[i + 1].y - this.points[i].y) * t;
      }
    }

    // If x is beyond our points, return the last point's y
    const lastY = this.points[this.points.length - 1]?.y || this.baseY;
    return lastY;
  }

  public getPoints(): { x: number; y: number }[] {
    return this.points;
  }

  public checkCollision(playerX: number, playerY: number, playerHeight: number): boolean {
    const groundY = this.getGroundY(playerX);
    return playerY + playerHeight / 2 >= groundY;
  }

  public isOnRamp(x: number, buffer: number = 50): boolean {
    // Check if x position is on or near a ramp (with buffer zone)
    for (const ramp of this.activeRamps) {
      if (x >= ramp.start - buffer && x <= ramp.end + buffer) {
        return true;
      }
    }
    return false;
  }

  public cleanupRamps(cameraX: number): void {
    // Remove ramps that are far behind the camera
    this.activeRamps = this.activeRamps.filter(ramp => ramp.end > cameraX - 2000);
  }
}
