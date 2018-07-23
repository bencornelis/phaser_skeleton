const CELL_DIM = 20; // cell dimension

// Create the state that will contain the whole game
var mainState = {
  preload: function() {
    // Here we preload the assets
    game.load.image('player', 'assets/cokecan.png');
    game.load.image('wall', 'assets/wall.png');
    game.load.image('coin', 'assets/melon.png');
    game.load.image('enemy', 'assets/saw.png');
  },

  create: function() {
    clearInterval(this.movingWallIntervalId);
    this.game = game;
    // Set the background color to blue
    game.stage.backgroundColor = '#3598db';

    // Start the Arcade physics system (for movements and collisions)
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Add the physics engine to all game objects
    game.world.enableBody = true;

    // Variable to store the arrow key pressed
    this.cursor = game.input.keyboard.createCursorKeys();

    // Create the player in the middle of the game
    this.player = game.add.sprite(70, 100, 'player');
    this.player.width = CELL_DIM;
    this.player.height = CELL_DIM;

    // Add gravity to make it fall
    this.player.body.gravity.y = 600;

    // Create 3 groups that will contain our objects
    this.walls = game.add.group();
    this.coins = game.add.group();
    this.enemies = game.add.group();
    this.specialWalls = game.add.group();
    this.specialCoin = null;
    this.removeableEnemies = [];
    this.removeableWalls = [];
    this.mysteryWalls = [];
    this.movingWall = null;
    this.movingWallIntervalId = null;
    this.hiddenEnemySpriteCoords = [];
    this.visibleHiddenEnemies = [];

    // Design the level. x = wall, o = coin, ! = lava.
    var level = [
       ' xxxxxxxxxxxxxxxxxxxxxx',
       ' !      !      h      x',
       ' !      !      h    s x',
       ' r          o  h      x',
       'or      o      !      t',
       ' r          m     d   x',
       ' !      !      o      x',
       ' xxxxxxxxx!!!!qqq!!!!!x',
    ];

    // Create the level by going through the array
    for (var i = 0; i < level.length; i++) {
      for (var j = 0; j < level[i].length; j++) {

          // Create a wall and add it to the 'walls' group
          if (level[i][j] == 'x') {
              var wall = game.add.sprite(30+20*j, 30+20*i, 'wall');
              wall.width = CELL_DIM;
              wall.height = CELL_DIM;
              this.walls.add(wall);
              wall.body.immovable = true;
          }

          // Create a coin and add it to the 'coins' group
          else if (level[i][j] == 'o') {
              var coin = game.add.sprite(30+20*j, 30+20*i, 'coin');
              coin.width = CELL_DIM;
              coin.height = CELL_DIM;
              this.coins.add(coin);
          }

          // Create a enemy and add it to the 'enemies' group
          else if (level[i][j] == '!') {
              var enemy = game.add.sprite(30+20*j, 30+20*i, 'enemy');
              enemy.width = CELL_DIM;
              enemy.height = CELL_DIM;
              this.enemies.add(enemy);
          }

          else if (level[i][j] == 's') {
              var specialCoin = game.add.sprite(30+20*j, 30+20*i, 'coin');
              specialCoin.width = CELL_DIM;
              specialCoin.height = CELL_DIM;
              this.specialCoin = specialCoin;
          }

          else if (level[i][j] == 'r') {
            var removeableEnemy = game.add.sprite(30+20*j, 30+20*i, 'enemy');
            removeableEnemy.width = CELL_DIM;
            removeableEnemy.height = CELL_DIM;
            this.removeableEnemies.push(removeableEnemy);
            this.enemies.add(removeableEnemy);
          }

          else if (level[i][j] == 'd') {
            var removeableWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            removeableWall.width = CELL_DIM;
            removeableWall.height = CELL_DIM;
            this.removeableWalls.push(removeableWall);
            this.walls.add(removeableWall);
            removeableWall.body.immovable = true;
          }

          else if (level[i][j] == 'q') {
            var mysteryWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            mysteryWall.width = CELL_DIM;
            mysteryWall.height = CELL_DIM;
            this.mysteryWalls.push(mysteryWall);
            this.walls.add(mysteryWall);
            mysteryWall.body.immovable = true;
          }

          else if (level[i][j] == 'm') {
            var movingWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            movingWall.width = CELL_DIM;
            movingWall.height = CELL_DIM;
            this.movingWall = movingWall;
            this.walls.add(this.movingWall);
            this.movingWall.body.immovable = true;
          }

          else if (level[i][j] == 't') {
            var specialWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            specialWall.width = CELL_DIM;
            specialWall.height = CELL_DIM;
            this.specialWalls.add(specialWall);
            specialWall.body.immovable = true;
          }

          else if (level[i][j] == 'h') {
            this.hiddenEnemySpriteCoords.push([ 30+20*j, 30+20*i ]);
          }
      }
    }
  },

  update: function() {
    // Make the player and the walls collide
    game.physics.arcade.collide(this.player, this.walls);
    game.physics.arcade.collide(this.player, this.specialWalls, this.handleSpecialWallCollision, null, this);

    // Call the 'takeCoin' function when the player takes a coin
    game.physics.arcade.overlap(this.player, this.coins, this.takeCoin, null, this);

    // Call the 'takeCoin' function when the player takes a coin
    game.physics.arcade.overlap(this.player, this.specialCoin, this.takeSpecialCoin, null, this);

    // Call the 'restart' function when the player touches the enemy
    game.physics.arcade.overlap(this.player, this.enemies, this.restart, null, this);

    // Here we update the game 60 times per second
    // Move the player when an arrow key is pressed
    if (this.cursor.left.isDown)
      this.player.body.velocity.x = -200;
    else if (this.cursor.right.isDown)
      this.player.body.velocity.x = 200;
    else
      this.player.body.velocity.x = 0;

    // Make the player jump if he is touching the ground
    if (this.cursor.up.isDown && this.player.body.touching.down) {
      this.player.body.velocity.y = -250;
    }
  },

  // Function to kill a coin
  takeCoin: function(player, coin) {
    coin.kill();
  },

  takeSpecialCoin: function(player, specialCoin) {
    console.log(this.hiddenEnemySpriteCoords)

    specialCoin.kill();
    this.removeableEnemies.forEach(enemy => enemy.kill());
    this.removeableWalls.forEach(wall => wall.kill());
    this.mysteryWalls.forEach(mysteryWall => {
      const x = mysteryWall.world.x;
      const y = mysteryWall.world.y;
      mysteryWall.kill();

      const enemy = this.game.add.sprite(x, y, 'enemy');
      enemy.width = CELL_DIM;
      enemy.height = CELL_DIM;
      this.enemies.add(enemy);
    });

    setTimeout(() => {
      this.hiddenEnemySpriteCoords.forEach(([x,y]) => {
        const enemy = this.game.add.sprite(x, y, 'enemy');
        enemy.width = CELL_DIM;
        enemy.height = CELL_DIM;
        this.enemies.add(enemy);
        this.visibleHiddenEnemies.push(enemy);
      });
    })
  },

  handleSpecialWallCollision: function(player, wall) {
    if (this.movingWallIntervalId) {
      return;
    }

    this.visibleHiddenEnemies.forEach(enemy => enemy.kill());

    const moveTime = 1500; // ms
    const moveWallLeft = ({ numSpaces }) => {
      const x = this.movingWall.world.x;
      const y = this.movingWall.world.y;

      this.game.physics.arcade.moveToXY(this.movingWall, x - numSpaces * CELL_DIM, y, 0, moveTime);
    }

    const moveWallRight = ({ numSpaces }) => {
      const x = this.movingWall.world.x;
      const y = this.movingWall.world.y;

      this.game.physics.arcade.moveToXY(this.movingWall, x + numSpaces * CELL_DIM, y, 0, moveTime);
    }

    moveWallLeft({ numSpaces: 2 });

    let shouldMoveRightNext = true;
    this.movingWallIntervalId = setInterval(() => {
      if (shouldMoveRightNext) {
        shouldMoveRightNext = false;
        moveWallRight({ numSpaces: 4 });
      } else {
        shouldMoveRightNext = true;
        moveWallLeft({ numSpaces: 4 });
      }
    }, moveTime);
  },

  // Function to restart the game
  restart: function() {
    clearInterval(this.movingWallIntervalId);
    game.state.start('main');
  }
};

// Initialize the game and start our state
var game = new Phaser.Game(500, 200, Phaser.AUTO);
game.state.add('main', mainState);
game.state.start('main');
