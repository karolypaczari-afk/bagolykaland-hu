<?php
/**
 * ONE-TIME: imports historical form submissions (pre-logging) into submissions.log.
 * Idempotent — running it twice does nothing extra. Delete this file after use.
 */
header('Content-Type: text/plain; charset=utf-8');

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0700, true);
$logFile = $logDir . '/submissions.log';

$existing = file_exists($logFile) ? file_get_contents($logFile) : '';

// Historical entries — format: timestamp | name | email | phone | program | message
$entries = [
    '2026-04-17 17:07:43 | Herczeg Bernadett | tothbernadett01@gmail.com | +36304932283 | Kincskereső Élménytábor 2026 | Jelentkezés / Érdeklődés: Kincskereső Élménytábor 2026 · Gyermek neve: Herczeg Sára · Gyermek kora: 6 éves · Választott turnus: 1. turnus (júl. 14–18.) · Forrás oldal: /nyari-tabor/',
];

$added = 0;
foreach ($entries as $line) {
    $parts = explode(' | ', $line, 6);
    $uniqueKey = $parts[0]; // timestamp
    if (strpos($existing, $uniqueKey) === false) {
        file_put_contents($logFile, $line . "\n", FILE_APPEND | LOCK_EX);
        $existing .= $line . "\n";
        $added++;
    }
}

echo "OK\n";
echo "Hozzáadva: {$added} bejegyzés\n";
echo "Log fájl mérete: " . (file_exists($logFile) ? filesize($logFile) : 0) . " byte\n";
echo "\nMost jelentkezz be: /api/belepes.php\n";
echo "Utána törölhető ez a fájl.\n";
