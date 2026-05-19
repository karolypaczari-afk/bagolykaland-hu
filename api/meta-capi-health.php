<?php
/**
 * BAGOLYKALAND.HU — Meta CAPI health endpoint
 *
 * Read-only riport a `capi.log` + `capi-relay.log` utolsó X órájáról, hogy
 * egy ránézésre látszódjon ha a Meta access token lejárt, vagy a Graph API
 * tartósan elérhetetlen. CAPI tokenek 60-90 nap után lejárnak — silent fail
 * → match quality drop, Smart Bidding signal-rontás.
 *
 * Védelem: a query-paraméter `key` egyezzen meg a `capi-config.php`-ban
 * definiált `$metaHealthKey`-vel. Ha nincs ott definiálva, az endpoint
 * letiltja önmagát (404). Ez nem auth a klasszikus értelemben, de a logot
 * tartalmazza, ezért hozzáférést érdemes szűkíteni.
 *
 * Használat:
 *   curl 'https://bagolykaland.hu/api/meta-capi-health.php?key=XYZ&hours=24'
 *
 * Output (JSON):
 *   {
 *     "window_hours": 24,
 *     "checked_at": "2026-05-19T12:34:56+00:00",
 *     "capi": {
 *       "total":     142,
 *       "ok_2xx":    140,
 *       "fail":        2,
 *       "ok_rate":  0.986,
 *       "last_event": "2026-05-19 11:02:33",
 *       "last_status": 200,
 *       "by_event": {"CampApplication": 12, "Lead": 88, "Contact": 42},
 *       "recent_failures": [...]
 *     },
 *     "capi_relay": { ... },
 *     "health": "ok|degraded|broken"
 *   }
 *
 *   health=ok        → ok_rate >= 0.95 ÉS van event az utolsó 6 órában
 *   health=degraded  → 0.50 <= ok_rate < 0.95 VAGY 6-24 óra silent
 *   health=broken    → ok_rate < 0.50 VAGY >24 óra silent
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Robots-Tag: noindex, nofollow');

$configFile = __DIR__ . '/capi-config.php';
if (!file_exists($configFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'not configured']);
    exit;
}
require $configFile;

$expectedKey = isset($metaHealthKey) ? trim((string) $metaHealthKey) : '';
$providedKey = isset($_GET['key']) ? trim((string) $_GET['key']) : '';

if ($expectedKey === '' || !hash_equals($expectedKey, $providedKey)) {
    http_response_code(404);
    echo json_encode(['error' => 'not found']);
    exit;
}

$hours = isset($_GET['hours']) ? max(1, min(168, (int) $_GET['hours'])) : 24;
$cutoff = time() - ($hours * 3600);

function bk_capi_parse_log($path, $cutoff) {
    $stats = [
        'total'           => 0,
        'ok_2xx'          => 0,
        'fail'            => 0,
        'ok_rate'         => null,
        'last_event'      => null,
        'last_status'     => null,
        'by_event'        => [],
        'recent_failures' => [],
    ];
    if (!file_exists($path)) return $stats;

    // Naive line-by-line read — capi.log volume is low (max few thousand
    // sor/nap), nem érdemes seek/tail-elni. Ha 100k+ sorra nőne, érdemes
    // file-pointert visszafelé olvasni.
    $fp = @fopen($path, 'r');
    if (!$fp) return $stats;

    while (($line = fgets($fp)) !== false) {
        $line = rtrim($line, "\r\n");
        if ($line === '') continue;
        // Format: "YYYY-mm-dd HH:ii:ss | EventName | id=... | http=NNN[ | err]"
        $parts = explode(' | ', $line);
        if (count($parts) < 4) continue;

        $tsStr  = $parts[0];
        $event  = $parts[1];
        $http   = 0;
        if (preg_match('/http=(\d+)/', $parts[3], $m)) $http = (int) $m[1];

        $ts = strtotime($tsStr);
        if ($ts === false || $ts < $cutoff) continue;

        $stats['total']++;
        $stats['by_event'][$event] = ($stats['by_event'][$event] ?? 0) + 1;
        $stats['last_event']  = $tsStr;
        $stats['last_status'] = $http;

        if ($http >= 200 && $http < 300) {
            $stats['ok_2xx']++;
        } else {
            $stats['fail']++;
            if (count($stats['recent_failures']) < 5) {
                $stats['recent_failures'][] = $line;
            }
        }
    }
    fclose($fp);

    if ($stats['total'] > 0) {
        $stats['ok_rate'] = round($stats['ok_2xx'] / $stats['total'], 3);
    }
    return $stats;
}

function bk_capi_overall_health($capi, $relay, $hours) {
    // Ha 0 event van bárhol a teljes ablakban → broken (vagy nincs forgalom).
    $totalEvents = ($capi['total'] ?? 0) + ($relay['total'] ?? 0);
    if ($totalEvents === 0) return 'silent';

    $okRate = null;
    if ($totalEvents > 0) {
        $okRate = (($capi['ok_2xx'] ?? 0) + ($relay['ok_2xx'] ?? 0)) / $totalEvents;
    }

    // Recent activity check: minimum egy event az utolsó 6 órában (1/4-e az
    // alap 24h ablaknak). Mobil-csúcs (esti) órákban pár órás csend még OK,
    // de 6+ óra már gyanús (vagy nincs forgalom, vagy CAPI broken).
    $lastTs = max(
        strtotime($capi['last_event']  ?? '1970-01-01 00:00:00') ?: 0,
        strtotime($relay['last_event'] ?? '1970-01-01 00:00:00') ?: 0
    );
    $sinceLast = time() - $lastTs;
    $maxSilent = max(6 * 3600, intdiv($hours * 3600, 4));

    if ($okRate !== null && $okRate < 0.50) return 'broken';
    if ($sinceLast > 24 * 3600)             return 'broken';
    if ($okRate !== null && $okRate < 0.95) return 'degraded';
    if ($sinceLast > $maxSilent)            return 'degraded';
    return 'ok';
}

$capiStats  = bk_capi_parse_log(__DIR__ . '/logs/capi.log',       $cutoff);
$relayStats = bk_capi_parse_log(__DIR__ . '/logs/capi-relay.log', $cutoff);

$response = [
    'window_hours' => $hours,
    'checked_at'   => date(DATE_ATOM),
    'capi'         => $capiStats,
    'capi_relay'   => $relayStats,
    'health'       => bk_capi_overall_health($capiStats, $relayStats, $hours),
];

if ($response['health'] === 'broken') {
    http_response_code(503);
} elseif ($response['health'] === 'degraded' || $response['health'] === 'silent') {
    http_response_code(207);
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
