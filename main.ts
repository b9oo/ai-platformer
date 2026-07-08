//% color=#00A4FF icon="\uf0b2" block="Parkour AI"
namespace ParkourAI {
    export class ParkourAgent {
        sprite: Sprite;
        target: Sprite | tiles.Location;
        jumpPower: number = 230;
        moveSpeed: number = 75;
        active: boolean = true;
        lastJump: number = 0;

        constructor(sprite: Sprite, target: Sprite | tiles.Location) {
            this.sprite = sprite;
            this.target = target;
            game.onUpdate(() => this.update());
        }

        setJumpPower(power: number) { this.jumpPower = power; }
        setMoveSpeed(speed: number) { this.moveSpeed = speed; }

        private update() {
            if (!this.active || !this.sprite) return;

            const tx = this.getTargetX();
            const ty = this.getTargetY();
            const dx = tx - this.sprite.x;
            const dy = ty - this.sprite.y;

            if (Math.abs(dx) > 8) {
                this.sprite.vx = this.moveSpeed * Math.sign(dx);
            } else {
                this.sprite.vx *= 0.75;
            }

            if (this.shouldJump(dy) && control.millis() - this.lastJump > 350) {
                this.sprite.vy = -this.jumpPower;
                this.lastJump = control.millis();
            }
        }

        private getTargetX(): number {
            return this.target instanceof Sprite ? this.target.x :
                (this.target ? (this.target as any).x * 16 + 8 : this.sprite.x);
        }

        private getTargetY(): number {
            return this.target instanceof Sprite ? this.target.y : this.sprite.y;
        }

        private shouldJump(dy: number): boolean {
            if (this.sprite.vy < -20) return false;

            const dir = Math.sign(this.sprite.vx || 1);
            const aheadX = this.sprite.x + dir * 20;
            const feetY = this.sprite.y + 14;

            const onGround = this.sprite.isHittingTile(CollisionDirection.Bottom);

            // Climb if player is above
            if (dy < -25 && onGround) {
                if (!this.isSolidAt(this.sprite.x, this.sprite.y - 40) ||
                    this.isSolidAt(aheadX, this.sprite.y - 35)) {
                    return true;
                }
            }

            // Normal parkour
            const wallAhead = this.isSolidAt(aheadX, this.sprite.y - 12);
            const gapAhead = !this.isSolidAt(aheadX, feetY + 12);
            const canLand = this.isSolidAt(aheadX + dir * 8, feetY - 30);

            return onGround && (wallAhead || gapAhead || dy < -20) && canLand;
        }

        private isSolidAt(x: number, y: number): boolean {
            if (!game.currentScene().tileMap) return false;
            const col = Math.floor(x / 16);
            const row = Math.floor(y / 16);
            const tile = tiles.getTileAt(col, row);
            // Final safe check
            if (tile == null) return false;
            if (typeof tile === "number") {
                return tile !== 0;
            }
            return true;
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
    //% power.defl=230
    //% group="AI Settings"
    export function setAIJumpPower(sprite: Sprite, power: number) {
        for (let i = 0; i < agents.length; i++) {
            if (agents[i] && agents[i].sprite === sprite) {
                agents[i].setJumpPower(power);
                return;
            }
        }
    }

    //% block="set AI move speed for $sprite to $speed"
    //% speed.defl=75
    //% group="AI Settings"
    export function setAIMoveSpeed(sprite: Sprite, speed: number) {
        for (let i = 0; i < agents.length; i++) {
            if (agents[i] && agents[i].sprite === sprite) {
                agents[i].setMoveSpeed(speed);
                return;
            }
        }
    }

    //% block="disable parkour AI on $sprite"
    //% group="AI Control"
    export function disableParkourAI(sprite: Sprite) {
        for (let i = agents.length - 1; i >= 0; i--) {
            if (agents[i] && agents[i].sprite === sprite) {
                agents[i].active = false;
                agents.removeAt(i);
                return;
            }
        }
    }
}
