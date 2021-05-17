import AssetManager from "../Managers/AssetManager";
import { PLAYER_GRAVITYDEFAULT as PLAYER_GRAVITY, PLAYER_POWERDEFAULT as PLAYER_POWER, PLAYER_WEIGHTDEFAULT as PLAYER_WEIGHT, STAGE_HEIGHT, STAGE_WIDTH } from "../Constants";
import { pointHit } from "../Toolkit";
import Platform from "../Objects/Platform";
import GameCharacter, { DIRECTION } from "./GameCharacter";
import { STATE } from "../Objects/GameObject";
 
export default class Player extends GameCharacter {

    //init private fields
    private _timeToJump:boolean;// bool to find out if player is on platform, used to set jumpPower
    private _jumpPower:number;// power which to propel off the ground with set before jump
    private _jumpWeight:number;// rate which movement speed decreases during jump
    private _fallingGravity:number;// rate which movement speed increases during fall  
    private _scrollHeight:boolean;// state at which player shouldn't climb but 'push' platforms down
    private _lifePoints:number;// points left before death
    private _iFrames:boolean; // state of invincibility;
    
    //bmp and life sprite
    private bmpTxtScore:createjs.BitmapText;
    private lifeSprite:createjs.Sprite;

    //init public fields
    public gainedPoints:number; // number that updates to a value of points gained the score system will add them and reset this value to 0


    //spacebar bool
    private _spacebarIsPressed:boolean;

    // Item Use Event
    private eventSpacebarUseItem:createjs.Event;// detects if the spacebar is being pressed

    constructor(stage:createjs.StageGL, assetManager:AssetManager) {

        super(stage, assetManager);
        
        // instance private fields
        this._timeToJump = false;
        this._jumpPower = PLAYER_POWER; 
        this._jumpWeight = PLAYER_WEIGHT;
        this._fallingGravity = PLAYER_GRAVITY;
        this._scrollHeight = false;
        this._spacebarIsPressed = false;
        this._lifePoints = 3;

        // inst public fields
        this.gainedPoints = 0;
        
        // instance protected fields
        this._direction = DIRECTION.DOWN;
        this.stage.mouseMoveOutside = true;
        this._movementSpeed = 1; // starts at one and almost always changes
        
        // instance Sprite, init animation [NEEDS ANIMATION \/\/\/\/\/]
        this._sprite = assetManager.getSprite("assets", "Astronaught/idle-Color", 0, 0);
        this._sprite.play();
        this.scaleMe(2);
        stage.addChild(this._sprite);

        //#region could be moved to a hud class

        //inst life point sprite
        this.lifeSprite = assetManager.getSprite("assets", "Astronaught/idle-nocolor", 20, 87);
        this.scaleMe(2);
        stage.addChild(this.lifeSprite);
        
        //inst bmp
        this.bmpTxtScore = new createjs.BitmapText("0", assetManager.getSpriteSheet("glyphs"));
        this.bmpTxtScore.letterSpacing = 2;
        this.bmpTxtScore.scaleX = .7;
        this.bmpTxtScore.scaleY = .7;
        this.bmpTxtScore.x = 40;
        this.bmpTxtScore.y = 65;
        stage.addChild(this.bmpTxtScore);
        //#endregion
        
        //event
        this.eventSpacebarUseItem = new createjs.Event("onUseItem", true, false);

        this.MouseMovementController();

        this.positionMe(STAGE_WIDTH/2, STAGE_HEIGHT/2+(STAGE_HEIGHT/2)/2); // sets 
    }
    
    //#region // ----- gets/sets
    get Jumping():boolean { return this._timeToJump; }//        [ used in various Platforms ]
    set Jumping(value:boolean) { this._timeToJump = value;}
    get power():number { return this._jumpPower; }
    set power(value:number) { this._jumpPower = value; }//      [___________________________]
    get weight():number { return this._jumpWeight; } //             [ used in various items ]
    set weight(value:number) { this._jumpWeight = value; }
    get gravity():number { return this._fallingGravity; }
    set gravity(value:number) { this._fallingGravity = value; }//   [_______________________]
    set scrollHeight(value:boolean) {this._scrollHeight = value;}
    set spacebarIsPressed(value:boolean) { this._spacebarIsPressed = value; }
    //#endregion ----- (all private fields are accessed, in different areas)

