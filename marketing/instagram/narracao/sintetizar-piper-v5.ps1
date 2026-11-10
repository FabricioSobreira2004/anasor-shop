# Síntese Piper v5 (Rodada 12) — mesma ideia de sintetizar-piper.ps1,
# mas com NoiseScale e SentenceSilence como parâmetros DE VERDADE (a
# v4 fixava NoiseWScale=0 pra ter duração determinística, já que a
# legenda estimava o tempo por PROPORÇÃO DE CARACTERE; a v5 mede o
# tempo de cada palavra por ASR DEPOIS da síntese — não depende mais
# de reproduzir a mesma duração 2x, então pode usar NoiseWScale>0 pra
# dar variação natural de ritmo à fala, pedido explícito desta rodada
# pra combater o efeito "robótico").
#
# Texto vem de um ARQUIVO (nunca da linha de comando) — mesmo motivo
# de sempre: nunca depender de escapar aspas/acentos no shell.
param(
  [Parameter(Mandatory = $true)][string]$TextoArquivo,
  [Parameter(Mandatory = $true)][string]$SaidaWav,
  [Parameter(Mandatory = $true)][string]$Modelo,
  [double]$LengthScale = 0.9,
  [double]$NoiseScale = 0.667,
  [double]$NoiseWScale = 0.8,
  [double]$SentenceSilence = 0.15
)

if (-not (Test-Path -LiteralPath $Modelo)) {
  Write-Error "Modelo Piper não encontrado: $Modelo (rode: python -m piper.download_voices --download-dir <pasta> <voz>)"
  exit 1
}

Get-Content -LiteralPath $TextoArquivo -Raw -Encoding UTF8 | python -m piper -m $Modelo -f $SaidaWav --length-scale $LengthScale --noise-scale $NoiseScale --noise-w-scale $NoiseWScale --sentence-silence $SentenceSilence
if ($LASTEXITCODE -ne 0) {
  Write-Error "Piper falhou (código $LASTEXITCODE)"
  exit $LASTEXITCODE
}

Write-Output "OK"
