var b2Vec2 = Box2D.Common.Math.b2Vec2
,   b2AABB = Box2D.Collision.b2AABB
,	b2BodyDef = Box2D.Dynamics.b2BodyDef
,	b2Body = Box2D.Dynamics.b2Body
,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
,	b2Fixture = Box2D.Dynamics.b2Fixture
,	b2World = Box2D.Dynamics.b2World
,	b2MassData = Box2D.Collision.Shapes.b2MassData
,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
,   b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
,	b2Math = Box2D.Common.Math.b2Math
;

var DEBUG = false;
var FPS = 30;
var PPM = 150;
var DEFAULT_FIRST_OBJECTIVE = 0;

var manager = (function(){
	"use strict";
    var Objective = function(title, targetVelocity, encodeActions, article) {
        this.title = title;
        this.article = article;
        this.targetVelocity = targetVelocity;
        this.encodeActions = encodeActions;
        this.isInitiated = false;
        this.canComplete = function(measuredVelocity) {
            return this.targetVelocity - Math.abs(measuredVelocity) <= 0; 
        }
    }

    var objectives = [
        new Objective("baby step", 0.2, function(root) {
            root.clear();
            root.add(1, "FWD_STEP1");
            root.add(4, "STAND")
                .add(4, "LAND");
        }),
        new Objective("little steps", 0.40, function(root) {
            root.clear();
            root.add(1, "FWD_STEP1").add(2, "FWD_STEP2");
            root.add(4, "STAND")
                .add(4, "LAND");
        }),
        new Objective("all three legs", 0.80, function(root) {
            root.clear();
            root.add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3", {expiration:30, recovery:0});
            root.add(4, "STAND")
                .add(4, "LAND");
        }),
        new Objective("boing!", 1.0, function(root) {
            root.clear();
            root.add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3");
            root.seek([1,2,3])
                .add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3")
                .add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FORWARD", {expiration:30, recovery:15});
            root.add(4, "STAND")
                .add(4, "LAND");
        }),
        new Objective("reverse", 1.3, function(root) {
            root.clear();
            root.add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3");
            root.seek([1,2,3])
                .add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3")
                .add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FORWARD", {expiration:30, recovery:15});
            root.add(3, "BWD_STEP1")
                .add(2, "BWD_STEP2")
                .add(1, "BWD_STEP3");
            root.add(4, "STAND")
                .add(4, "LAND");
            root.seek([4])
                .add(3, "USE")
                .loop( root.seek([4]));
        }),
        new Objective("haz a cape", 1.3, function(root) {
            root.clear();
            root.add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3");
            root.seek([1,2,3])
                .add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3")
                .add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FORWARD", {expiration:30, recovery:5})
                .add(3, "FLIGHT", {expiration:25, recovery:5});
            root.add(3, "BWD_STEP1")
                .add(2, "BWD_STEP2")
                .add(1, "BWD_STEP3");
            root.add(4, "STAND")
                .add(4, "LAND");
            root.seek([4])
                .add(3, "USE")
                .loop( root.seek([4]));
        },"cape"),
        new Objective("use", 1.3, function(root) {
            root.clear();
            root.add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3");
            root.seek([1,2,3])
                .add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FWD_STEP3")
                .add(1, "FWD_STEP1")
                .add(2, "FWD_STEP2")
                .add(3, "FORWARD")
                .add(3, "FLIGHT")
            root.add(3, "BWD_STEP1")
                .add(2, "BWD_STEP2")
                .add(1, "BWD_STEP3");
            root.add(4, "STAND")
                .add(4, "LAND");
            root.seek([4])
                .add(3, "USE")
                .loop( root.seek([4]));
        })
    ];

    var current = undefined;

    return {
        onInitiateObjective: undefined,
        onCompleteObjective: undefined,
        onRestartObjective: undefined,
        advance: function() {
            if( !current ) {
                return;
            }
            if( !current.isInitiated ) {
                this.onInitiateObjective(current);
                current.isInitiated = true;
                return;
            }
            if( this.induceComplete || current.canComplete( this.ball.getLinearVelocity().x ) ) {
                this.onCompleteObjective(current);
                return;
            }
            if( this.induceRestart ) {
                this.onConcludeObjective(current);
                this.setObjective(current);
                return;
            }
        },
        setPlayer: function(player) {
            this.player = player;
        },
        setBall: function(ball) {
            this.ball = ball;
        },
        restartObjective: function() {
            this.induceRestart = true;
        },
        completeObjective: function() {
            this.induceComplete = true;
        },
        firstObjective: function() {
            this.setObjective( objectives[DEFAULT_FIRST_OBJECTIVE] );
        },
        nextObjective: function( objective ) {
            var next = objectives[ objectives.indexOf(objective)+1 ];
            next ? this.setObjective(next) : console.log("no more objectives");
        },
        setObjective: function(newObjective) {
            current = newObjective;
            current.isInitiated = false;
            this.induceRestart = false;
            this.induceComplete = false;
        }
        ,
        initialize: function() {
        }
    }
}());


