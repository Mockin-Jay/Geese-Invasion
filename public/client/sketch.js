const socket = io();

let players = [];


let goose = {
  location: {
    y: 0
  },
  speed: 0.5,
  state: 'walk',
}


// for creating rig / animation
// will create this by rotating and translating objects
let rig = {

  right: {
      topLeg: {
          rotation: {
          x: 0
          }
      },
      botLeg: {
          rotation: {
          x: 0
          }
      },
  },

  left: {
      topLeg: {
          rotation: {
          x: 0
          }
      },
      botLeg: {
          rotation: {
          x: 0
          }
      },
  
  },
  
}



function preload() {
  ground = loadImage('data/overlay.png');

  // preload body parts of goose
  head = loadModel('data/Head.obj');
  body = loadModel('data/Body.obj');
  topLeg = loadModel('data/Thigh.obj');
  botLeg = loadModel('data/Shin.obj');
  foot = loadModel('data/Foot.obj');

  // textures
  bodyTexture = loadImage('data/body.png');

}


function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  eyeZ = ((height/2) / tan(PI/6));
  perspective(PI/3, width/height, eyeZ/10, eyeZ*10);
  
  camera(0, -300, 300, 0, 0, 0, 0, 0, -1);
  walkSpeed = 0;

  // initialize playerVelocity to 0
  playerVel = 0;

}


let keys = {
  upDown: [0, 0], // forward/backward
  leftRight: [0, 0], // left/right
  resultant: [0, 0],   // vector resultant
};



function draw() {

  background(220);
  lights();

  translate(0, 0, -125);

  // plane
  noStroke();
  texture(ground);
  plane(200000);


  // set angle of camera
  let camAngle = atan2(500*cos(1/90), 500*sin(1/90));
  
  // angle of player movement
  let playerTheta = atan2(keys.resultant[1], keys.resultant[0]);
  playerVel = dist(0, 0, keys.resultant[0], keys.resultant[1]) * 15;



  for (let playerId in players) {
    
    let player = players[playerId];

    push();

    // translate goose down slightly
    //translate(0, 0, -125);

    translate(player.x, player.y);

    // translate and scale so goose walks on plane
    rotateX(PI/2);
    scale(25);
    translate(0, 0.75, 0);
    
    if (player == players[socket.id]) {
      rotateY((camAngle + playerTheta) - PI/2);
    }

    // left leg
    push();

      // connecting all 3 limbs - topleg, botleg, foot
      // connecting all helps with preventing awkward movement between limbs
      // start with the topLeg
      translate(-0.05, 3.6, -0.1);

      rotateX(rig.left.topLeg.rotation.x);

      // display obj
      translate(0, -0.25, 0);
      scale(-1, 1, 1);
      fill('#856545');
      model(this.topLeg);

      // handle botLeg
      push();

          translate(0, 0.3, 0);

          rotateX(rig.left.botLeg.rotation.x);
          
          translate(0, -0.25, 0);
          // black filling
          fill(0);
          model(this.botLeg);

          // handle foot
          push();

              translate(0, 0.25, -0.17);
              
              translate(0, -0.25, 0.2);
              // foot is also black
              fill(0);
              model(this.foot);

          pop();
      pop();
  pop();


  // right leg
  push();

      // connecting all 3 limbs - topleg, botleg, foot
      // connecting all helps with preventing awkward movement between limbs
      // start with the topLeg
      translate(0.15, 3.6, -0.1);

      rotateX(rig.right.topLeg.rotation.x);
      
      // display obj
      translate(0, -0.25, 0);
      fill('#856545');
      model(this.topLeg);

      // handle botLeg
      push();
          translate(0, 0.3, 0);

          rotateX(rig.right.botLeg.rotation.x);
          
          translate(0, -0.25, 0);
          // black
          fill(0);
          model(this.botLeg);

          // handle foot
          push();

              translate(0, 0.25, -0.17);
              
              translate(0, -0.25, 0.2);
              // foot is also black
              fill(0);
              model(this.foot);

          pop();
      pop();
  pop();


  // main body
  push();

      translate(0, 3, 0);
      
      // assign body texture
      texture(bodyTexture);
      // display obj
      model(this.body);

  pop();


  // head
  push();

      translate(0, 3);

      // head is black
      // and display obj
      fill(0);
      model(this.head);

  pop();

  pop();
    pop();

  }




  let player = players[socket.id];

  // light
  pointLight(175, 175, 175, 500*sin((width)/90)+player.x, 500*cos((width)/90)+player.y, 300);

  
  // finding player movement
  player.x -= playerVel * cos(camAngle + playerTheta);
  player.y -= playerVel * sin(camAngle + playerTheta);

  // set up camera for particular user
  camera(player.x, 800 + player.y, 300, player.x, player.y, 0, 0, 0, -1);


  socket.emit('playerMovement', { x: player.x, y: player.y });


  // goose walking
  // determine if walking state
  if (goose.state == 'walk') {

    walkSpeed += 0.09;

    if (playerVel) {
        goose.speed = 0.5;
    }
    else {
        goose.speed = 0;
    }

    let freq = 6 * goose.speed;
    let amp = freq / 8;

          
    rig.right.topLeg.rotation.x = amp * cos(freq*walkSpeed);
    // right is opposite movement to left
    rig.left.topLeg.rotation.x = -amp * cos(freq*walkSpeed);

    rig.right.botLeg.rotation.x = amp * (cos(freq*walkSpeed) + 1) / 2;
    // right is opposite movement to left
    rig.left.botLeg.rotation.x = -amp * (cos(freq*walkSpeed) - 1) / 2;


    goose.location.y = amp * cos(freq*2*walkSpeed)/4 + 0.2;

    rotateX(goose.speed * amp / 2);

    // generate "bounce" effect when walking
    translate(0, goose.location.y, 0);

    }
      


}


