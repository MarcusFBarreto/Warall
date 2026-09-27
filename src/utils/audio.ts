/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private noiseBuffer: AudioBuffer | null = null;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generates or returns a reusable 1-second white noise buffer for realistic explosions & crunch
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const bufferSize = ctx.sampleRate * 1.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  // Tactile click when selecting territory or placing troops
  playPlaceArmy() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sub boot step thump
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);

    // Subtle military equipment click
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.05);
  }

  // Heavy Artillery Cannon Shot / Tank Main Gun Explosion
  playCannonShot(intensity = 1.0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Initial High-Pressure Crack (muzzle brake blast)
    const crackNoise = ctx.createBufferSource();
    crackNoise.buffer = this.getNoiseBuffer(ctx);
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(2200, now);
    crackFilter.Q.setValueAtTime(3, now);
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.4 * intensity, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    crackNoise.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(ctx.destination);
    crackNoise.start(now);
    crackNoise.stop(now + 0.07);

    // 2. Sub-bass concussive blast (140Hz -> 30Hz boom)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.6 * intensity, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.46);

    // 3. Low-frequency explosion rumble (noise through sweeping lowpass)
    const rumbleNoise = ctx.createBufferSource();
    rumbleNoise.buffer = this.getNoiseBuffer(ctx);
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(550, now);
    rumbleFilter.frequency.exponentialRampToValueAtTime(70, now + 0.5);
    rumbleFilter.Q.setValueAtTime(2.5, now);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.45 * intensity, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    rumbleNoise.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumbleNoise.start(now);
    rumbleNoise.stop(now + 0.56);
  }

  // Rapid Machine Gun Bursts & Bullet Ricochets
  playMachineGun(rounds = 5) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    for (let i = 0; i < rounds; i++) {
      const shotTime = now + i * 0.062;

      // Gunshot noise burst
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 + (i % 2) * 300, shotTime);
      filter.Q.setValueAtTime(4, shotTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, shotTime);
      gain.gain.exponentialRampToValueAtTime(0.001, shotTime + 0.038);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(shotTime);
      noise.stop(shotTime + 0.04);

      // Sharp metallic breech snap
      const snap = ctx.createOscillator();
      snap.type = 'triangle';
      snap.frequency.setValueAtTime(320, shotTime);
      snap.frequency.exponentialRampToValueAtTime(80, shotTime + 0.03);
      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.18, shotTime);
      snapGain.gain.exponentialRampToValueAtTime(0.001, shotTime + 0.03);

      snap.connect(snapGain);
      snapGain.connect(ctx.destination);
      snap.start(shotTime);
      snap.stop(shotTime + 0.035);
    }
  }

  // Full Battlefield War Combat Symphony (used during combat resolution)
  playWarCombat(attackerLosses = 1, defenderLosses = 1, conquered = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    // 1. Initial artillery/tank cannon blast
    this.playCannonShot(conquered ? 1.0 : 0.85);

    // 2. Machine gun burst response after 120ms
    setTimeout(() => {
      const rounds = conquered ? 6 : Math.max(3, (attackerLosses + defenderLosses) * 2);
      this.playMachineGun(rounds);
    }, 110);

    // 3. Bullet ricochet sound if clash was heavy
    if (defenderLosses > 0 || attackerLosses > 0) {
      setTimeout(() => {
        if (!this.getContext()) return;
        const c = this.getContext()!;
        const t = c.currentTime;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, t);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.18);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.19);
      }, 240);
    }
  }

  // Classic battle clash fallback (maintained for backwards compatibility)
  playBattleClash() {
    this.playWarCombat(1, 1, false);
  }

  // Tank Caterpillar Treads: Diesel Engine Rumble + Metallic Track Clanking
  playTankTreads(duration = 1.0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Diesel engine low-frequency motor rumbling (modulating 54Hz & 68Hz)
    const motor1 = ctx.createOscillator();
    const motor2 = ctx.createOscillator();
    motor1.type = 'sawtooth';
    motor2.type = 'triangle';
    motor1.frequency.setValueAtTime(52, now);
    motor2.frequency.setValueAtTime(64, now);

    // Subtle pitch throttle revving
    motor1.frequency.linearRampToValueAtTime(62, now + duration * 0.4);
    motor1.frequency.linearRampToValueAtTime(48, now + duration);

    const motorFilter = ctx.createBiquadFilter();
    motorFilter.type = 'lowpass';
    motorFilter.frequency.setValueAtTime(140, now);

    const motorGain = ctx.createGain();
    motorGain.gain.setValueAtTime(0.01, now);
    motorGain.gain.linearRampToValueAtTime(0.28, now + 0.12);
    motorGain.gain.setValueAtTime(0.28, now + duration - 0.2);
    motorGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    motor1.connect(motorFilter);
    motor2.connect(motorFilter);
    motorFilter.connect(motorGain);
    motorGain.connect(ctx.destination);

    motor1.start(now);
    motor2.start(now);
    motor1.stop(now + duration + 0.05);
    motor2.stop(now + duration + 0.05);

    // 2. Rolling Metallic Caterpillar Track Clank & Squeaks
    const trackClicks = Math.floor(duration * 9); // ~9 track links rolling per second
    for (let i = 0; i < trackClicks; i++) {
      const clickTime = now + (i * 0.11) + (Math.random() * 0.02);

      // High metallic clink of steel track link
      const clink = ctx.createOscillator();
      clink.type = 'square';
      clink.frequency.setValueAtTime(1800 + Math.random() * 500, clickTime);
      clink.frequency.exponentialRampToValueAtTime(800, clickTime + 0.025);

      const clinkGain = ctx.createGain();
      clinkGain.gain.setValueAtTime(0.08, clickTime);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.025);

      clink.connect(clinkGain);
      clinkGain.connect(ctx.destination);
      clink.start(clickTime);
      clink.stop(clickTime + 0.03);

      // Grinding track friction noise
      const grind = ctx.createBufferSource();
      grind.buffer = this.getNoiseBuffer(ctx);
      const grindFilter = ctx.createBiquadFilter();
      grindFilter.type = 'bandpass';
      grindFilter.frequency.setValueAtTime(950, clickTime);
      grindFilter.Q.setValueAtTime(3, clickTime);

      const grindGain = ctx.createGain();
      grindGain.gain.setValueAtTime(0.12, clickTime);
      grindGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.05);

      grind.connect(grindFilter);
      grindFilter.connect(grindGain);
      grindGain.connect(ctx.destination);
      grind.start(clickTime);
      grind.stop(clickTime + 0.05);
    }
  }

  // Cadenced Military Marching Boots: Rhythmic Footsteps on Soil/Gravel
  playTroopMarch(steps = 4) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const stepInterval = 0.15; // 130 BPM military cadence

    for (let i = 0; i < steps; i++) {
      const stepTime = now + i * stepInterval;

      // 1. Boot Heel Thud
      const thud = ctx.createOscillator();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(95, stepTime);
      thud.frequency.exponentialRampToValueAtTime(42, stepTime + 0.07);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.24, stepTime);
      thudGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.07);

      thud.connect(thudGain);
      thudGain.connect(ctx.destination);
      thud.start(stepTime);
      thud.stop(stepTime + 0.08);

      // 2. Gravel / Terrain Scuff
      const scuff = ctx.createBufferSource();
      scuff.buffer = this.getNoiseBuffer(ctx);
      const scuffFilter = ctx.createBiquadFilter();
      scuffFilter.type = 'bandpass';
      scuffFilter.frequency.setValueAtTime(650, stepTime);
      scuffFilter.Q.setValueAtTime(2, stepTime);

      const scuffGain = ctx.createGain();
      scuffGain.gain.setValueAtTime(0.14, stepTime);
      scuffGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.06);

      scuff.connect(scuffFilter);
      scuffFilter.connect(scuffGain);
      scuffGain.connect(ctx.destination);
      scuff.start(stepTime);
      scuff.stop(stepTime + 0.065);

      // 3. Subtle gear rattle on odd steps
      if (i % 2 === 1) {
        const rattle = ctx.createOscillator();
        rattle.type = 'sine';
        rattle.frequency.setValueAtTime(1400, stepTime + 0.02);
        const rattleGain = ctx.createGain();
        rattleGain.gain.setValueAtTime(0.06, stepTime + 0.02);
        rattleGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.05);

        rattle.connect(rattleGain);
        rattleGain.connect(ctx.destination);
        rattle.start(stepTime + 0.02);
        rattle.stop(stepTime + 0.055);
      }
    }
  }

  // Combined Military Movement: Infantry March Cadence + Heavy Mechanized Tank Treads
  playTroopMovement(armiesCount = 2) {
    if (armiesCount <= 2) {
      // Light troop movement: crisp infantry cadence
      this.playTroopMarch(4);
    } else {
      // Heavy army / mechanized brigade: marching boots + roaring diesel tank caterpillar tracks!
      this.playTroopMarch(5);
      this.playTankTreads(0.95);
    }
  }

  // Dice tumbling effect (multiple micro clicks simulating dice hitting wood tray)
  playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;

    for (let i = 0; i < 7; i++) {
      const time = ctx.currentTime + i * 0.04 + Math.random() * 0.02;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(400 + Math.random() * 350, time);
      osc.frequency.exponentialRampToValueAtTime(180, time + 0.03);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.035);
    }
  }

  // Territory Conquered brass fanfare with triumphant cannon salute
  playConquer() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Concussive victory salute blast
    this.playCannonShot(0.7);

    const notes = [330, 440, 554, 659];
    notes.forEach((freq, idx) => {
      const time = ctx.currentTime + 0.12 + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.22);
    });
  }

  // Card Draw / Swap card swoosh
  playCard() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  }

  // Victory Fanfare
  playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Grand salute cannons
    this.playCannonShot(1.0);
    setTimeout(() => this.playCannonShot(0.85), 350);

    const melody = [
      { f: 523.25, d: 0.18 }, // C5
      { f: 659.25, d: 0.18 }, // E5
      { f: 783.99, d: 0.18 }, // G5
      { f: 1046.5, d: 0.45 }  // C6
    ];

    let t = ctx.currentTime + 0.2;
    melody.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.05);

      t += note.d * 0.9;
    });
  }

  // Turn alert chime (when human turn arrives)
  playTurnNotification() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 659.25];
    notes.forEach((freq, idx) => {
      const time = ctx.currentTime + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.26);
    });
  }
}

export const sounds = new SoundEngine();
