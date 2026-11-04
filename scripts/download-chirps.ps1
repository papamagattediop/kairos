# Télécharge la pluie mensuelle CHIRPS v3.0 (Afrique) dans data/incoming/chirps.
# À lancer depuis la racine du projet :
#   powershell -ExecutionPolicy Bypass -File scripts/download-chirps.ps1
# Par défaut : juin 2016 à mai 2026 (campagnes 2016 à 2025). Un fichier fait environ 4,8 Mo.
# Les mois pas encore publiés (erreur 404) sont signalés et ignorés. Les fichiers déjà présents sont conservés.
param(
  [int]$FromYear = 2016,
  [int]$ToYear = 2026
)

$base = "https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/africa/tifs"
$out = Join-Path (Get-Location) "data/incoming/chirps"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$ok = 0; $skipped = 0; $missing = @()
for ($y = $FromYear; $y -le $ToYear; $y++) {
  for ($m = 1; $m -le 12; $m++) {
    # Campagne : on commence en juin de FromYear et on finit en mai de ToYear.
    if ($y -eq $FromYear -and $m -lt 6) { continue }
    if ($y -eq $ToYear -and $m -gt 5) { continue }
    $name = "chirps-v3.0.{0}.{1:00}.tif" -f $y, $m
    $dest = Join-Path $out $name
    if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 1000000)) { $skipped++; continue }
    try {
      Invoke-WebRequest -Uri "$base/$name" -OutFile $dest -UseBasicParsing -TimeoutSec 120
      if ((Get-Item $dest).Length -lt 1000000) { throw "fichier trop petit" }
      $ok++
      Write-Host "ok  $name"
    } catch {
      Remove-Item $dest -ErrorAction SilentlyContinue
      $missing += $name
      Write-Host "ABSENT  $name  ($($_.Exception.Message))"
    }
  }
}
Write-Host ""
Write-Host "$ok téléchargés, $skipped déjà présents, $($missing.Count) absents."
if ($missing.Count -gt 0) { Write-Host "Absents : $($missing -join ', ')" }