    // ----- private methods
    private MouseMovementController() {
        
        // add mouse controller to sprite // try pointer lock
        this.stage.on("pressmove", () => {
            this._sprite.x = this.stage.mouseX; 
        });
        //check mouse pos                                                               // debug
        // this.stage.on("stagemousemove", () => {
        //     console.log("stage X/Y : "+ this.stage.mouseX +" "+this.stage.mouseY );  // debug
        // });

    }
    private JumpOffPlatform() {
        //setup jump // only if on platform
        if (this._timeToJump){
            this._movementSpeed = this._jumpPower; // set speed to 'jump'power
            this._timeToJump = false;

            //refresh jump power
            if (this._jumpPower != PLAYER_POWER ) {
                this._jumpPower = PLAYER_POWER; 
            }
        }

        //JUMP // only accelerate up if not at scrollheight
        if (!this._scrollHeight) {
            this._sprite.y -= this._movementSpeed;
        }
        this._movementSpeed -= this._jumpWeight // decrease jump speed by character 'jump'weight to reach "maxheight"

        // reach the jump height
        if (this._movementSpeed <= 0){ // 0 detects the "maxheight"
            this._direction = DIRECTION.DOWN;
            //console.log();
        }
    }
    private Fall() {
        this._sprite.y += this._movementSpeed;
        this._movementSpeed += this._fallingGravity // increase fall speed by 'falling'Gravity
        this._scrollHeight = false;
    }
    private detectEdges() {
        if (this._sprite.x <= this._sprite.getBounds().width) {
            this._sprite.x = this._sprite.getBounds().width;
        }
        else if (this._sprite.x >= (STAGE_WIDTH - this._sprite.getBounds().width)) {
            this._sprite.x = (STAGE_WIDTH - this._sprite.getBounds().width);
        }
    }
    private StartIFrames() {
        this._iFrames = true;
        createjs.Tween.get(this._sprite).to({alpha:.3}, 200).call( () => {
            createjs.Tween.get(this._sprite).to({alpha:1}, 900).call( () => {
                createjs.Tween.get(this._sprite).to({alpha:.3}, 400).call( () => {
                    createjs.Tween.get(this._sprite).to({alpha:1}, 600).call( () => {
                        this._iFrames = false;
                    });
                });
            });
        });
    }
    // private CallGameOver(gamestate:GAMESTATE) {
    //     if (this._lifePoints = 0) {

    //     }
    // }

    // ----- public methods
    public PlatformHit(platform:Platform) {
        if ( //  to edit; remove player.update from game loop & add ", this.stage" to the end of every parameter of point hit
        pointHit(this._sprite, platform.sprite, -6, 14)||
        pointHit(this._sprite, platform.sprite, 6, 14 )||
        pointHit(this._sprite, platform.sprite, 0, 9  )||
        pointHit(this._sprite, platform.sprite, 0, 14 )){
            
            let eventPlatform = platform; // checking to be passed
            
            // if this is the first time hitting the platform add points // could be its own method?
            if (!platform.landOnce) {
                //console.debug("landOnce");
                //score.Add(1);
                this.gainedPoints = platform.scoreValue;
                platform.landOnce = true;
             
            }
            platform.UseAbility(this);

            platform.sprite.dispatchEvent(platform.eventPlayerOnPlatform);
        }
    }
    public GainLife(value:number) { // used in 1up type items
        if (value < 0) { // check for negative
            value * -1;//change to +
        }
        this._lifePoints += value;
    }
    public LoseLifeGainIFrames(livesLost:number) {
        
        if (!this._iFrames) { // only lose lives if iframes arent active
            if (livesLost < 0) { // check for negative
                livesLost * -1;//change to +
            }
            this._lifePoints -= livesLost; // remove value from life
            this.StartIFrames();
        }
    }

    public Update() {
        if (this._state == STATE.GONE) {return;}

        if (this._spacebarIsPressed) {
            this.stage.dispatchEvent(this.eventSpacebarUseItem);
            this._spacebarIsPressed = false;
        }

        this.detectEdges();

        // jumping
        if (this._direction == DIRECTION.UP){
            this.JumpOffPlatform();
        }

        // falling ----- // player is expected to start on a type of platform
        if (this._direction == DIRECTION.DOWN){
            this.Fall();
        }

        //update life count
        if (this._lifePoints > 0) { // only show 0 and above
            this.bmpTxtScore.text = this._lifePoints.toString();
        }
    }
}