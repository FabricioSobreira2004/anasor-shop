#!/usr/bin/env python
# Verificação v5 (Rodada 12) — mesma ideia de verificar-asr-v4.py:
# transcreve CADA trecho (recortado do vídeo final, pelos tempos reais
# do sidecar) com faster-whisper e compara (sobreposição de palavras,
# normalizado) com o roteiro; confere clipping por trecho; e calcula a
# ocupação de voz (tempo de fala / tempo total antes do cartão final).
#
#   python verificar-v5.py <json> <video> <trail_fecho_segundos>
import json
import sys
import unicodedata
import wave
from subprocess import run

import numpy as np
from faster_whisper import WhisperModel

FFMPEG = "ffmpeg"


def normalizar(txt):
    txt = unicodedata.normalize("NFKD", txt.lower())
    txt = "".join(c for c in txt if not unicodedata.combining(c))
    return set(w.strip(".,!?;:-—") for w in txt.split() if w.strip(".,!?;:-—"))


def ler_wav(caminho):
    with wave.open(caminho, "rb") as w:
        n = w.getnframes()
        raw = w.readframes(n)
        dados = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return dados


def main():
    json_path = sys.argv[1]
    video_path = sys.argv[2]
    trail_fecho = float(sys.argv[3]) if len(sys.argv) > 3 else 3.0
    with open(json_path, "r", encoding="utf-8") as f:
        dados = json.load(f)

    model = WhisperModel("base", device="cpu", compute_type="int8")
    total = 0
    ok = 0
    tempo_fala = 0.0
    for i, fr in enumerate(dados["frases"]):
        ini = fr["inicioAbs"]
        dur = fr["duracao"]
        tempo_fala += dur
        recorte = f"E:/projetos/_tmp/narracao-v5/verif-{i}.wav"
        run([
            FFMPEG, "-y", "-ss", str(max(0, ini - 0.1)), "-t", str(dur + 0.2),
            "-i", video_path, "-ar", "16000", "-ac", "1", recorte,
        ], check=True, capture_output=True)
        audio = ler_wav(recorte)
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

    duracao_total = dados["duracaoTotalS"]
    antes_do_fecho = max(0.001, duracao_total - trail_fecho)
    ocupacao = (tempo_fala / antes_do_fecho) * 100
    print(f"\n{ok}/{total} trechos com cobertura >=40% de palavras (voz sintética erra nomes próprios — ver texto ouvido pra conferir à mão)")
    print(f"Ocupação de voz antes do cartão final: {tempo_fala:.1f}s / {antes_do_fecho:.1f}s = {ocupacao:.1f}% (meta >=90%)")


if __name__ == "__main__":
    main()