var hud = (function() {
	"use strict";
    var Announcements = function(container) {
        var list = [];

        var Announcement = function(message, frames, whenDone) {
            var count = 0;
            var sprite = new createjs.Text(message,"bold 64px Arial", "#FFF");
            sprite.regX = sprite.getMeasuredWidth()/2;
            sprite.regY = sprite.getMeasuredHeight()/2;
            sprite.x = container.canvas.width/2;
            sprite.y = container.canvas.height/2 - sprite.getMeasuredHeight();
            
            return {
                whenDone: whenDone,
                frames: frames,
                show: function() {
                    container.addChild(sprite);
                    return this;
                },
                remove: function() {
                    if( this.whenDone ) {
                        this.whenDone();
                    }
                    container.removeChild(sprite);
                },
                advance: function() {
                    if( count == this.frames ) {
                        this.remove();
                        return false;
                    }
                    else {
                        sprite.alpha = ++count > this.frames - this.frames/4 ? sprite.alpha-0.025 : sprite.alpha;
                        return true;
                    }
                }
            }
        }

        return {
            add: function(message, seconds, whenDone) {
                var announcement = new Announcement(message, seconds*FPS, whenDone)
                list.push( announcement.show() );
            },
            update: function() {
                list = list.filter( function(announcement) {
                    return announcement.advance.apply(announcement);
                });
            }
        };

    };

    var normalize = function(value, range) {
        return Math.min( value/range, 1);
    }          

    var drawMeter = function(radius, stroke, width, level) {
        context.strokeStyle=stroke;
        context.lineWidth=width;
        context.beginPath();
        context.arc(100,100,radius,Math.PI-0.25,Math.PI-0.25+level*(Math.PI+0.5),false);
        context.stroke();
    };

    var drawNeedle = function(radius, stroke, width, level) {
        context.save();
        context.translate(100,100);
        context.rotate(Math.PI-0.25+level*(Math.PI+0.5));
        context.strokeStyle=stroke;
        context.lineWidth=width;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(radius, 0);
        context.stroke();
        context.restore();
    };

    var drawDebug = function(text) {
        debugText.text = text;
    }

    var gradient = undefined;
    var initializeGradients = function() {
        gradient = context.createLinearGradient(0,100,100,100);
        gradient.addColorStop(0.5, '#B7FA00');
        gradient.addColorStop(1, '#FA9600');
    }
    
    var debugText = undefined;
    var nextObjectiveText = undefined;
    var initializeDebugText = function() {
        debugText = new createjs.Text(0,"bold 16px Arial","#FFF");
        debugText.x = 10;
        debugText.y = 10;
        stage.addChild(debugText);

        stage.addChild(nextObjectiveText);
    }

    var menu = undefined;
    var toggleMenu = function() {
        if(!menu) {
            menu = new Container;
            menu.regX = stage.canvas.width/2;
            menu.regY = stage.canvas.height/2;
            menu.x = stage.canvas.width/2, menu.y = stage.canvas.height/2;

            var items = [
                {
                    title: "force complete",
                    action: function() { manager.completeObjective(); } 
                },
                {
                    title: "restart objective",
                    action: function() { manager.restartObjective(); } },
            ];

            items.forEach( function(item, index) {
                var text = new createjs.Text(item.title,"bold 16px Arial","#F00");
                text.regX = text.getMeasuredWidth()/2;
                text.regY = text.getMeasuredHeight()/2;
                text.x = stage.canvas.width/2;
                text.y = stage.canvas.height/2 + index*text.getMeasuredHeight();
                text.onClick = item.action;
                menu.addChild(text);
            });

            stage.addChild(menu);
        }
        else {
            stage.removeChild(menu);
            menu = undefined;
        }
    }

    var stage = undefined;
    var announcements = undefined;
    var context = undefined;
    return {
        maximumVelocity: 5.0,
        setTargetVelocity: function(velocity) {
            this.targetVelocity = Math.abs( velocity );
        },
        setPlayer: function(entity) {
            this.player = entity;
        },
        setBall: function(entity) {
            this.ball = entity;
        },
        announce: function(message, seconds, whenDone) {
            announcements.add(message, seconds, whenDone);
        },
        toggleMenu: function() {
            toggleMenu();
        },
        update: function() {
            var ballVelocity = Math.abs(this.ball.getLinearVelocity().x); 
            var normalizedBallVelocity = normalize( ballVelocity, this.maximumVelocity);
            var playerVelocity = Math.abs(this.player.getLinearVelocity().x); 
            var normalizedPlayerVelocity = normalize( playerVelocity, this.maximumVelocity);
            var normalizedTargetVelocity = normalize( this.targetVelocity, this.maximumVelocity);

            drawMeter( 40, "#555", 30, 1 );
            drawMeter( 30, gradient, 10, normalizedBallVelocity );
            drawMeter( 40,"#B7FA00", 10, normalizedPlayerVelocity );
            drawMeter( 50, "#FFF", 10, normalizedTargetVelocity );
            drawNeedle( 60, "#FFF", 3, normalizedBallVelocity );
            drawDebug("b:"+ballVelocity.toFixed(3)+"p:"+playerVelocity.toFixed(3));

            announcements.update();
            stage.update();
        },
        initialize : function(canvas) {
            stage = new Stage(canvas);
            stage.autoClear = false;
            announcements = new Announcements(stage);
            context = canvas.getContext("2d");
            initializeGradients();
            initializeDebugText();
        }
    };
}());

