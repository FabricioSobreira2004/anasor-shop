# Sintetiza um texto em WAV usando o Piper TTS (voz neural, offline).
# Mesmo padrão de sintetizar-voz.ps1 (SAPI): texto vem de um ARQUIVO
# (nunca da linha de comando), pra nunca depender de escapar aspas ou
# acentos no shell.
#
# --noise-w-scale 0 (Rodada 7, ACHADO testando a Etapa 1 do pedido):
# o Piper (VITS) tem um preditor de duração ESTOCÁSTICO — com o
# padrão da CLI (~0.8), a MESMA frase/voz/ritmo sai com duração
# diferente a cada execução (testado: 22,65s a 23,73s pro mesmo texto
# de 85 palavras, variando só esse parâmetro). O pedido era reproduzir
# a MESMA voz/ritmo da amostra escolhida de forma confiável — com
# noise-w-scale 0 a duração fica DETERMINÍSTICA (sempre igual pro
# mesmo texto), o que também torna a estimativa de tempo da legenda
# (legendar.js) confiável. Timbre/entonação (noise-scale) não foi
# tocado — só a aleatoriedade de DURAÇÃO.
param(
  [Parameter(Mandatory = $true)][string]$TextoArquivo,
  [Parameter(Mandatory = $true)][string]$SaidaWav,
  [Parameter(Mandatory = $true)][string]$Modelo,
  [double]$LengthScale = 1.0,
  [double]$NoiseWScale = 0
)

if (-not (Test-Path -LiteralPath $Modelo)) {
  Write-Error "Modelo Piper não encontrado: $Modelo (rode: python -m piper.download_voices --download-dir <pasta> <voz>)"
  exit 1
}

Get-Content -LiteralPath $TextoArquivo -Raw -Encoding UTF8 | python -m piper -m $Modelo -f $SaidaWav --length-scale $LengthScale --noise-w-scale $NoiseWScale --sentence-silence 0.15
if ($LASTEXITCODE -ne 0) {
  Write-Error "Piper falhou (código $LASTEXITCODE)"
  exit $LASTEXITCODE
}

Write-Output "OK"
