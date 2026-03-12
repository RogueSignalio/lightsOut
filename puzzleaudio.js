class Puzzleaudio extends Phaser.Scene {
  constructor () {
    super('puzzle_sound')
  }

  init() {
    this.bank_sounds = {}
    this.sounds = {}
    this.volume_offset = {}
    this.volume_master = 0.5
    this.counter = 0
  }

  add_sound(key,bank=null,options={}) {
    //console.log('reg audio: ' + key)
    if (this.sounds[key]) { return }

    if (!this.bank_sounds[bank]) {
      this.bank_sounds[bank] = {}
    }

    let sound = this.sound.add(key)
    this.bank_sounds[bank][key] = { sound: sound, options: options }
    this.sounds[key] = { sound: sound, options: options }
  }

  play_sound(key,options={}) {
    if (! this.sounds[key]) { return null }
    let a = this.sounds[key].sound
    if (!a) { return null }
    if (options.detune) {
      a.detune = getRndInteger(-1 * options.detune,options.detune)
    }
    if (options.loop) {
      a.loop = options.loop
    }
    a.play();
  }

  play_sound_unique(key,options={}) {
    if (! this.sounds[key]) { return null }
    if (options.detune) {
      options.detune = getRndInteger(-1 * options.detune, options.detune)
    }    
    this.sound.play(key,options)
  }

  stop_sound(key) {
    if (!this.sounds[key]) { return }
    let a = this.sounds[key].sound
//    this.sound.stop(key)
    a.stop();
  }

  stop_bank(bank) {
    if (!this.bank_sounds[bank]) { return }
    Object.entries(this.bank_sounds[bank]).forEach(([key, value]) => { 
      this.stop_sound(key)
    })
  }

  stop_all() {
    Object.entries(this.sounds[bank]).forEach(([key, value]) => { 
      this.stop_sound(key)
    })
  }

  // Volume related methods
  set_volume(vol,bank=null) {
    if (vol && vol < 0) { vol = 0 }
    else if (vol && vol > 1) { vol = 1 }

    if (vol >= 0) { this.engine.sound.volume = this.volume_master = vol }
    return this.engine.sound.volume; 
    //       this.volume_master = v
    // this.game.setVolume(this.volume_master)
  }

  muted() {
    return this.sound.mute
  }

  mute_toggle() {
    console.log(this.muted())
    if (this.muted()) {
      this.un_mute()
    } else {
      this.mute()
    }
  }
  mute() { this.sound.setMute(true); }
  un_mute() { this.sound.setMute(false); }

  // Unsupported calls.  Use OverPlay for these.
  mute_sound(key) { }
  random_sound(bank) { }
  jutebox_play() {}
  jutebox_add(k) {}
  jutebox_remove(k) {}
  jutebox_next() {}
  jutebox_prev() {}
  jutebox_default(k) {}
  background_music(k) {}

}
