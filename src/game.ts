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


function triangle(cycle: number, t: number)
{
    t = fmod(t, cycle);
    if (t < cycle*0.25) {
	return t;
    } else if (t < cycle*0.75) {
	return cycle*0.50-t;
    } else {
	return t-cycle;
    }
}


//  Bullet
//
class Bullet extends Projectile {
    constructor(pos: Vec2, bounds: Rect) {
	super(pos);
	this.sprite.imgsrc = new RectImageSource('white', bounds)
	this.collider = bounds;
    }
}


//  Explosion
//
class Explosion extends Entity {
    constructor(pos: Vec2) {
	super(pos);
	this.sprite.imgsrc = SPRITES.get(0, 1);
	this.lifetime = 0.2;
    }
}


//  Spawner
//
class Spawner extends Task {

    scene: Game;
    nspawns: number;
    interval: number;
    counter: number = 0;
    t: number = 0;
    
    constructor(scene: Game, nspawns: number, interval: number) {
	super();
	this.scene = scene;
	this.nspawns = nspawns;
	this.interval = interval;
    }

    update() {
	if (this.t % this.interval == 0) {
	    this.spawn(this.counter++);
	    if (this.nspawns <= this.counter) {
		this.stop();
	    }
	}
	this.t++;
    }

    spawn(i: number) {
    }
}


//  Enemy
//
class Enemy extends Entity {

    spawner: Spawner;
    frame: Rect;
    movement: Vec2;

    constructor(spawner: Spawner, pos: Vec2, frame: Rect, movement: Vec2) {
	super(pos);
	this.spawner = spawner;
	this.frame = frame;
	this.movement = movement.copy();
    }
    
    inFrame() {
	return this.getCollider().overlaps(this.frame);
    }

    update() {
	super.update();
	this.movePos(this.movement);
	if (!this.inFrame()) {
	    this.stop();
	}
    }
    
    collidedWith(entity: Entity) {
	if (entity instanceof Bullet) {
	    this.stop();
	    this.chain(new Explosion(this.pos));
	    this.spawner.scene.setKey(this);
	}
    }
}


//  Type 1
//
class Spawner1 extends Spawner {

    movement: Vec2;
    
    constructor(scene: Game) {
	super(scene, 9, 4);
	this.movement = new Vec2(0, rnd(2)? +4 : -4);
    }
    
    spawn(i: number) {
	let frame = this.scene.screen;
	let pos = new Vec2(i*32+16, (0 < this.movement.y)? frame.y : frame.bottom());
	this.scene.add(new Enemy1(this, pos, frame, this.movement));
    }
}

class Enemy1 extends Enemy {
    
    turny: number;
    
    constructor(spawner: Spawner, pos: Vec2, frame: Rect, movement: Vec2) {
	super(spawner, pos, frame, movement);
	this.sprite.imgsrc = SPRITES.get(1, 0);
	this.collider = this.sprite.getBounds(new Vec2());
	this.turny = rnd(frame.y+32, frame.bottom()-32);
    }

    update() {
	super.update();
	if (0 < this.turny) {
	    if ((0 < this.movement.y && this.turny < this.pos.y) ||
		(this.movement.y < 0 && this.pos.y < this.turny)) {
		this.movement.y = -this.movement.y;
		this.turny = 0;
	    }
	}
    }
}


//  Type 2
//
class Spawner2 extends Spawner {

    pos: Vec2;
    movement: Vec2;
    
    constructor(scene: Game) {
	super(scene, rnd(5, 15), 10);
	let frame = this.scene.screen;
	this.movement = new Vec2(rnd(2)? +2 : -2, rnd(2)? +3 : -3);
	this.pos = new Vec2(
	    (0 < this.movement.x)? frame.x : frame.right(),
	    rnd(frame.y+32, frame.bottom()-32));
    }
    
    spawn(i: number) {
	let frame = this.scene.screen;
	frame = new Rect(frame.x, frame.y+32, frame.width, frame.height-64);
	this.scene.add(new Enemy2(this, this.pos, frame, this.movement));
    }
}

class Enemy2 extends Enemy {
    
    movement: Vec2;
    
    constructor(spawner: Spawner, pos: Vec2, frame: Rect, movement: Vec2) {
	super(spawner, pos, frame, movement);
	this.sprite.imgsrc = SPRITES.get(2, 0);
	this.sprite.scale.x = -sign(movement.x);
	this.collider = this.sprite.getBounds(new Vec2());
    }
    
    update() {
	super.update();
	if ((this.movement.y < 0 && this.pos.y < this.frame.y) ||
	    (0 < this.movement.y && this.frame.bottom() < this.pos.y)){
	    this.movement.y = -this.movement.y;
	}
    }
}