var physics = (function() {
	"use strict";
	var world = undefined;
	return {
		advance: function() {
			world.ClearForces();
			world.Step(1 / FPS, 10, 10);
		},
		initialize: function() {
			world = new b2World( new b2Vec2(0, 10),  true );
		},
        removeBody: function(body) {
            world.DestroyBody(body);
        },
		createPlayerFixture: function(x,y,width,height,mask) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.Set(x,y);
			var body = world.CreateBody(bodyDef);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 0.5;
			fixtureDef.restitution = 0.2;
            fixtureDef.filter.maskBits = mask;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( width/2/PPM, height/2/PPM );

			return body.CreateFixture(fixtureDef);
		},
		createBallFixture: function(x,y,radius,mask) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.Set(x,y);
			var body = world.CreateBody(bodyDef);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 10.0;
			fixtureDef.friction = 1.0;
			fixtureDef.restitution = 0.2;
            fixtureDef.filter.maskBits = mask;
			fixtureDef.shape = new b2CircleShape(radius/PPM);

			return body.CreateFixture(fixtureDef);
		},
		createMarkerFixture: function(x,y,width,height,mask) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.Set(x,y);
			var body = world.CreateBody(bodyDef);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 0.5;
			fixtureDef.restitution = 1.0;
            fixtureDef.filter.maskBits = mask;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( width/2, height/2 );

			return body.CreateFixture(fixtureDef);
		},
		createStaticBody: function(x,y,width,height,category) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_staticBody;
            bodyDef.position.Set(x/PPM,y/PPM);
			var body = world.CreateBody(bodyDef);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 0.5;
			fixtureDef.restitution = 0.2;
            fixtureDef.filter.categoryBits = category;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( width/2/PPM, height/2/PPM );

			body.CreateFixture(fixtureDef);
			return body;
		},
		setDebugDraw: function(canvas) {
            var context = canvas.getContext("2d");
			this.debugDraw = new b2DebugDraw();
			this.debugDraw.SetSprite(context);
			this.debugDraw.SetDrawScale(PPM);
			this.debugDraw.SetFillAlpha(0.5);
			this.debugDraw.SetLineThickness(1.0);
			this.debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
			world.SetDebugDraw(this.debugDraw);
		},
        drawDebug: function() {
            world.DrawDebugData();
        }
	}
	
}());

var audio = (function () {
	"use strict";
    var Oscillator = function(audioContext) {
        var context = audioContext;
        var envelope = context.createGainNode();
        envelope.connect( context.destination );
        var oscillator = context.createOscillator();
        oscillator.connect( envelope );

        return {
            play: function(frequency) {
                var now = context.currentTime;
                envelope.gain.linearRampToValueAtTime(0, now);
                envelope.gain.linearRampToValueAtTime(0.90, now+1/FPS);
                envelope.gain.linearRampToValueAtTime(0, now+2/FPS);
                oscillator.frequency.value = frequency;
                oscillator.noteOn(now);
                oscillator.noteOff(now+2/FPS);
            },
            isDead: function() {
                return oscillator.playbackState === oscillator.FINISHED_STATE;
            }
        }
    }

	var oscillators = [];
	var audioContext = undefined;
    var frequency = {};
    frequency[1]= 261.63; 
    frequency[2]= 329.63; 
    frequency[3]= 392.00; 
    frequency[4]= 400.00; 

	return {
		initialize: function() {
			try {
				audioContext = new (window.AudioContext || window.webkitAudioContext);
			} catch (e) {
				alert('To me there appears to be no AudioContext support in this browser, thus sound is sadly disabled.');
                this.addSound = function() {};
                this.soundOn = function() {};
                this.advance = function() {};
			}
		},
		soundOn: function (which) {
            var newOscillator = new Oscillator(audioContext);
            oscillators.push( newOscillator );
            newOscillator.play( frequency[which] );
		},
		advance: function () {
            oscillators.forEach( function(oscillator, index, array) {
                if( oscillator.isDead() ) {
                    array.splice(index,1);
                }
            });
		}
	}
}());

var menuInput = (function () {
	"use strict";

	function inputOn(id) {
        if (!isEnabled) {
            return;
        }

        switch(id) {
            case 1: actionDelegate("TOGGLE");
                    break;
        }
	}

	function inputOff(id) {
        // nothing here except a comment.
	}

    var isEnabled = false;
	var actionDelegate = undefined;
	return {
		initialize: function () {
            this.reset();
            isEnabled = false;
		},
        setActionDelegate: function (delegate) {
            actionDelegate = delegate;
        },
        enable: function() {
            isEnabled = true;
            this.reset();
        },
        disable: function() {
            isEnabled = false;
        },
        reset: function() {
        },
        inputOn: function(input) {
            inputOn(input);
        },
        inputOff: function(input) {
            inputOff(input);
        },
		advance: function () {
		}
	};
}());