// connection
// ================================================================

function newPlayerConnected(data) {
  players[data.id] = {
    x: data.x,
    y: data.y,
  };
}


// movement
// ================================================================

function overallDir(arr) {

  let dir = 0;
  
  for (let val of arr) {
    dir += val;
  }

  return dir;
}



function keyPressed() {
  let player = players[socket.id];
  if (player) {
    
    if ((key == "A") || (key == "a") || (keyCode === LEFT_ARROW)) {
      keys.leftRight[0] = -1;
    }
  
    if ((key == "D") || (key == "d") || (keyCode === RIGHT_ARROW)) {
      keys.leftRight[1] = 1;
    }
  
    if ((key == "W") || (key == "w") || (keyCode === UP_ARROW)) {
      keys.upDown[0] = 1;
    }
  
    if ((key == "S") || (key == "s") || (keyCode === DOWN_ARROW)) {
      keys.upDown[1] = -1;
    }
  
    keys.resultant = [overallDir(keys.upDown), overallDir(keys.leftRight)];  

    //socket.emit('playerMovement', { x: player.x, y: player.y });
  }
}


function keyReleased() {
  let player = players[socket.id];
  if (player) {

    if ((key == "A") || (key == "a") || (keyCode === LEFT_ARROW)) {
      keys.leftRight[0] = 0;
    }
  
    if ((key == "D") || (key == "d") || (keyCode === RIGHT_ARROW)) {
      keys.leftRight[1] = 0;
    }
  
    if ((key == "W") || (key == "w") || (keyCode === UP_ARROW)) {
      keys.upDown[0] = 0;
    }
  
    if ((key == "S") || (key == "s") || (keyCode === DOWN_ARROW)) {
      keys.upDown[1] = 0;
    }
  
    keys.resultant = [overallDir(keys.upDown), overallDir(keys.leftRight)];
  
  }
}


function touchStarted() {

  let player = players[socket.id];

  if (player) {

    if (mouseX < (width / 2 - 100)) {
      keys.leftRight[0] = -1;
    }

    if (mouseX > (width / 2 + 100)) {
      keys.leftRight[1] = 1;
    }

    if (mouseY < (height / 2 - 150)) {
      keys.upDown[0] = 1;
    }

    if (mouseY > (height / 2 + 150)) {
      keys.upDown[1] = -1;
    }

    keys.resultant = [overallDir(keys.upDown), overallDir(keys.leftRight)];
  }
}


function touchEnded() {

  let player = players[socket.id];

  if (player) {
    if (mouseX < (width / 2 - 100)) {
      keys.leftRight[0] = 0;
    }

    if (mouseX > (width / 2 + 100)) {
      keys.leftRight[1] = 0;
    }

    if (mouseY < (height / 2 - 150)) {
      keys.upDown[0] = 0;
    }

    if (mouseY > (height / 2 + 150)) {
      keys.upDown[1] = 0;
    }

    keys.resultant = [overallDir(keys.upDown), overallDir(keys.leftRight)];

  }
}




function playerMoved(data) {
  players[data.id].x = data.x;
  players[data.id].y = data.y;
}



// disconnected
// ==================================================================



function playerDisconnected(id) {
  delete players[id];
}


// listen to server
// ================================================================


  
socket.on('playerConnected', newPlayerConnected);
socket.on('playerMoved', playerMoved);
socket.on('playerDisconnected', playerDisconnected);




