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
    this.player.width = 20;
    this.player.height = 20;

    // Add gravity to make it fall
    this.player.body.gravity.y = 600;

    // Create 3 groups that will contain our objects
    this.walls = game.add.group();
    this.coins = game.add.group();
    this.enemies = game.add.group();
    this.specialCoin = null;
    this.removeableEnemies = [];
    this.removeableWalls = [];
    this.mysteryWalls = [];

    // Design the level. x = wall, o = coin, ! = lava.
    var level = [
       ' xxxxxxxxxxxxxxxxxxxxxx',
       ' !      !             x',
       ' !      !          s  x',
       ' r          o         x',
       'or      o      !      x',
       ' r          x      d  x',
       ' !      !      o      x',
       ' xxxxxxxxx!!!!qqq!!!!!x',
    ];

    // Create the level by going through the array
    for (var i = 0; i < level.length; i++) {
      for (var j = 0; j < level[i].length; j++) {

          // Create a wall and add it to the 'walls' group
          if (level[i][j] == 'x') {
              var wall = game.add.sprite(30+20*j, 30+20*i, 'wall');
              wall.width = 20;
              wall.height = 20;
              this.walls.add(wall);
              wall.body.immovable = true;
          }

          // Create a coin and add it to the 'coins' group
          else if (level[i][j] == 'o') {
              var coin = game.add.sprite(30+20*j, 30+20*i, 'coin');
              coin.width = 20;
              coin.height = 20;
              this.coins.add(coin);
          }

          // Create a enemy and add it to the 'enemies' group
          else if (level[i][j] == '!') {
              var enemy = game.add.sprite(30+20*j, 30+20*i, 'enemy');
              enemy.width = 20;
              enemy.height = 20;
              this.enemies.add(enemy);
          }

          else if (level[i][j] == 's') {
              var specialCoin = game.add.sprite(30+20*j, 30+20*i, 'coin');
              specialCoin.width = 20;
              specialCoin.height = 20;
              this.specialCoin = specialCoin;
          }

          else if (level[i][j] == 'r') {
            var removeableEnemy = game.add.sprite(30+20*j, 30+20*i, 'enemy');
            removeableEnemy.width = 20;
            removeableEnemy.height = 20;
            this.removeableEnemies.push(removeableEnemy);
            this.enemies.add(removeableEnemy);
          }

          else if (level[i][j] == 'd') {
            var removeableWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            removeableWall.width = 20;
            removeableWall.height = 20;
            this.removeableWalls.push(removeableWall);
            this.walls.add(removeableWall);
            removeableWall.body.immovable = true;
          }

          else if (level[i][j] == 'q') {
            var mysteryWall = game.add.sprite(30+20*j, 30+20*i, 'wall');
            mysteryWall.width = 20;
            mysteryWall.height = 20;
            this.mysteryWalls.push(mysteryWall);
            this.walls.add(mysteryWall);
            mysteryWall.body.immovable = true;
          }
      }
    }
  },

  update: function() {
    // Make the player and the walls collide
    game.physics.arcade.collide(this.player, this.walls);

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
    specialCoin.kill();
    this.removeableEnemies.forEach(enemy => enemy.kill());
    this.removeableWalls.forEach(wall => wall.kill());
    this.mysteryWalls.forEach(mysteryWall => {
      const x = mysteryWall.world.x;
      const y = mysteryWall.world.y;
      mysteryWall.kill();

      const enemy = this.game.add.sprite(x, y, 'enemy');
      enemy.width = 20;
      enemy.height = 20;
      this.enemies.add(enemy);
    });
  },

  // Function to restart the game
  restart: function() {
    game.state.start('main');
  }
};

// Initialize the game and start our state
var game = new Phaser.Game(500, 200, Phaser.AUTO);
game.state.add('main', mainState);
game.state.start('main');
