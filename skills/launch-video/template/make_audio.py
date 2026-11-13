"""Original soundtrack for the RunwayX demo: synthesised music bed plus UI sound effects.

Reads out/sfx.json (written by record.cjs) and writes out/audio.wav (44.1 kHz stereo).
Everything is generated here, so there are no licensing issues.
"""
import json
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(3)
cues = json.load(open("out/sfx.json"))
DUR = cues["duration"] + 0.5
N = int(DUR * SR)

BPM = 122.29  # four bars land exactly on the MacBook reveal (7.85 s)
BEAT = 60 / BPM
BAR = 4 * BEAT
DROP = 4 * BAR  # 7.85 s
OUTRO = next((c["t"] for c in cues["sfx"] if c["type"] == "logo"), DUR - 7) - 0.6  # outro card appears
LAST_BAR = int(np.ceil(OUTRO / BAR)) * BAR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    e = np.ones(n) * s
    e[:a] = np.linspace(0, 1, a, endpoint=False)
    e[a:a + d] = np.linspace(1, s, len(e[a:a + d]), endpoint=False)
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    gl, gr = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    L[i:i + len(sig)] += sig * gain * gl * 1.414
    R[i:i + len(sig)] += sig * gain * gr * 1.414


# ---------------- music ----------------
# D major: Dmaj7 - Bm9 - Gmaj9 - Asus2, two bars each
CHORDS = [  # (bass root, voicing)
    (50, [62, 66, 69, 73]),  # Dmaj7
    (47, [61, 62, 66, 69]),  # Bm(add9)
    (43, [62, 66, 69, 71]),  # Gmaj9
    (45, [64, 69, 71, 73]),  # Asus2
]


def pad_voice(f, n):
    t = np.arange(n) / SR
    vib = 1 + 0.0025 * np.sin(2 * np.pi * 4.8 * t)
    s = np.zeros(n)
    for det in (-0.08, 0.0, 0.07):
        ph = 2 * np.pi * f * (1 + det / 12) * np.cumsum(vib) / SR
        for h in range(1, 7):
            s += np.sin(h * ph) / (h ** 1.4)
    return s / 6


def pluck(f, n_sec=0.5):
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 7.5) * np.minimum(1, t * 400)


