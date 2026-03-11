class LightsOutScene extends Phaser.Scene {
  init(config) {
    this.config = {
      background_image: 'circuit_back2.png',
      background_color: '#000000',
      grid_size: config.grid_size || 3,
      tile_spacing: 8,
      move_count: null,
      win_action: function(t) { t.winText.setVisible(true); },
      type: 'lights_out',
      ...config
    }
    // console.log(this.config)
    if (!this.config.move_count) { this.config.move_count = this.config.grid_size * 2; }
    this.lights_off = true
    this.buttons = []
    this.moves = []
  }

  preload() {
    if (this.config.background_image) {
        this.load.image('background', this.config.background_image);
    }

    // Optional: Load assets if using custom sprites
     this.load.image('light_on', './lights_on.png');
     this.load.image('light_off', './lights_off.png');
  }

  create() {
    if (this.config.background_image) {
        this.background = this.add.image(0, 0, 'background')
          .setOrigin(0, 0)
          .setDisplaySize(this.sys.canvas.width, this.sys.canvas.height);
    }
    if (this.config.background_color) { this.cameras.main.setBackgroundColor(this.config.background_color); }
    
    this.board_width = this.sys.canvas.width
    this.board_height = this.sys.canvas.height
    this.tile_size = (this.board_width / this.config.grid_size) - this.config.tile_spacing;
    this.board_x = (this.tile_size + (this.config.tile_spacing))/2;
    this.board_y = (this.tile_size + (this.config.tile_spacing))/2;

    this.grid = [];
    this.source_grid = [];
    this.tiles = [];
    this.patterns = [];
    this.overlay = [];

    let tileYPos = 0;

    for (let y = 0; y < this.config.grid_size; y++) {
      this.grid[y] = [];
      this.tiles[y] = [];
      this.overlay[y] = [];
      this.patterns[y] = []
      for (let x = 0; x < this.config.grid_size; x++) {
        this.grid[y][x] = false
        let tileX = this.board_x + (x * (this.tile_size + this.config.tile_spacing));
        let tileY = this.board_y + (y * (this.tile_size + this.config.tile_spacing));
        tileYPos = tileY
        let tile = null

        if (!this.lights_off) {
            tile = this.add.rectangle(
            tileX, tileY,
            this.tile_size, this.tile_size,
          ).setStrokeStyle(2, 0xaaaaaa);
          tile.setAlpha(0.9)
        } else {
            tile = this.add.image(tileX, tileY, 'light_off') //.setOrigin(0,0)
            .setDisplaySize(this.tile_size, this.tile_size);
        }

        // if (this.config.type == "flip") {
          this.overlay[y][x] = this.add.graphics();
        // }

        tile.setInteractive();
        tile.on('pointerdown', () => this.tileClick(x,y));

        this.tiles[y][x] = tile;
      }
      this.source_grid[y] = this.grid[y].slice();
    }

    // Add win text (hidden initially)
    this.winText = this.add.text(this.board_width/2, this.board_height/2, 'All lights off! You win!', {
      fontSize: '20px',
      fill: '#00ff00',
      backgroundColor: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.winText.setVisible(false);

    this.addButton(
      this.config.tile_spacing, 
      this.board_height - 40, 8, 
      'restart', 'RESTART',
      () => this.resetBoard()
    );

    this.addButton(
      this.config.tile_spacing + (this.board_width/3), 
      this.board_height - 40, 8, 
      'reroll', 'RE-ROLL',
      () => this.createBoard(this.config.move_count)
    );

    this.addButton(
      this.config.tile_spacing + (this.board_width/3) * 2, 
      this.board_height - 40, 8, 
      'clear', 'CLEAR',
      () => this.clearBoard()
    );

    this.createBoard(this.config.move_count);
  }

  addButton(x,y,pad,name,text,ondown=function(){}) {
    this.buttons[name] = this.add.text(
      x, 
      y, 
      text, {
        fontSize: '18px',
        fontStyle: 'bold',
        fill: '#ddaa00',
        backgroundColor: '#000000',
        padding: { x: pad, y: pad }
      }
    ).setOrigin(0,0).setInteractive().setAlpha(0.95);

    this.buttons[name].on('pointerdown', ondown);
  }

  createBoard(move_count=10) {
    this.winText.setVisible(false);
    // console.log(JSON.stringify(this.grid))
    // console.log(JSON.stringify(this.source_grid))
    this.moves = []
    this.clearBoard()

    for (let y = 0; y < this.config.grid_size; y++) {
      for (let x = 0; x < this.config.grid_size; x++) {
        this.source_grid[y][x] = false; 
        if (this.config.type == 'flip') {
          this.patterns[y][x] = this.generateRandomPatterns();
        } else {
          this.patterns[y][x] = this.normalPattern();
        }
        this.overlay[y][x].clear()
        if (this.config.type == 'flip') {
          this.setOverlay(x,y)
        }
      }
    }

    let x = null; let last_x = null
    let y = null; let last_y = null
    for (let m = 0; m < move_count; m++) {
      do {
        x = Phaser.Math.Between(0, (this.config.grid_size - 1))
        y = Phaser.Math.Between(0, (this.config.grid_size - 1))
      } while(x == last_x && y == last_y)
      // console.log(y,last_y,x,last_x)
      last_x = x 
      last_y = y 
    // console.log(m + ': ' + x + ',' + y)
      this.moves.unshift([x+1,y+1])
      this.toggleTile(x, y, true)
    }

    this.winnable = true
  }

  tileClick(x,y) {
    this.toggleTile(x,y)
    // Check win condition
    this.checkWin();
  }

  generateRandomPatterns() {
    // Random pattern: which neighbors to flip (dx, dy)
    const dirs = [
        { dx: 0, dy: 0 }, // self
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];
    let pattern = [];
    for (let i = 0; i < dirs.length; i++) {
      if (Math.random() > 0.5) pattern.push(dirs[i]);
    }
    return pattern
  }

  normalPattern() {
    return [
      { dx: 0, dy: 0 }, // self
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 }   // right
    ];
  }

  toggleTile(x, y,source=false) {
    // Toggle the clicked tile and its neighbors
    const neighbors = this.patterns[y][x]

    for (const { dx, dy } of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < this.config.grid_size && ny >= 0 && ny < this.config.grid_size) {
        this.grid[ny][nx] = !this.grid[ny][nx];
        if (source) { this.source_grid[ny][nx] = this.grid[ny][nx] }
        this.updateTile(nx,ny,false)
      }
    }
  }

  setOverlay(x,y) {
    let tile = this.tiles[y][x]
    let tx = tile.x
    let ty = tile.y 
    let tw = tile.width 
    let th = tile.height
    let depth = this.config.grid_size * this.config.grid_size + 100
    const neighbors = this.patterns[y][x]

    for (const { dx, dy } of neighbors) {
console.log(tx + ',' + ty)
      let txp = tx + (dx * (this.tile_size/2.5 - 5) - 6) // this.tile_spacing
      let typ = ty + (dy * (this.tile_size/2.5 - 5) - 6) //+ this.tile_spacing
      this.overlay[y][x].fillStyle(0xeeeeee, 0.6).fillRect(
         txp, typ, 10, 10
      ).lineStyle(1, 0x000000, 0.6).strokeRect(txp,typ,10,10).setDepth(depth) //.setStrokeStyle(1, 0xaaaaaa);
    }

  }

  checkWin() {
    if (this.winnable == true) {
      const allOff = this.grid.every(row => row.every(light => !light));
      if (allOff) {
        this.config.win_action(this)
      }
    }
  }

  updateTile(x,y,over=true) {
    if (this.tiles[y][x].type === 'Image') {
      this.tiles[y][x].setTexture(this.grid[y][x] ? 'light_on' : 'light_off');
    } else {
      this.tiles[y][x].setFillStyle(this.grid[y][x] ? 0xffff00 : 0x333333);
    }
    if (over && this.config.type == 'flip') {
      this.setOverlay(x,y)
      // this.overlay[y][x]
    }
  }

  resetBoard() {
    for (let y = 0; y < this.config.grid_size; y++) {
      for (let x = 0; x < this.config.grid_size; x++) {
        this.grid[y][x] = this.source_grid[y][x]; 
        this.updateTile(x,y)
      }
    }
    this.winnable = true
  }

  clearBoard() {
    for (let y = 0; y < this.config.grid_size; y++) {
      for (let x = 0; x < this.config.grid_size; x++) {
        this.grid[y][x] = false; 
        this.updateTile(x,y,false)
      }
    }
    this.winnable = false
    this.winText.setVisible(false);
  }

  toggleTile_LO(x, y,source=false) {
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
      if (nx >= 0 && nx < this.config.grid_size && ny >= 0 && ny < this.config.grid_size) {
        this.grid[ny][nx] = !this.grid[ny][nx];
        if (source) { this.source_grid[ny][nx] = this.grid[ny][nx] }
        this.updateTile(nx,ny)
      }
    }
  }
}