var playInput = (function () {
	"use strict";

    var ActionNode = function(key, action, timing) {
        this.action = action;
        this.timing = timing ? timing : {expiration:15, recovery:0};
        this.looped = undefined;
        this.branch = {};
        this.clear = function() {
            this.looped = false;
            this.branch = {};
        }
        this.getTiming = function(into) {
            into.expiration = this.timing.expiration;
            into.recovery = this.timing.recovery;
            return into;
        }
        this.get = function( key ) {
            return this.branch[key];
        }
        this.add = function( key, action, timing ) {
            var newNode = new ActionNode(key, action, timing);
            this.branch[key] = newNode;
            return newNode;
        }
        this.loop = function( node ) {
            this.looped = node;
        }
        this.seek = function( sequence ) {
            var branch = this.branch[ sequence.shift() ];
            return branch ? branch.seek(sequence) : this;
        }
    }

    var rootAction = new ActionNode();
    var thisAction = rootAction;
    var actionTime = rootAction.getTiming({});

    function notifyThenNext() {
        thisAction.getTiming(actionTime);
        actionDelegate(thisAction.action);
        return thisAction.looped ? thisAction.looped : thisAction;
    }

	function inputOn(id) {
        if (!isEnabled) {
            return;
        }

        if (actionTime.recovery > 0) {
            return;
        }

        thisAction = thisAction.get(id);
        if (thisAction) {
            thisAction = notifyThenNext();
        }
        else {
            thisAction = rootAction.get(id);
            thisAction = thisAction ? notifyThenNext() : rootAction;
        }
	}

	function inputOff(id) {
        // nothing here except a comment.
	}

    var isEnabled = false;
	var actionDelegate = undefined;
	return {
		initialize: function () {
            this.reset();
            isEnabled = false;
		},
        getRootAction: function() {
            return rootAction;
        },
        setActionDelegate: function (delegate) {
            actionDelegate = delegate;
        },
        enable: function() {
            isEnabled = true;
            this.reset();
        },
        disable: function() {
            isEnabled = false;
        },
        reset: function() {
            thisAction = rootAction;
            thisAction.getTiming(actionTime);
        },
        inputOn: function(input) {
            inputOn(input);
        },
        inputOff: function(input) {
            inputOff(input);
        },
		advance: function () {
            if( actionTime.recovery > 0) {
                if( --actionTime.recovery === 0) {
                    actionDelegate("RECOVERED");
                }
            }
            else {
                if( actionTime.expiration > 0 ) {
                    if( --actionTime.expiration === 0) {
                        actionDelegate("EXPIRED");
                        thisAction = rootAction;
                        thisAction.getTiming(actionTime);
                    }
                }
            }
		}
	};
}());

var input = (function () {
	"use strict";

    var isInputOn = {};
	function inputOn(id, destination) {
		if (isInputOn[id] ) {
            return;
        }

        isInputOn[id] = true;
        destination.inputOn(id);
	}

	function inputOff(id, destination) {
        if( isInputOn[id] ) {
            destination.inputOff(id);
        }
        isInputOn[id] = false;
	}

    var menuKey = {27:1};
	var playKey = {76:1, 75:2, 74:3, 72:4};
	function onKeyDown(keyCode) {
        if(menuKey[keyCode]) {
            inputOn(menuKey[keyCode], menuInput);
            return false;
        }

		if(playKey[keyCode]) {
            inputOn(playKey[keyCode], playInput);
            return false;
        }

        console.log("unmapped key down:", keyCode);
	}

	function onKeyUp(keyCode) {
        if(menuKey[keyCode]) {
            inputOff(menuKey[keyCode], menuInput);
            return false;
        }

		if(playKey[keyCode]) {
            inputOff(playKey[keyCode], playInput);
            return false;
        }
	}

	function handleKeyDown(e) {
		if(!e){ var e = window.event; }
		return onKeyDown(e.keyCode);
    }

	function handleKeyUp(e) {
		if(!e){ var e = window.event; }
		return onKeyUp(e.keyCode);
	}
    
	return {
		initialize: function () {
            playInput.initialize();
            menuInput.initialize();
			document.onkeydown = handleKeyDown;
			document.onkeyup = handleKeyUp;
		},
		advance: function () {
            playInput.advance();
            menuInput.advance();
		}
	};
}());

