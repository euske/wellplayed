/// <reference path="../base/utils.ts" />
/// <reference path="../base/geom.ts" />
/// <reference path="../base/entity.ts" />
/// <reference path="../base/text.ts" />
/// <reference path="../base/scene.ts" />
/// <reference path="../base/app.ts" />

///  game.ts
///
const TICK_LEN = 500/3;


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
	let bullet = new Bullet(this.pos, new Rect(-1, -4, 2, 8));
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
	if (entity instanceof Changer) {
	    this.scene.changeBase(entity.pattern);
	    entity.stop();
	}
    }
}


//  Changer
//
class Changer extends Projectile {

    pattern: number;
    
    constructor(frame: Rect, pattern: number) {
	let pos: Vec2;
	let movement: Vec2;
	switch (rnd(4)) {
	case 0:
	    pos = new Vec2(frame.x+rnd(frame.width), frame.y);
	    movement = new Vec2(0, 1);
	    break;
	case 1:
	    pos = new Vec2(frame.x, frame.y+rnd(frame.height));
	    movement = new Vec2(1, 0);
	    break;
	case 2:
	    pos = new Vec2(frame.x+rnd(frame.width), frame.bottom());
	    movement = new Vec2(0, -1);
	    break;
	case 3:
	    pos = new Vec2(frame.right(), frame.y+rnd(frame.height));
	    movement = new Vec2(-1, 0);
	    break;
	}
	super(pos);
	this.frame = frame;
	this.movement = movement.scale(1+rnd(2));
	this.pattern = pattern;
	this.sprite.imgsrc = SPRITES.get(pattern, 1);
	this.collider = this.sprite.getBounds(new Vec2());
    }
}


//  Player2
//
class Player2 {

    curTime: number;
    baseTime: number;
    toneTime: number;
    
    baseDuration: number;
    curBase: HTMLAudioElement;
    nextBase: HTMLAudioElement;
    
    toneDuration: number;
    curTone: HTMLAudioElement;
    nextTone: HTMLAudioElement;
    playing: number;

    baseChanged: Signal;
    toneChanged: Signal;

    constructor() {
	this.baseDuration = TICK_LEN*32;
	this.toneDuration = TICK_LEN*4;
	this.curBase = this.nextBase = SOUNDS['base0'];
	this.curTone = this.nextTone = null;
	this.baseChanged = new Signal(this);
	this.toneChanged = new Signal(this);
	this.reset();
    }

    reset() {
	this.curTime = 0;
	this.baseTime = -999999;
	this.toneTime = -999999;
    }
    
    suspend() {
	if (this.curBase !== null) {
	    this.curBase.pause();
	}
	if (this.curTone !== null) {
	    this.curTone.pause();
	}
    }

    resume() {
	this.reset();
	if (this.curBase !== null) {
	    this.curBase.play();
	}
    }

    setTune(baseSound: HTMLAudioElement, toneSound: HTMLAudioElement) {
	this.nextBase = baseSound;
	this.nextTone = toneSound;
    }
    
    update() {
	let t = Date.now();
	if (this.curTime == 0) {
	    this.curTime = t;
	}
	let dt = t - this.curTime;
	let baseChanged = false;
	if (this.baseTime + this.baseDuration <= dt) {
	    this.baseTime = Math.floor(dt/this.baseDuration) * this.baseDuration;
	    if (this.curBase !== null) {
		this.curBase.pause();
	    }
	    this.curBase = this.nextBase;
	    if (this.curBase !== null) {
		this.curBase.currentTime = MP3_GAP;
		this.curBase.play();
		this.baseChanged.fire();
	    }
	    baseChanged = true;
	}
	if (this.toneTime + TICK_LEN <= dt) {
	    this.toneTime = Math.floor(dt/TICK_LEN) * TICK_LEN;
	    if (this.curTone !== null) {
		this.curTone.pause();
	    }
	    if (this.nextTone !== null && baseChanged) {
		this.curTone = this.nextTone;
		this.nextTone = null;
	    }
	    if (this.curTone !== null && 0 <= this.playing) {
		this.curTone.currentTime = (this.toneDuration*this.playing)/1000 + MP3_GAP;
		this.curTone.play();
		this.toneChanged.fire(this.playing);
		this.playing = -1;
	    }
	}
    }
}


//  Game
//
class Game extends GameScene {

    player: Player;
    player2: Player2;
    stars: StarImageSource;
    scoreBox: TextBox;
    score: number;
    firing: boolean;
    
    changeProb: number;
    toneIndex: number;

    init() {
	super.init();
	this.scoreBox = new TextBox(this.screen.inflate(-8,-8), FONT);
	this.player = new Player(this, this.screen.center());
	this.add(this.player);
	this.stars = new StarImageSource(this.screen, 100);
	this.layer.addSprite(new FixedSprite(new Vec2(), this.stars));
	this.score = 0;
	this.updateScore();

	this.player2 = new Player2();
	this.player2.toneChanged.subscribe(
	    (index: number) => { this.toneIndex = index; }
	);
	this.changeProb = 0;
	this.toneIndex = 0;
    }
    
    onBlur() {
	this.player2.suspend();
    }
    onFocus() {
	this.player2.resume();
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
	this.player2.update();

	this.changeProb += Math.random()*.05;
	if (1.0 <= this.changeProb) {
	    this.changeProb -= 1.0;
	    this.add(new Changer(this.screen, 1+rnd(3)));
	}
	if (this.firing) {
	    let r = this.player.pos.x/this.screen.width;
	    this.player2.playing =
		((Math.random() < r)? rnd(10) : clamp(0, this.toneIndex+rnd(3)-1, 9));
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

    changeBase(pattern: number) {
	switch (pattern) {
	case 1:
	    this.player2.setTune(SOUNDS['base1'], SOUNDS['tone1']);
	    break;
	case 2:
	    this.player2.setTune(SOUNDS['base2'], SOUNDS['tone2']);
	    break;
	case 3:
	    this.player2.setTune(SOUNDS['base3'], SOUNDS['tone3']);
	    break;
	case 4:
	    this.player2.setTune(SOUNDS['base4'], SOUNDS['tone4']);
	    break;
	}
    }
}
