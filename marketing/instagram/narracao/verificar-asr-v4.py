#!/usr/bin/env python
# Verificação v4 (Rodada 11) — transcreve CADA frase (recortada do
# vídeo final, pelos tempos reais do sidecar) com faster-whisper e
# compara (sobreposição de palavras, normalizado) com o roteiro.
# Também confere clipping (pico >= 0.99) por frase.
import json
import subprocess
import sys
import unicodedata
import wave

import numpy as np
from faster_whisper import WhisperModel

FFMPEG = "ffmpeg"


def normalizar(txt):
    txt = unicodedata.normalize("NFKD", txt.lower())
    txt = "".join(c for c in txt if not unicodedata.combining(c))
    return set(w.strip(".,!?;:-—") for w in txt.split() if w.strip(".,!?;:-—"))


def ler_wav(caminho):
    with wave.open(caminho, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
        dados = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return dados, sr


def main():
    json_path = sys.argv[1]
    video_path = sys.argv[2]
    with open(json_path, "r", encoding="utf-8") as f:
        dados = json.load(f)

    model = WhisperModel("base", device="cpu", compute_type="int8")
    total = 0
    ok = 0
    for i, fr in enumerate(dados["frases"]):
        ini = fr["inicioAbs"]
        dur = fr["duracao"]
        recorte = f"E:/projetos/_tmp/narracao/asr-v4-{i}.wav"
        subprocess.run([
            FFMPEG, "-y", "-ss", str(max(0, ini - 0.1)), "-t", str(dur + 0.2),
            "-i", video_path, "-ar", "16000", "-ac", "1", recorte,
        ], check=True, capture_output=True)
        audio, sr = ler_wav(recorte)
        pico = float(np.max(np.abs(audio))) if len(audio) else 0.0
        segs, _ = model.transcribe(audio, language="pt", beam_size=5)
        texto_transcrito = " ".join(s.text for s in segs)
        esperado = normalizar(fr["texto"])
        obtido = normalizar(texto_transcrito)
        inter = esperado & obtido
        cobertura = len(inter) / max(1, len(esperado))
        total += 1
        status = "OK" if cobertura >= 0.4 else "REVISAR"
        if cobertura >= 0.4:
            ok += 1
        clip = "CLIPPING!" if pico >= 0.99 else ""
        print(f"[{status}] cena={fr['cena']:16s} cobertura={cobertura*100:5.1f}% pico={pico:.3f} {clip}")
        print(f"         esperado: {fr['texto']}")
        print(f"         ouvido:   {texto_transcrito.strip()}")
    print(f"\n{ok}/{total} frases com cobertura >=40% de palavras (tiny/base erra nomes próprios e voz sintética — ver texto ouvido pra conferir à mão)")


if __name__ == "__main__":
    main()
