/// <reference path="../base/utils.ts" />
/// <reference path="../base/geom.ts" />
/// <reference path="../base/entity.ts" />
/// <reference path="../base/text.ts" />
/// <reference path="../base/scene.ts" />
/// <reference path="../base/app.ts" />

///  game.ts
///


//  Initialize the resources.
let FONT: Font;
let SPRITES:ImageSpriteSheet;
addInitHook(() => {
    FONT = new Font(IMAGES['font'], 'white');
    SPRITES = new ImageSpriteSheet(
	IMAGES['sprites'], new Vec2(16,16), new Vec2(8,8));
});


//  Bullet
//
class Bullet extends Projectile {
    constructor(pos: Vec2, bounds: Rect) {
	super(pos);
	this.sprite.imgsrc = new RectImageSource('white', bounds)
	this.collider = bounds;
    }
}


//  Player
//
class Player extends Entity {

    scene: Game;
    usermove: Vec2;

    constructor(scene: Game, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.sprite.imgsrc = SPRITES.get(0);
	this.collider = this.sprite.getBounds(new Vec2());
	this.usermove = new Vec2();
    }

    update() {
	super.update();
	this.moveIfPossible(this.usermove);
    }

    fire() {
	var bullet = new Bullet(this.pos, new Rect(-1, -4, 2, 8));
	bullet.movement = new Vec2(0, -8);
	bullet.frame = this.scene.screen;
	this.scene.add(bullet);
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(4);
    }
    
    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	return [this.scene.screen];
    }

    collidedWith(entity: Entity) {
    }
}


//  Game
//
const TONE_LEN = 500/3;
class Game extends GameScene {

    player: Player;
    stars: StarImageSource;
    scoreBox: TextBox;
    score: number;
    firing: boolean;

    curTime: number;
    baseTime: number;
    toneTime: number;
    
    curBase: HTMLAudioElement;
    curBaseDuration: number;
    curTone: HTMLAudioElement;
    curToneIndex: number;
    
    init() {
	super.init();
	this.scoreBox = new TextBox(this.screen.inflate(-8,-8), FONT);
	this.player = new Player(this, this.screen.center());
	this.add(this.player);
	this.stars = new StarImageSource(this.screen, 100);
	this.layer.addSprite(new FixedSprite(new Vec2(), this.stars));
	this.score = 0;
	this.updateScore();

	this.curBaseDuration = TONE_LEN*16;
	this.curBase = SOUNDS['base1'];
	this.curTone = SOUNDS['tone1'];
	this.curToneIndex = 0;
	
	this.curTime = 0;
	this.baseTime = -999999;
	this.toneTime = -999999;
    }

    onButtonPressed(keysym: KeySym) {
	this.firing = true;
    }
    onButtonReleased(keysym: KeySym) {
	this.firing = false;
    }
    onDirChanged(v: Vec2) {
	this.player.setMove(v);
    }

    update() {
	super.update();
	this.stars.move(new Vec2(0, 2));
	let t = Date.now();
	if (this.curTime == 0) {
	    this.curTime = t;
	}
	let dt = t - this.curTime;
	if (this.curBase !== null) {
	    if (this.baseTime + this.curBaseDuration <= dt) {
		this.baseTime = Math.floor(dt/this.curBaseDuration) * this.curBaseDuration;
		this.curBase.pause();
		this.curBase.currentTime = MP3_GAP;
		this.curBase.play();
	    }
	    if (this.curTone !== null) {
		if (this.toneTime + TONE_LEN <= dt) {
		    this.toneTime = Math.floor(dt/TONE_LEN) * TONE_LEN;
		    this.curTone.pause();
		    if (this.firing) {
			let r = this.player.pos.x/this.screen.width;
			let i = ((Math.random() < r)? rnd(10) :
				 clamp(0, this.curToneIndex+rnd(3)-1, 9));
			this.curTone.currentTime = (TONE_LEN*4*i)/1000 + MP3_GAP;
			this.curTone.play();
			this.curToneIndex = i;
			this.player.fire();
		    }
		}
	    }
	}
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	super.render(ctx, bx, by);
	this.scoreBox.render(ctx);
    }

    updateScore() {
	this.scoreBox.clear();
	this.scoreBox.putText(['SCORE: '+this.score]);
    }
}