n_bars = int(LAST_BAR / BAR)
for b in range(0, n_bars + 2, 2):
    t0 = b * BAR
    if t0 > LAST_BAR + 0.01:
        break
    root, notes = CHORDS[(b // 2) % 4]
    final = t0 >= LAST_BAR - 0.01
    length = (5.5 if final else 2 * BAR + 0.6)
    n = int(length * SR)
    e = env_adsr(n, 0.5, 0.6, 0.85, 1.6 if final else 0.6)
    pad = sum(pad_voice(midi(m - 12), n) for m in notes)
    pad = lp(pad, 1900 if t0 >= DROP else 1100) * e
    add(pad, t0, 0.07, -0.25)
    add(pad, t0 + 0.012, 0.07, 0.25)
    # bass
    if t0 >= DROP and not final:
        for k, (off, ln) in enumerate([(0, 1.5), (1.5, 1), (2.5, 1.5), (4, 1.5), (5.5, 1), (6.5, 1.5)]):
            nb = int(ln * BEAT * SR)
            tt = np.arange(nb) / SR
            f = midi(root - 12 if k % 3 else root - 12)
            s = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * env_adsr(nb, 0.01, 0.15, 0.7, 0.08)
            add(s, t0 + off * BEAT, 0.20)
    if final:
        nb = int(4.5 * SR)
        tt = np.arange(nb) / SR
        add(np.sin(2 * np.pi * midi(root - 12) * tt) * env_adsr(nb, 0.02, 0.4, 0.6, 2.5), t0, 0.2)
    # arpeggio, eighth notes, with a ping-pong echo
    if not final:
        arp = [notes[i % len(notes)] + (12 if (i // 4) % 2 else 0) for i in range(16)]
        for i, m in enumerate(arp):
            tt = t0 + i * BEAT / 2
            if tt > LAST_BAR:
                break
            g = 0.075 if t0 >= DROP else 0.06
            p = pluck(midi(m))
            add(p, tt, g, -0.3 if i % 2 else 0.3)
            add(lp(p, 2500), tt + 0.75 * BEAT, g * 0.35, 0.6 if i % 2 else -0.6)

# drums from the drop to the outro
def kick():
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = 48 + 90 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + 0.25 * np.exp(-t * 300) * rng.normal(0, 1, n)


def snare():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    return bp(rng.normal(0, 1, n), 1200, 6500) * np.exp(-t * 22) * 0.8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4


def hat(open_=False):
    n = int((0.16 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), 7500) * np.exp(-t * (18 if open_ else 70))


K, S = kick(), snare()
beat = DROP
while beat < LAST_BAR - 0.01:
    i = round((beat - DROP) / BEAT)
    in_bar = i % 4
    first_bars = beat < DROP + 2 * BAR  # gentle build: kick only
    add(K, beat, 0.42 if in_bar in (0, 2) else 0.0)
    if not first_bars:
        if in_bar in (1, 3):
            add(S, beat, 0.16, 0.05)
        add(hat(), beat + BEAT / 2, 0.06, 0.35)
        add(hat(), beat, 0.035, -0.35)
        if in_bar == 3:
            add(hat(True), beat + BEAT * 0.75, 0.04, 0.2)
    beat += BEAT

# riser into the drop and a soft impact on it
n = int(2.0 * SR)
t = np.arange(n) / SR
noise = rng.normal(0, 1, n)
riser = np.concatenate([bp(noise[k:k + 2205], 300 + 5000 * (k / n) ** 2, 800 + 9000 * (k / n) ** 2) for k in range(0, n, 2205)])[:n]
add(riser * (t / 2.0) ** 2, DROP - 2.0, 0.10)
nb = int(2.5 * SR)
tt = np.arange(nb) / SR
boom = lp(rng.normal(0, 1, nb), 400) * np.exp(-tt * 3) * 0.6 + np.sin(2 * np.pi * 45 * tt) * np.exp(-tt * 2.2)
add(boom, DROP, 0.22)

# ---------------- sound effects ----------------
def s_click():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 160) * 0.6 + hp(rng.normal(0, 1, n), 2500) * np.exp(-t * 500) * 0.5)


def s_key():
    n = int(0.04 * SR)
    t = np.arange(n) / SR
    f = rng.uniform(1500, 2300)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 220) * 0.4 + bp(rng.normal(0, 1, n), 1500, 6000) * np.exp(-t * 400) * 0.6


def s_whoosh(d=0.9):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = rng.normal(0, 1, n)
    out = np.zeros(n)
    hop = 1024
    for k in range(0, n, hop):
        c = 400 + 3800 * np.sin(np.pi * k / n)
        seg = x[max(0, k - 2048):k + hop]
        out[k:k + hop] = bp(seg, c * 0.6, min(c * 1.6, 18000))[-len(out[k:k + hop]):]
    return out * np.sin(np.pi * t / d) ** 2


def s_pop():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 320 + 500 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)


def bell(freqs, d=1.6, decay=3.5):
    n = int(d * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for i, f in enumerate(freqs):
        s += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t * decay) * (0.8 ** i)
    return s * np.minimum(1, t * 500)


def s_shutter():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    x = bp(rng.normal(0, 1, n), 900, 7000)
    return x * (np.exp(-t * 90) + 0.7 * np.exp(-np.maximum(0, t - 0.07) * 90) * (t > 0.07))


def s_sparkle():
    out = np.zeros(int(0.9 * SR))
    for i, m in enumerate([86, 90, 93, 98, 102]):
        b = bell([midi(m)], 0.6, 7)
        k = int(i * 0.06 * SR)
        out[k:k + len(b)] += b[: len(out) - k] * 0.5
    return out


FX = {
    "click": (s_click, 0.30),
    "key": (s_key, 0.12),
    "whoosh": (s_whoosh, 0.20),
    "pop": (s_pop, 0.30),
    "chime": (lambda: bell([midi(81), midi(88)], 1.6), 0.14),
    "shutter": (s_shutter, 0.40),
    "sparkle": (s_sparkle, 0.12),
    "logo": (lambda: bell([midi(74), midi(78), midi(81), midi(86)], 3.0, 1.6), 0.13),
}
for c in cues["sfx"]:
    fn, g = FX[c["type"]]
    add(fn(), c["t"], g, rng.uniform(-0.15, 0.15))

# ---------------- master ----------------
mix = np.stack([L, R], 1)
fade_in = np.minimum(1, np.arange(N) / (0.4 * SR))
fade_out = np.clip((DUR - np.arange(N) / SR) / 2.2, 0, 1)
mix *= (fade_in * fade_out)[:, None]
mix = hp(mix.T, 30).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25) * 0.89
with wave.open("out/audio.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("out/audio.wav", round(DUR, 2), "s, peak", round(float(peak), 3))
