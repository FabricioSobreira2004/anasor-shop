# Sintetiza um texto em WAV usando a voz do Windows (System.Speech/SAPI).
# Separado em .ps1 (em vez de -Command inline) pra não depender de
# escapar aspas/acentos dentro de uma linha de comando do PowerShell —
# o texto vem de um arquivo .txt (UTF-8), nunca da linha de comando.
param(
  [Parameter(Mandatory = $true)][string]$TextoArquivo,
  [Parameter(Mandatory = $true)][string]$SaidaWav,
  [int]$Rate = 2,
  [string]$Voz = "Microsoft Maria Desktop"
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice($Voz)
$synth.Rate = $Rate

$texto = Get-Content -LiteralPath $TextoArquivo -Raw -Encoding UTF8
if (Test-Path -LiteralPath $SaidaWav) { Remove-Item -LiteralPath $SaidaWav -Force }

$synth.SetOutputToWaveFile($SaidaWav)
$synth.Speak($texto)
$synth.Dispose()

Write-Output "OK"
