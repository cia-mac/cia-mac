#!/usr/bin/env python3
"""Isolate vocals from a song using Demucs (htdemucs), saving WAVs via soundfile.
Usage: separate.py INPUT_AUDIO OUTPUT_DIR
Writes: <stem>-vocal.wav and <stem>-instrumental.wav
"""
import sys, pathlib
import torch
import soundfile as sf
from demucs.pretrained import get_model
from demucs.apply import apply_model
from demucs.audio import AudioFile, convert_audio

def main():
    inp = pathlib.Path(sys.argv[1])
    outdir = pathlib.Path(sys.argv[2]); outdir.mkdir(parents=True, exist_ok=True)
    stem = inp.stem.replace(" ", "_")

    model = get_model("htdemucs")
    model.eval()
    sr = model.samplerate
    ch = model.audio_channels

    # Read via demucs' ffmpeg path (works), resample/convert to model's expectations
    wav = AudioFile(inp).read(streams=0, samplerate=sr, channels=ch)
    ref = wav.mean(0)
    wav = (wav - ref.mean()) / (ref.std() + 1e-8)

    with torch.no_grad():
        sources = apply_model(model, wav[None], device="cpu", progress=True,
                              split=True, overlap=0.25)[0]
    sources = sources * ref.std() + ref.mean()

    names = model.sources  # e.g. ['drums','bass','other','vocals']
    idx = {n: i for i, n in enumerate(names)}
    vocals = sources[idx["vocals"]]
    instrumental = sum(sources[i] for n, i in idx.items() if n != "vocals")

    voc_path = outdir / f"{stem}-vocal.wav"
    inst_path = outdir / f"{stem}-instrumental.wav"
    # soundfile wants (frames, channels)
    sf.write(str(voc_path), vocals.t().cpu().numpy(), sr, subtype="PCM_16")
    sf.write(str(inst_path), instrumental.t().cpu().numpy(), sr, subtype="PCM_16")
    print(f"OK vocals -> {voc_path}")
    print(f"OK instrumental -> {inst_path}")
    print(f"samplerate={sr} channels={ch} stems={names}")

if __name__ == "__main__":
    main()
