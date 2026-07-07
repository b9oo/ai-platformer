//% color=#00A4FF icon="\uf0b2" block="Parkour AI"
namespace ParkourAI {
    export class ParkourAgent {
        sprite: Sprite;
        target: Sprite | tiles.Location;
        jumpPower: number = 200;
        moveSpeed: number = 80;
        active: boolean = true;

        constructor(sprite: Sprite, target: Sprite | tiles.Location) {
            this.sprite = sprite;
            this.target = target;
            game.onUpdate(() => this.update());
        }

        setJumpPower(power: number) {
            this.jumpPower = power;
        }

        setMoveSpeed(speed: number) {
            this.moveSpeed = speed;
        }

        private update() {
            if (!this.active || !this.sprite) return;

            const tx = this.getTargetX();
            const dx = tx - this.sprite.x;

            // Horizontal movement toward target
            if (Math.abs(dx) > 5) {
                this.sprite.vx = this.moveSpeed * Math.sign(dx);
            } else {
                this.sprite.vx = 0;
            }

            // Parkour jump logic
            if (this.shouldJump()) {
                this.sprite.vy = -this.jumpPower;
            }
        }

        private getTargetX(): number {
            if (this.target instanceof Sprite) {
                return this.target.x;
            } else if (this.target) {
                return (this.target as any).x * 16 + 8;
            }
            return this.sprite.x;
        }

        private shouldJump(): boolean {
            if (this.sprite.vy < -10) return false; // already jumping upward

            const dir = Math.sign(this.sprite.vx || 1);
            const aheadX = this.sprite.x + dir * 18;
            const feetY = this.sprite.y + 12;

            const wallAhead = this.isSolidAt(aheadX, this.sprite.y - 8);
            const gapAhead = !this.isSolidAt(aheadX, feetY + 8);

            const landingPlatform = this.isSolidAt(aheadX + dir * 10, feetY - 25);

            return (wallAhead || gapAhead) && landingPlatform && 
                   this.sprite.isHittingTile(CollisionDirection.Bottom);
        }

        private isSolidAt(x: number, y: number): boolean {
            if (!game.currentScene().tileMap) return false;
            const col = Math.floor(x / 16);
            const row = Math.floor(y / 16);
            const tile = tiles.getTileAt(col, row);
            // Solid if tile exists and is not transparent/empty
            return tile && (tile as any) !== 0;
        }
    }

    let agents: ParkourAgent[] = [];

    //% block="enable parkour AI on $sprite following $target"
    //% sprite.shadow="variables_get"
    //% target.shadow="variables_get"
    //% group="AI Control"
    export function enableParkourAI(sprite: Sprite, target: Sprite | tiles.Location) {
        if (!sprite) return;
        disableParkourAI(sprite);
        const agent = new ParkourAgent(sprite, target);
        agents.push(agent);
    }

    //% block="set AI jump power for $sprite to $power"
    //% power.defl=200
    //% group="AI Settings"
    export function setAIJumpPower(sprite: Sprite, power: number) {
        const agent = agents.find(a => a && a.sprite === sprite);
        if (agent) agent.setJumpPower(power);
    }

    //% block="set AI move speed for $sprite to $speed"
    //% speed.defl=80
    //% group="AI Settings"
    export function setAIMoveSpeed(sprite: Sprite, speed: number) {
        const agent = agents.find(a => a && a.sprite === sprite);
        if (agent) agent.setMoveSpeed(speed);
    }

    //% block="disable parkour AI on $sprite"
    //% group="AI Control"
    export function disableParkourAI(sprite: Sprite) {
        const idx = agents.findIndex(a => a && a.sprite === sprite);
        if (idx >= 0) {
            agents[idx].active = false;
            agents.removeAt(idx);
        }
    }
}