var assets = (function() {
    var loadCount = 0;
    var spriteSheetDescriptions = [
        {
            name: "player",
            images: ["assets/chin.png"],
            frames: {count:9, width:150, height:150},
            animations: {
                stand:  {frames:[0], next:false, frequency:1},
                land:   {frames:[1], next:false, frequency:1},
                still:  {frames:[1], next:false, frequency:1 },
                step1:  {frames:[1,2,1], next:"still", frequency:3 },
                step2:  {frames:[3,4,3,2,1], next:"still", frequency:3 },
                step3:  {frames:[3,5,5,3,2], next:"still", frequency:1 },
                jump:   {frames:[4,5,5,5,3,2,1], next:false, frequency:2},
                fly:    {frames:[6,6,6,5,4], next:"still", frequency:2},
                use:    {frames:[7,8], next:"stand", frequency:5},
            }
        },
        {
            name: "cape",
            images: ["assets/cape.png"],
            frames: {count:9, width:150, height:150},
            animations: {
                stand:  {frames:[0], next:false, frequency:1},
                land:   {frames:[1], next:false, frequency:1},
                still:  {frames:[1], next:false, frequency:1 },
                step1:  {frames:[1,2,1], next:"still", frequency:3 },
                step2:  {frames:[3,4,3,2,1], next:"still", frequency:3 },
                step3:  {frames:[3,5,5,3,2], next:"still", frequency:1 },
                jump:   {frames:[4,5,5,5,3,2,1], next:false, frequency:2},
                fly:    {frames:[6,6,6,5,4], next:"still", frequency:2},
                use:    {frames:[7,8], next:"stand", frequency:5},
            }
        },
        {
            name: "building",
            images: ["assets/building.png"],
            frames: {count:4, width:110, height:380,regX:55,regY:190},
            animations: {
                a: {frames:[0], next:false, frequency:1},
                b: {frames:[1], next:false, frequency:1},
                c: {frames:[2], next:false, frequency:1},
                d: {frames:[3], next:false, frequency:1},
            }
        },
        {
            name: "ball",
            images: ["assets/ball.png"],
            frames: {count:2, width:50, height:50,regX:25,regY:25},
            animations: {
                ready: {frames:[0,1], next:"ready", frequency:2},
            }
        },
        {
            name: "background",
            images: ["assets/trees.png"],
            frames: {count:1, width:600, height:250,regX:600/2,regY:250/2},
            animations: {
                a: {frames:[0], next:false, frequency:1},
            }
         }
    ];

    return {
        onReady: undefined,
        animations: {},
        initialize: function() {
            spriteSheetDescriptions.forEach( function(description) {
                this.load(description);
            }, this);

        },
        load: function(description) {
            var spriteSheet  = new createjs.SpriteSheet(description);
            var processor = this.process.bind(this, description, spriteSheet);
            if (!spriteSheet.complete) {
                spriteSheet.onComplete = processor;
            }
            else {
                processor();
            }
        },
        process: function(description, spriteSheet) {
			var animation = new createjs.BitmapAnimation(spriteSheet);
            this.animations[description.name] = animation;
            loadCount += 1;
            if( loadCount == spriteSheetDescriptions.length ) {
                this.onReady();
            }
        },
        getAnimation: function(name) {
            return this.animations[name];
        }
    }
}());

