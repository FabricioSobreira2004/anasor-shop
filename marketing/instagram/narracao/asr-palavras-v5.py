#!/usr/bin/env python
# Extrai os tempos de CADA PALAVRA de um .wav de um trecho (Rodada 12,
# narração v5, item 5 do pedido) via faster-whisper (word_timestamps=
# True) — substitui a estimativa por PROPORÇÃO DE CARACTERE da v4
# (legenda só "parecia" certa; agora vem da transcrição real da voz
# sintetizada). Mesmo contorno do PyAV já encontrado na v4
# (verificar-asr-v4.py): lê o .wav manualmente com o módulo `wave` +
# numpy, nunca passa o CAMINHO pro transcribe() (dava TypeError de
# versão). Precisa de 16kHz mono — resample feito ANTES em ffmpeg (não
# aqui), pra não duplicar lógica de áudio em 2 linguagens.
#
#   python asr-palavras-v5.py <entrada-16k-mono.wav> <saida.json>
import json
import sys
import wave

import numpy as np
from faster_whisper import WhisperModel


def ler_wav(caminho):
    with wave.open(caminho, "rb") as w:
        n = w.getnframes()
        raw = w.readframes(n)
        dados = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return dados


def main():
    entrada = sys.argv[1]
    saida = sys.argv[2]
    audio = ler_wav(entrada)
    model = WhisperModel("base", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, language="pt", beam_size=5, word_timestamps=True)
    palavras = []
    for seg in segs:
        if seg.words:
            for w in seg.words:
                palavras.append({"texto": w.word.strip(), "inicio": w.start, "fim": w.end})
    with open(saida, "w", encoding="utf-8") as f:
        json.dump({"palavras": palavras}, f, ensure_ascii=False, indent=2)
    print(f"OK — {len(palavras)} palavras")


if __name__ == "__main__":
    main()