//  Type 3
//
class Spawner3 extends Spawner {

    movement: Vec2;
    
    constructor(scene: Game) {
	super(scene, rnd(1,10), 5+rnd(10));
	this.movement = new Vec2(rnd(2)? +4 : -4, +4);
    }
    
    spawn(i: number) {
	let frame = this.scene.screen;
	let n = rnd(frame.width+frame.height);
	let pos: Vec2;
	if (0 < this.movement.x) {
	    pos = (n < frame.width)?
		new Vec2(n/2, 0) :
		new Vec2(0, (n-frame.width)/2);
	} else {
	    pos = (n < frame.width)?
		new Vec2(frame.width-n/2, 0) :
		new Vec2(frame.width, (n-frame.width)/2);
	}
	this.scene.add(new Enemy3(this, pos, frame, this.movement));
    }
}

class Enemy3 extends Enemy {
    
    constructor(spawner: Spawner, pos: Vec2, frame: Rect, movement: Vec2) {
	super(spawner, pos, frame, movement);
	this.sprite.imgsrc = SPRITES.get(3, 0);
	this.collider = this.sprite.getBounds(new Vec2());
    }
}


//  Type 4
// 
class Spawner4 extends Spawner {

    movement: Vec2;
    
    constructor(scene: Game) {
	super(scene, 5, 20);
	this.movement = new Vec2(rnd(2)? +4 : -4, 0);
    }
    
    spawn(i: number) {
	let frame = this.scene.screen;
	let pos = new Vec2(
	    (0 < this.movement.x)? frame.x : frame.right(),
	    rnd(frame.y+32, frame.bottom()-32));
	this.scene.add(new Enemy4(this, pos, frame, this.movement));
    }
}

class Enemy4 extends Enemy {
    
    constructor(spawner: Spawner, pos: Vec2, frame: Rect, movement: Vec2) {
	super(spawner, pos, frame, movement);
	this.sprite.imgsrc = SPRITES.get(4, 0);
	this.collider = this.sprite.getBounds(new Vec2());
    }
    
    update() {
	super.update();
	let cx = this.frame.centerx();
	if ((this.movement.x < 0 && this.pos.x < cx-32) ||
	    (0 < this.movement.x && cx+32 < this.pos.x)) {
	    this.movement.x = -this.movement.x;
	}
    }
}


//  Player
//
class Player extends Entity {

    scene: Game;
    usermove: Vec2 = new Vec2();
    firing: boolean = false;
    nextfire: number = 0;

    constructor(scene: Game, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.sprite.imgsrc = SPRITES.get(0, 0);
	this.collider = this.sprite.getBounds(new Vec2());
    }

    update() {
	super.update();
	this.moveIfPossible(this.usermove);
	if (this.firing) {
	    if (this.nextfire == 0) {
		switch (this.scene.basePattern) {
		case 1:
		    this.fire(new Vec2(0,-1));
		    break;
		case 2:
		    this.fire(new Vec2(0,-1));
		    this.fire(new Vec2(0,+1));
		    break;
		case 3:
		    this.fire(new Vec2(-1,0));
		    this.fire(new Vec2(+1,0));
		    break;
		case 4:
		    this.fire(new Vec2(-1,0));
		    this.fire(new Vec2(+1,0));
		    this.fire(new Vec2(0,-1));
		    this.fire(new Vec2(0,+1));
		    break;
		}
		this.nextfire = 4;
	    }
	    this.nextfire--;
	}
    }

    fire(v: Vec2) {
	let rect = (v.x == 0) ? new Rect(-1, -4, 2, 8) : new Rect(-4, -1, 8, 2);
	let bullet = new Bullet(this.pos, rect);
	bullet.movement = v.scale(8);
	bullet.frame = this.scene.screen;
	this.scene.add(bullet);
    }