var playspace = (function() {
	"use strict";

    var trails = (function (){
        var markers = [];

        return {
            container: undefined,
            setContainer: function(container) {
                this.container = container;
            },
            addMessage: function(body, message) {
                var origin = body.GetWorldCenter();
                var fixture = physics.createMarkerFixture( origin.x, origin.y, 0.5, 0.5, 0 );
                fixture.GetBody().ApplyImpulse( new b2Vec2(0.5,-0.5), origin );
                var sprite = new createjs.Text(message,"bold 32px Arial","#FFF");
                this.container.addChild(sprite);

                markers.push( {
                    body:fixture.GetBody(),
                    skin:sprite,
                    frames:30,
                    fixture:fixture
                });

            },
            advance: function() {
                // filter seems fairly inefficient here, garbage collection might
                // present a problem, reconsider implementation if time allows.
                markers = markers.filter( function(entity) {
                    if( entity.frames-- === 0 ) {
                        this.container.removeChild(entity.skin);
                        physics.removeBody( entity.body );
                        return false;
                    }
                    var center = entity.body.GetWorldCenter();
                    entity.skin.rotation = entity.body.GetAngle() * (180 / Math.PI);
                    entity.skin.x = center.x * PPM;
                    entity.skin.y = center.y * PPM;
                    entity.skin.alpha -= 0.05;
                    return true;
                }, this);
            }
        }
    }());

    var utility = (function (){
        return {
            generateFloorSprite: function( width, height, fill, depth ) {
                var blurFilter = new createjs.BoxBlurFilter(depth, depth, 1);
                var margins = blurFilter.getBounds();
                var g = new createjs.Graphics();
                g.setStrokeStyle(1);
                g.beginStroke(createjs.Graphics.getRGB(0,0,0));
                g.beginFill(fill);
                g.rect(0,0,width,height);
                var displayObject = new createjs.Shape(g);
                displayObject.regX = width/2;
                displayObject.regY = height/2;
                displayObject.filters = [blurFilter];
                displayObject.cache(margins.x,margins.y,width+margins.width,height+margins.height);
                return displayObject;
            }
        }
    }());

    return {
        layers: {},
        markers: [],
        playerArticles: [],
        container: new Container,
        initialize: function() {
            trails.setContainer(this.container);
            this.setScene();
        },
        setScene: function() {
            var floorBody = physics.createStaticBody(0,500,100000,10,255);
            var floorSkin = utility.generateFloorSprite(10000,10,Graphics.getRGB(255,255,255),10);
            this.addStaticBody( floorBody, floorSkin, 255 );

            for(var index=-3; index<6; index++) {
                var body = physics.createStaticBody(index*600,500-250/2,600,250,2);
                var skin = assets.getAnimation("background").clone();
                skin.gotoAndPlay( "a" );
                this.addStaticBody( body, skin, index+4 );
            }
        },
        addPlayer: function(entity) {
            this.player = entity;
            this.container.addChild(this.player.container);
        },
        addBall: function(entity) {
            this.ball = entity;
            this.container.addChild(this.ball.skin);
        },
        addTrail: function(body, message) {
            trails.addMessage(body, message);
        },
        addStaticBody: function(body,skin,layerNumber) {
            var layer = this.getLayer(layerNumber);
            var origin = body.GetWorldCenter();
            layer.push( {body:body,skin:skin, origin:{x:origin.x, y:origin.y}} );
            this.container.addChild(skin);
        },
        addItem: function(item,skin,layerNumber) {
            var layer = this.getLayer(layerNumber);
            var body = item.GetBody();
            var origin = body.GetWorldCenter();
            layer.push( {body:body, skin:skin, origin:{x:origin.x, y:origin.y}});
            this.container.addChildAt(skin,0);
        },
        getLayer: function(layer) {
            var result = this.layers[layer];
            if(result) {
                return result;
            }
            else {
                this.layers[layer] = [];
                return this.layers[layer];
            }
        },
        updatePlayer: function() {
            this.player.container.rotation = this.player.body.GetAngle() * (180 / Math.PI);
            this.player.container.x = this.player.body.GetWorldCenter().x * PPM;
            this.player.container.y = this.player.body.GetWorldCenter().y * PPM;
        },
        updateBall: function() {
            this.ball.skin.rotation = this.ball.body.GetAngle() * (180 / Math.PI);
            this.ball.skin.x = this.ball.body.GetWorldCenter().x * PPM;
            this.ball.skin.y = this.ball.body.GetWorldCenter().y * PPM;
        },
        advance: function() {
            this.updatePlayer();
            this.updateBall();
            _.each( this.layers, function(layer, key) {
                _.each( layer, function(piece) {
                    piece.skin.rotation = piece.body.GetAngle() * (180 / Math.PI);
                    piece.skin.x = piece.body.GetWorldCenter().x * PPM;
                    piece.skin.y = piece.body.GetWorldCenter().y * PPM;
                });
            }, this);
            trails.advance();
        },
        bindCamera: function(camera) {
            camera.onCamera = this.updateCamera.bind(this);
        },
        bindParallax: function(reference) {
            reference.onParallax = this.updateParallax.bind(this);
        },
        updateCamera: function(translation) {
            this.container.x = translation.x;
            this.container.y = translation.y;
        },
        updateParallax: function(amount) {
            _.each( this.layers, function(layer, key) {
                if(key==1) {
                    return;
                }
                _.each( layer, function(piece) {
                    var position = piece.body.GetWorldCenter();
                    position.x = piece.origin.x-amount/key;
                    piece.body.SetPosition(position);
                });
            }, this);
        }
    }
}());

var camera = (function() {
	"use strict";
    return {
        zoomFactorTarget: 1.0,
        onCamera: function(x,y) { console.log("override onCamera"); },
        onParallax: function(d) { console.log("override onParallax"); },
        requiredTranslation: {x:0, y:0},
		initialize: function( stage ) {
            this.stage = stage;
            this.target = {x:0, y:0};
            this.setZoom(0.01);
            this.updateRequiredTranslation();
        },
        setZoom: function(factor) {
            this.zoomFactor = factor;
            this.stage.scaleX = factor;
            this.stage.scaleY = factor;
            this.offset = {x:this.stage.canvas.width/2/factor, y:(this.stage.canvas.height/2+100)/factor};
            if(DEBUG) { physics.debugDraw.SetDrawScale(PPM*factor); }
        },
        updateRequiredTranslation: function() {
            this.requiredTranslation.x = this.offset.x - this.target.x*PPM;
            this.requiredTranslation.y = this.offset.y - this.target.y*PPM;
            this.onCamera(this.requiredTranslation);
            this.onParallax(this.requiredTranslation.x/PPM);
        },
        lookAt: function(point) {
            this.target.x = point.x;
            this.target.y = point.y;
            this.updateRequiredTranslation();
        },
        watch: function(entity) {
            this.entityOfInterest = entity;
        },
        advance: function() {
            if( this.zoomFactorTarget != this.zoomFactor ) {
                if( this.zoomFactorTarget > this.zoomFactor ) {
                    this.setZoom( Math.min(this.zoomFactor+0.01, this.zoomFactorTarget) );
                }
                else {
                    this.setZoom( Math.max(this.zoomFactor-0.01, this.zoomFactorTarget) );
                }
            }
            this.lookAt(this.entityOfInterest.body.GetWorldCenter());
        }
    }

}());

