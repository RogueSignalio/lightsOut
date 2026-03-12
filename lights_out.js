class LightsOutScene extends Phaser.Scene {
  init(config) {
    this.config = {
      background_image: 'circuit_back2.png',
      background_color: '#000000',
      grid_size: config.grid_size || 3,
      tile_spacing: 8,
      move_count: null,
      type: 'lights_out',
      light_on_image: 'lights_on.png',
      light_off_image: 'lights_off.png',
      image_path: './',
      audio_path: './',
      sounds: {
        move: 'lights_out_move_b.mp3',
        // move2: 'lights_out_move2.mp3',
        start: 'lights_out_start_b.mp3',
        win: 'lights_out_win.mp3',
      },
      enable_restart: true,
      enable_reroll: true,
      enable_clear: true,
      audio_engine: null,
      minimized_scripts: false,      
      win_action: function(t) { t.winText.setVisible(true); },
      on_move_audio: function() { 
        //console.log(this)
        //console.log(this.audio_engine.play_sound_unqiue)
        this.play_sound_unqiue('move',{ detune: 200 }) 
        // this.play_sound_unqiue('move2',{ detune: 100 }) 
      }.bind(this),
      on_win_audio: function() { this.play_sound('win') }.bind(this),
      on_start_audio: function() { this.play_sound('start',{ detune: 200 }) }.bind(this),
      ...config
    }
    // console.log(this.config)
    window.lightsout_loaded = {}
    this.audio_keys = []
    this.plugins = {}
    this.config.modules_path = '.'
    this.key = 'lightsout'
    if (!this.config.move_count) { this.config.move_count = this.config.grid_size * 2; }
    if (this.config.grid_size > 9) { this.config.grid_size = 9 }
    if (this.config.grid_size < 3) { this.config.grid_size = 3 }
    if (this.config.type.match(/_on/i)) {
      this.config.tile_swap = true
    } else {
      this.config.tile_swap = false      
    }
    if (this.config.type.match(/flip_/i)) {
      this.config.pattern_action = this.simpleRandomPatterns //function() { this.simpleRandomPatterns(); }
      this.config.show_pattern = true
    } else if (this.config.type.match(/flipped_/i)) {
      this.config.pattern_action = this.complexRandomPatterns //function() { this.complexRandomPatterns(); }
      this.config.show_pattern = true
    } else {
      this.config.pattern_action = this.normalPattern //function() { this.normalPattern(); }
      this.config.show_pattern = false
    }
    this.lights_off = true
    this.buttons = []
    this.moves = []
    if (this.config.audio_engine == null) {
      this.load_script('puzzleaudio',()=> {
        this.audio_engine = new Puzzleaudio()
        this.game.scene.add('audio_engine', this.audio_engine, true, {} );
        this.game.audio_engine = this.audio_engine
      })
    }
  }

  preload() {
    this.load.setPath(this.config.image_path);
    if (this.config.background_image) {
        this.load.image('background', this.config.background_image);
    }

    // Optional: Load assets if using custom sprites
    if (this.config.light_on_image) {
      if (this.config.tile_swap) {
        this.load.image('light_off', this.config.light_on_image);
        this.load.image('light_on', this.config.light_off_image);
      } else {
        this.load.image('light_on', this.config.light_on_image);
        this.load.image('light_off', this.config.light_off_image);      
      }
    }

    this.load.setPath(this.config.audio_path);
    Object.entries(this.config.sounds).forEach(([key, value]) => {
      if (value) { 
        this.load.audio(`lightsout_${key}_snd`,value);
        console.log(`lightsout_${key}_snd`,value)
      }
    })
  }

  create() {
    this.game.plugins = this.plugins
    Object.entries(this.config.sounds).forEach(([key, value]) => { 
      if (value) { 
        this.audio_keys.push(key)
        this.audio_engine.add_sound(`lightsout_${key}_snd`,this.key)
      }
    })

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

        tile.on('pointerdown', () => {
          this.tileClick(x,y)
          this.config.on_move_audio()
        });

        this.tiles[y][x] = tile;
      }
      this.source_grid[y] = this.grid[y].slice();
    }

    // Add win text (hidden initially)
    this.winText = this.add.text(this.board_width/2, this.board_height/2, 'You win!', {
      fontSize: '30px',
      fill: '#00ff00',
      backgroundColor: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5,0.5);
    this.winText.setVisible(false);

    if (this.config.enable_restart) {
      this.addButton(
        this.config.tile_spacing, 
        this.board_height - 40, 8, 'restart', 'RESTART',
        () => this.resetBoard()
      );
    }

    if (this.config.enable_restart) {
      this.addButton(
        this.config.tile_spacing + (this.board_width/3), 
        this.board_height - 40, 8, 'reroll', 'RE-ROLL',
        () => this.createBoard(this.config.move_count)
      );
    }

    if (this.config.enable_restart) {
      this.addButton(
        this.config.tile_spacing + (this.board_width/3) * 2, 
        this.board_height - 40, 8, 'clear', 'CLEAR',
        () => this.clearBoard()
      );
    }

    this.createBoard(this.config.move_count);
  }

  disableLights() {
    for (let y = 0; y < this.config.grid_size; y++) {
      for (let x = 0; x < this.config.grid_size; x++) {
        this.tiles[y][x].disableInteractive()
      }
    }
  }

  enableLights() {
    for (let y = 0; y < this.config.grid_size; y++) {
      for (let x = 0; x < this.config.grid_size; x++) {
        this.tiles[y][x].setInteractive();
      }
    }
  }

  addButton(x,y,pad,name,text,ondown=function(){}) {
    // this.add.roundRectangle(0, 0, 300, 150, 20, 0x222222);
    this.buttons[name] = this.add.text(
      x, 
      y, 
      text, {
        fontSize: '18px',
        fontStyle: 'bold',
        fill: '#ddaa00',
        backgroundColor: '#000000',
        //stroke: '#ddaa00',
        //strokeThickness: 2,
        padding: { x: pad, y: pad/2 }
      }
    ).setOrigin(0,0).setInteractive().setAlpha(0.95);
    this.buttons[name].preFX.addGlow(0Xddaa00, 8, 0, false);
    this.buttons[name].on('pointerdown', ondown);
  }

  solve(timems=1000,solve_pos=0) {
    this.solve_pos = solve_pos

    if (!!this.moves[this.solve_pos]) {
      this.toggleTile(this.moves[this.solve_pos][0]-1,this.moves[this.solve_pos][1]-1)
      solve_pos = this.solve_pos = this.solve_pos + 1
      setTimeout(function() { 
        this.solve(timems,this.solve_pos) 
      }.bind(this),timems)
    } else {
      this.checkWin()
      this.solve_pos = 0
    }
  }

  createBoard(move_count=10) {
    this.disableLights()
    this.winText.setVisible(false);
    this.moves = []
    this.clearBoard()

    for (let y = 0; y < this.config.grid_size; y++) {
      for (let x = 0; x < this.config.grid_size; x++) {
        this.source_grid[y][x] = false; 
        this.patterns[y][x] = this.config.pattern_action()
        this.overlay[y][x].clear()
        if (this.config.show_pattern) {
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
      last_x = x 
      last_y = y 
      this.moves.unshift([x+1,y+1])
      this.toggleTile(x, y, true)
    }
    this.enableLights()
    this.winnable = true
    this.config.on_start_audio()
  }

  tileClick(x,y) {
    this.toggleTile(x,y)
    this.checkWin();
  }

  simpleRandomPatterns() {
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

  complexRandomPatterns() {
    // Random pattern: which neighbors to flip (dx, dy)
    const dirs = [
        { dx: 0, dy: 0 }, // self
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
        { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
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
    let size = 15 - this.config.grid_size
    const neighbors = this.patterns[y][x]

    for (const { dx, dy } of neighbors) {
      let txp = tx + (dx * (this.tile_size/2 - size/2) - size/2) // this.tile_spacing
      let typ = ty + (dy * (this.tile_size/2 - size/2) - size/2) //+ this.tile_spacing
      this.overlay[y][x].fillStyle(0xeeeeee, 0.75).fillRect(
         txp, typ, size, size,
      ).lineStyle(1, 0x000000, 0.6).strokeRect(txp,typ,size,size).setDepth(depth) //.setStrokeStyle(1, 0xaaaaaa);
    }

  }

  checkWin() {
    if (this.winnable == true) {
      const allOff = this.grid.every(row => row.every(light => !light));
      if (allOff) {
        this.disableLights()
        this.config.on_win_audio()
        this.config.win_action(this)
      }
    }
  }

  updateTile(x,y,over=true) {
    if (this.tiles[y][x].type === 'Image') {
      this.tiles[y][x].setTexture(this.grid[y][x] ? 'light_on' : 'light_off');
    } else {
      let on = (this.config.tile_swap) ? 0x333333 : 0xffff00
      let off = (this.config.tile_swap) ? 0xffff00 : 0x333333      
      this.tiles[y][x].setFillStyle(this.grid[y][x] ? on : off);
    }
    if (over && this.config.type == 'flip') {
      this.setOverlay(x,y)
    }
  }

  resetBoard() {
    this.winText.setVisible(false);
    for (let y = 0; y < this.config.grid_size; y++) {
      for (let x = 0; x < this.config.grid_size; x++) {
        this.grid[y][x] = this.source_grid[y][x]; 
        this.updateTile(x,y)
      }
    }
    this.enableLights()
    this.winnable = true
    this.config.on_start_audio()
  }

  clearBoard() {
    for (let y = 0; y < this.config.grid_size; y++) {
      for (let x = 0; x < this.config.grid_size; x++) {
        this.grid[y][x] = false; 
        this.updateTile(x,y,false)
      }
    }
    this.disableLights()
    this.winnable = false
    this.winText.setVisible(false);
  }

  load_script(name,onload=null) {
    if (this.config.preload) { window.lightsout_loaded[name] = true; }
    // else {
      // if (!window.lightsout_loaded[name]) {
      //   this.load_script(name, ()=>{
           this.insert_script(name,onload)
      //   })
      // }
//      else { this.insert_script(name,onload) }
    // }
  }

  insert_script(name,onload=()=>{ }) {
    let min = ''
    if (this.config.minimized_scripts) {
      min = '.min'
    }
    if (window.lightsout_loaded[name]) {
      onload.call(this)
    } else {
      let script = document.createElement('script');
      script.id = `${name}.js`;
      script.src = `${this.config.modules_path}/${name}${min}.js`;
      document.body.append(script);
      script.onload = ()=> { 
        window.lightsout_loaded[name] = true; 
        onload.call(this);  
        this.config.debug && console.log(`${name} loaded.`); 
      }
    }
  }
  play_sound(key,options={}) {
    this.audio_engine.play_sound(`${this.key}_${key}_snd`,options)
  }
  play_sound_unqiue(key,options={}) {
    this.audio_engine.play_sound_unique(`${this.key}_${key}_snd`,options)
  }

  stop_sounds() {
    this.audio_engine.stop_bank(this.key)
  }


}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function random_item(collection) {
    if (Array.isArray(collection)) {
      return collection[Math.floor(Math.random()*collection.length)];
    } else {
      let oe = Object.entries(collection)
      return oe[Math.floor(Math.random()*oe.length)][1];      
    }
}
