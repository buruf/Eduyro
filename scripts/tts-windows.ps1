# scripts/tts-windows.ps1
# Synthesizes narration lines to WAV using the Windows built-in speech engine
# (System.Speech). No API key, no network, no cost — and unlike the browser's
# speechSynthesis it writes real FILES, so Remotion can encode them into the
# rendered MP4.
#
#   powershell -File scripts/tts-windows.ps1 -LinesJson <path> -OutDir <dir> [-Rate -2]
param(
  [Parameter(Mandatory = $true)][string]$LinesJson,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [int]$Rate = -2   # -10..10; negative is slower, which suits a young listener
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = $Rate

# Prefer a female voice when the machine has one installed (Zira/Hazel);
# otherwise take whatever the default is rather than failing.
$voices = $synth.GetInstalledVoices() | Where-Object { $_.Enabled }
$preferred = $voices | Where-Object { $_.VoiceInfo.Name -match 'Zira|Hazel|Eva|Female' } | Select-Object -First 1
if ($null -eq $preferred) {
  $preferred = $voices | Where-Object { $_.VoiceInfo.Gender -eq 'Female' } | Select-Object -First 1
}
if ($null -ne $preferred) { $synth.SelectVoice($preferred.VoiceInfo.Name) }
Write-Output "voice: $($synth.Voice.Name)  rate: $Rate"

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

$lines = Get-Content -Raw -Path $LinesJson | ConvertFrom-Json
foreach ($line in $lines) {
  $path = Join-Path $OutDir "$($line.id).wav"
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($line.text)
  Write-Output "wrote: $($line.id).wav"
}
$synth.SetOutputToNull()
$synth.Dispose()