var ball = (function() {
	"use strict";
    return {
        skin: undefined,
        body: undefined,
		initialize: function() {
            this.fixture = physics.createBallFixture(-1.5,1,25,1);
            this.body = this.fixture.GetBody();
            this.skin = assets.getAnimation("ball");
            this.skin.gotoAndPlay("ready");
		},
        reset: function() {
            this.body.SetAngularVelocity(0);

            var position = this.body.GetWorldCenter();
            position.x = -1, position.y = 1;
            this.body.SetPositionAndAngle(position,0);

            var velocity = this.body.GetLinearVelocity();
            velocity.x = 0, velocity.y = 0;
            this.body.SetLinearVelocity(velocity);
            this.body.SetAwake(true);

            this.skin.gotoAndPlay("ready");
        },
        getLinearVelocity: function() {
            return this.body.GetLinearVelocity();
        },
        advance: function() {
        }
    }
    
}());

var player = (function() {
	"use strict";
	return {
        articles: [],
        container: undefined,
		skin: undefined,
        body: undefined,
        maximumRotation: Math.PI*2/360*15,
        impulse: function(direction, rate, max) {
            var velocity = this.body.GetLinearVelocity().x;
            var targetVelocity = direction < 0 ?
                b2Math.Max( velocity - rate, -max ) : b2Math.Min( -velocity + rate, max ); 
            var velChange = targetVelocity - velocity;
            var impel = this.body.GetMass() * velChange;
            this.body.ApplyImpulse( new b2Vec2(impel,0), this.body.GetWorldCenter() );
        },
        brake: function(direction) {
            var velocity = this.body.GetLinearVelocity().x;
            var targetVelocity = direction < 0 ?
                b2Math.Max( velocity - 0.5, 0 ) : b2Math.Min( velocity + 0.5, 0 ); 
            var velChange = targetVelocity - velocity;
            var impel = this.body.GetMass() * velChange;
            this.body.ApplyImpulse( new b2Vec2(impel,0), this.body.GetWorldCenter() );
        },
        jump: function(magnitude) {
            var velocity = this.body.GetLinearVelocity();
            velocity.y = -0.75*magnitude;
            this.body.SetLinearVelocity(velocity);
        },
		initialize: function() {
            this.fixture = physics.createPlayerFixture(0,0,75,75,1);
            this.body = this.fixture.GetBody();
            this.container = new Container;
            this.container.regX = 75, this.container.regY = 110;
            this.skin = assets.getAnimation("player");
            this.container.addChild(this.skin);
            this.gotoAndPlay("still");
		},
        giveArticle: function(name) {
            // need a mechanisim to check if item already exists
            var article = assets.getAnimation(name); 
            this.articles.push( article );
            this.container.addChild(article);
            this.gotoAndPlay("still"); // maybe celebrate?
        },
        gotoAndPlay: function(frame) {
            this.skin.gotoAndPlay(frame);
            this.articles.forEach(function(skin) {
                skin.gotoAndPlay(frame);
            },this);
        },
        reset: function() {
            this.body.SetAngularVelocity(0);

            var position = this.body.GetWorldCenter();
            position.x = 0, position.y = 0;
            this.body.SetPositionAndAngle(position,0);

            var velocity = this.body.GetLinearVelocity();
            velocity.x = 0, velocity.y = 0;
            this.body.SetLinearVelocity(velocity);
            this.body.SetAwake(true);
            this.gotoAndPlay("still");
        },
        getLinearVelocity: function() {
            return this.body.GetLinearVelocity();
        },
		advance: function() {
            var angle = this.body.GetAngle();
            if( angle > this.maximumRotation ) {
                this.body.SetAngle( this.maximumRotation );
            }
            else if( angle < -this.maximumRotation ) {
                this.body.SetAngle( -this.maximumRotation );
            }
		},
        actionStep: function(direction,mag) {
            this.impulse(direction, mag, mag);
        },
		actionForward: function() {
			this.impulse(-1, 2, 5);
            this.jump(1);
		},
		actionFlight: function() {
            this.jump(3.5);
		},
		actionSuperforward: function() {
			this.impulse(-1, 3, 5);
            this.jump(1);
		},
		actionBackward: function() {
			this.impulse(1, 1, 5);
		},
		actionStand: function() {
		},
		actionBrake: function() {
            this.brake();
		},
	}
}());


