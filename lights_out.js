class LightsOutScene extends Phaser.Scene {
  constructor (config={},ph_config={}) {
    super('LightsOut');
    this.config = config;
    this.config.backgroundImage = 'lights-out-background.jpg'
    this.grid_size = 6;
    this.tile_spacing = 5;
    this.moves = this.grid_size * 2;
    this.lights_off = true
  }

  preload() {
    if (this.config.backgroundImage) {
        this.load.image('background', this.config.backgroundImage);
    }

    // Optional: Load assets if using custom sprites
     this.load.image('light_on', './lights_on.png');
     this.load.image('light_off', './lights_off.png');
  }

  create() {
    if (this.config.backgroundImage) {
        this.background = this.add.image(0, 0, 'background') //,this.config.backgroundImage)
          .setOrigin(0, 0)
          .setDisplaySize(this.sys.canvas.width, this.sys.canvas.height);
    }
    if (this.config.backgroundColor) { this.cameras.main.setBackgroundColor(this.config.backgroundColor); }
    
    this.board_width = this.sys.canvas.width
    this.board_height = this.sys.canvas.height
    this.tile_size = (this.board_width / this.grid_size) - this.tile_spacing;
    this.board_x = (this.tile_size + (this.tile_spacing))/2;
    this.board_y = (this.tile_size + (this.tile_spacing))/2;

    this.grid = [];
    this.tiles = [];

    for (let y = 0; y < this.grid_size; y++) {
      this.grid[y] = [];
      this.tiles[y] = [];
      for (let x = 0; x < this.grid_size; x++) {
        this.grid[y][x] = 0
        // Create tile
        let tileX = this.board_x + (x * (this.tile_size + this.tile_spacing));
        let tileY = this.board_y + (y * (this.tile_size + this.tile_spacing));
        // if (x == 0) { tileX = tileX - this.tile_spacing/2}
        // if (y == 0) { tileY = tileY - this.tile_spacing/2}
        let tile = null
        if (!this.lights_off) {
            tile = this.add.rectangle(
            tileX, tileY,
            this.tile_size, this.tile_size,
            this.grid[y][x] ? 0xffff00 : 0x333333
          ).setStrokeStyle(2, 0xaaaaaa);
          tile.setAlpha(0.9)
        } else {
            tile = this.add.image(tileX, tileY, 'light_off') //.setOrigin(0,0)
            .setDisplaySize(this.tile_size, this.tile_size);
        }
        tile.setInteractive();
        tile.on('pointerdown', () => this.tileClick(x,y));

        this.tiles[y][x] = tile;
      }
    }

    // Add win text (hidden initially)
    this.winText = this.add.text(this.board_width/2, this.board_height/2, 'All lights off! You win!', {
      fontSize: '20px',
      fill: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.winText.setVisible(false);

    // Optional: Add reset button
    // const resetBtn = this.add.text(400, 550, 'Reset', {
    //   fontSize: '14px',
    //   fill: '#fff',
    //   backgroundColor: '#f00',
    //   padding: { x: 16, y: 8 }
    // }).setOrigin(0.5).setInteractive();

    // resetBtn.on('pointerdown', () => this.resetGrid());

    this.createBoard(this.moves); //resetGrid()
  }

  createBoard(moves=10) {
    this.resetBoard
    for (let m = 0; m < moves; m++) {
        let x = Phaser.Math.Between(0, (this.grid_size - 1))
        let y = Phaser.Math.Between(0, (this.grid_size - 1))
        // this.grid[y][x] = Phaser.Math.Between(0, 1) === 1;
        // this.tiles[y][x].setFillStyle(this.grid[y][x] ? 0xffff00 : 0x333333);
        console.log(x,y)
        this.toggleTile(x, y)
    }
  }

  tileClick(x,y) {
    this.toggleTile(x,y)
    // Check win condition
    this.checkWin();
  }

  toggleTile(x, y) {
    // Toggle the clicked tile and its neighbors
    const neighbors = [
      { dx: 0, dy: 0 }, // self
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 }   // right
    ];

    for (const { dx, dy } of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < this.grid_size && ny >= 0 && ny < this.grid_size) {
        this.grid[ny][nx] = !this.grid[ny][nx];
        if (this.tiles[ny][nx].type === 'Image') {
          this.tiles[ny][nx].setTexture(this.grid[ny][nx] ? 'light_on' : 'light_off');
        } else {
          this.tiles[ny][nx].setFillStyle(this.grid[ny][nx] ? 0xffff00 : 0x333333);
        }
      }
    }
  }

  checkWin() {
    const allOff = this.grid.every(row => row.every(light => !light));
    if (allOff) {
      this.winText.setVisible(true);
    }
  }

  resetGrid() {
    for (let y = 0; y < this.grid_size; y++) {
      for (let x = 0; x < this.grid_size; x++) {
        this.grid[y][x] = 0; //Phaser.Math.Between(0, 1) === 1;
        // this.tiles[ny][nx].setTexture(this.grid[ny][nx] ? 'light_on' : 'light_off');
        //this.tiles[y][x].setFillStyle(this.grid[y][x] ? 0xffff00 : 0x333333);
        if (this.tiles[ny][nx].type === 'Image') {
          this.tiles[ny][nx].setTexture(this.grid[ny][nx] ? 'light_on' : 'light_off');
        } else {
          this.tiles[ny][nx].setFillStyle(this.grid[ny][nx] ? 0xffff00 : 0x333333);
        }

      }
    }
    this.winText.setVisible(false);
  }
}