    setFire(firing: boolean) {
	this.firing = firing;
	this.nextfire = 0;
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(4);
    }
    
    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	return [this.scene.screen];
    }

    collidedWith(entity: Entity) {
	if (entity instanceof Changer) {
	    this.scene.setPattern(entity.pattern);
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
interface KeyFunc {
    (c: number): number;
}
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
    
    keyCount: number = 0;
    keyFunc: KeyFunc = null;

    curPattern: number;
    nextPattern: number;
    patternChanged: Signal;
    keyChanged: Signal;

    constructor() {
	this.baseDuration = TICK_LEN*32;
	this.toneDuration = TICK_LEN*4;
	this.curPattern = this.nextPattern = 0;
	this.curBase = this.nextBase = SOUNDS['base0'];
	this.curTone = this.nextTone = null;
	this.patternChanged = new Signal(this);
	this.keyChanged = new Signal(this);
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

    setNextPattern(pattern: number) {
	switch (pattern) {
	case 1:
	    this.nextBase = SOUNDS['base1'];
	    this.nextTone = SOUNDS['tone1'];
	    break;
	case 2:
	    this.nextBase = SOUNDS['base2'];
	    this.nextTone = SOUNDS['tone2'];
	    break;
	case 3:
	    this.nextBase = SOUNDS['base3'];
	    this.nextTone = SOUNDS['tone3'];
	    break;
	case 4:
	    this.nextBase = SOUNDS['base4'];
	    this.nextTone = SOUNDS['tone4'];
	    break;
	}
	this.nextPattern = pattern;
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
	    if (this.nextBase !== null) {
		this.curBase = this.nextBase;
		this.curPattern = this.nextPattern;
		this.nextBase = null;
		this.patternChanged.fire(this.curPattern);
	    }
	    if (this.curBase !== null) {
		this.curBase.currentTime = MP3_GAP;
		this.curBase.play();
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
		this.keyCount = 0;
	    }
	    if (this.keyFunc !== null) {
		let key = this.keyFunc(this.keyCount++);
		this.keyFunc = null;
		if (this.curTone !== null && 0 <= key) {
		    this.curTone.currentTime = (this.toneDuration*key)/1000 + MP3_GAP;
		    this.curTone.play();
		    this.keyChanged.fire(key);
		}
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

    changeProb: number;
    spawnerProb: number;

    basePattern: number;
    nextPattern: number;
    bkgndColor: string;
    bkgndTimer: number;

    onBlur() {
	this.player2.suspend();
    }
    onFocus() {
	this.player2.resume();
    }

    onButtonPressed(keysym: KeySym) {
	this.player.setFire(true);
    }
    onButtonReleased(keysym: KeySym) {
	this.player.setFire(false);
    }
    onDirChanged(v: Vec2) {
	this.player.setMove(v);
    }

    init() {
	super.init();
	this.scoreBox = new TextBox(this.screen.inflate(-8,-8), FONT);
	this.player = new Player(this, this.screen.center());
	this.add(this.player);
	this.player2 = new Player2();
	this.stars = new StarImageSource(this.screen, 100);
	this.layer.addSprite(new FixedSprite(new Vec2(), this.stars));
	this.score = 0;
	this.updateScore();

	this.changeProb = 1.0;
	this.spawnerProb = 0;
	this.basePattern = 0;
	this.nextPattern = 1;
	this.bkgndColor = 'rgb(0,0,0)';
	this.bkgndTimer = 0;
    }
    
    update() {
	super.update();
	this.stars.move(new Vec2(0, 2));
	this.player2.update();

	this.changeProb += Math.random()*.01;
	if (1.0 <= this.changeProb) {
	    this.changeProb -= 1.0;
	    this.add(new Changer(this.screen, this.nextPattern));
	    this.nextPattern = 1+rnd(4);
	}

	if (this.basePattern != 0) {
	    this.spawnerProb += Math.random()*.05;
	    if (1.0 <= this.spawnerProb) {
		this.spawnerProb -= 1.0;
		switch (rnd(4)) {
		case 0:
		    this.add(new Spawner1(this));
		    break;
		case 1:
		    this.add(new Spawner2(this));
		    break;
		case 2:
		    this.add(new Spawner3(this));
		    break;
		case 3:
		    this.add(new Spawner4(this));
		    break;
		}
	    }
	}
	
	if (0 < this.bkgndTimer) {
	    this.bkgndTimer--;
	    if (this.bkgndTimer == 0) {
		this.bkgndColor = 'rgb(0,0,0)';
	    }
	}
	// if (false) {
	//     let r = this.player.pos.x/this.screen.width;
	//     this.player2.playing =
	// 	((Math.random() < r)? rnd(10) : clamp(0, this.keyIndex+rnd(3)-1, 9));
	// }
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = this.bkgndColor;
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	super.render(ctx, bx, by);
	this.scoreBox.render(ctx);
    }

    updateScore() {
	this.scoreBox.clear();
	this.scoreBox.putText(['SCORE: '+this.score]);
    }
    
    setPattern(pattern: number) {
	this.player2.setNextPattern(pattern);
	this.basePattern = pattern;
	switch (pattern) {
	case 1:
	    this.bkgndColor = 'rgb(128,0,0)';
	    break;
	case 2:
	    this.bkgndColor = 'rgb(89,0,128)';
	    break;
	case 3:
	    this.bkgndColor = 'rgb(0,128,72)';
	    break;
	case 4:
	    this.bkgndColor = 'rgb(128,108,0)';
	    break;
	}
	this.bkgndTimer = 10;
    }

    setKey(enemy: Enemy) {
	this.player2.keyFunc = (() => { return rnd(10); });
	this.score++;
	this.updateScore();
    }
}