var main = (function () {
	"use strict";

    function fireMenuAction(action) {
        switch(action) {
            case "TOGGLE":
                hud.toggleMenu();
                break;
            default:
                console.log("unknown menu action:", action);
                break;
        }
    }
    
	function firePlayAction(action) {
		switch(action) {
			case "FWD_STEP1": 
                audio.soundOn(1);
                player.actionStep(-1,1);
                player.gotoAndPlay("step1");
                playspace.addTrail( player.body, ".");
				break;
			case "FWD_STEP2": 
                audio.soundOn(2);
                player.actionStep(-1,1.2);
                player.gotoAndPlay("step2");
                playspace.addTrail(player.body, ".");
				break;
			case "FWD_STEP3": 
                audio.soundOn(3);
                player.actionStep(-1,1.5);
                player.gotoAndPlay("step3");
                playspace.addTrail(player.body, ".");
				break;
			case "BWD_STEP1": 
                audio.soundOn(3);
                player.actionStep(1,1);
                player.gotoAndPlay("step1");
				break;
			case "BWD_STEP2": 
                audio.soundOn(2);
                player.actionStep(1,1);
                player.gotoAndPlay("step2");
				break;
			case "BWD_STEP3": 
                audio.soundOn(1);
                player.actionStep(1,1);
                player.gotoAndPlay("step3");
				break;
            case "FORWARD":
                audio.soundOn(3);
                audio.soundOn(2);
                audio.soundOn(1);
                player.actionForward();
                player.gotoAndPlay("jump");
                playspace.addTrail(player.body, "boing!");
                break;
            case "FLIGHT":
                audio.soundOn(3);
                audio.soundOn(2);
                audio.soundOn(1);
                player.actionFlight();
                player.gotoAndPlay("fly");
                playspace.addTrail(player.body, "super!");
                break;
            case "STAND":
                audio.soundOn(4);
                player.gotoAndPlay("stand");
                break;
            case "LAND":
                player.gotoAndPlay("land");
                break;
            case "USE":
                console.log("use item");
                player.gotoAndPlay("use");
                break;
            case "EXPIRED":
                player.gotoAndPlay("land");
                break;
            case "RECOVERED":
                player.gotoAndPlay("land");
                break;
			default:
				console.log("unknown play action:", action);
				break;
		}
	}


    var video = (function(){
        return {
            canvas: undefined,
            context: undefined,
            stage:undefined,
            initialize: function() {
                this.canvas = document.getElementById("testCanvas");
                this.context = this.canvas.getContext("2d");
                this.stage = new Stage(this.canvas);
                this.stage.autoClear = true;
            },
            update: function() {
                this.stage.update();
            }
        }
    }());

    function initializeVideo() {
    }

    var handleCompleteObjective = function(objective) {
        playInput.disable();
        player.reset();
        ball.reset();
        manager.nextObjective(objective);
    };

    var handleConcludeObjective = function(objective) {
        playInput.disable();
        player.reset();
        ball.reset();
        camera.zoomFactorTarget = 1.0;
        camera.setZoom(0.75);
    };

    var handleInitiateObjective = function(objective) {
        if( objective.article ) { player.giveArticle(objective.article); }
        hud.setTargetVelocity( objective.targetVelocity );
        hud.announce(objective.title,1, function() { 
            objective.encodeActions( playInput.getRootAction() );
            playInput.enable();
        });
    };

	return {
        preload: function() {
            assets.onReady = this.start.bind(this);
            assets.initialize();
        },
		start: function () {
            video.initialize();
            audio.initialize();
            input.initialize();
            playInput.setActionDelegate(firePlayAction);
            menuInput.setActionDelegate(fireMenuAction);
            menuInput.enable();

            physics.initialize();
            physics.setDebugDraw(video.canvas);
            camera.initialize(video.stage);

            player.initialize();
            ball.initialize();

            playspace.initialize();
            playspace.bindCamera(camera);
            playspace.bindParallax(camera);
            playspace.addPlayer( player );
            playspace.addBall( ball );
            video.stage.addChild(playspace.container);

            camera.watch( player );

            hud.initialize(video.canvas);
            hud.setPlayer(player);
            hud.setBall(ball);

            manager.initialize();
            manager.onCompleteObjective = handleCompleteObjective;
            manager.onInitiateObjective = handleInitiateObjective;
            manager.onConcludeObjective = handleConcludeObjective;
            manager.setPlayer( player );
            manager.setBall( ball );

            Ticker.setFPS(FPS);
            Ticker.useRAF = true;
            Ticker.addListener(this);
            hud.announce("Push, Chinchilla!",5, function() { manager.firstObjective(); });
		},
        debugClear: function() {
            context.save();
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.restore();
        },
        drawDebug: function() {
            context.save();
            context.translate(camera.requiredTranslation.x*camera.zoomFactor,camera.requiredTranslation.y*camera.zoomFactor);
            physics.drawDebug();
            context.restore();
        },
        debugUpdate: function(elapsedTime) {
            this.debugClear();
            this.update(elapsedTime);
            this.drawDebug();
        },
        update: function(elapsedTime) {
			audio.advance();
			input.advance();
			physics.advance();
			player.advance();
            ball.advance();
            camera.advance();
            playspace.advance();
            manager.advance();
			video.update();
            hud.update();
        },
		tick: function (elapsedTime) {
            if(DEBUG) {
                this.debugUpdate();
            }
            else {
                this.update(elapsedTime);
            }
        }
	};
}());
