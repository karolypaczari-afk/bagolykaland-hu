<?php
/**
 * BAGOLYKALAND.HU — Meta Conversions API helper
 *
 * Sends server-side events to Meta to complement the browser pixel.
 * Deduplicates against the browser event using a shared event_id.
 * Requires api/capi-config.php (gitignored).
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api/
 */

function bk_meta_capi_hash($value) {
    $v = strtolower(trim((string) $value));
    if ($v === '') return null;
    return hash('sha256', $v);
}

function bk_meta_capi_hash_phone($phone) {
    // Meta expects digits only, country code included.
    $digits = preg_replace('/\D+/', '', (string) $phone);
    if ($digits === '') return null;
    // Hungarian numbers typed as "06 30..." are not E.164; drop a leading 0
    // only if no country code is present and the number starts with 06 (national trunk prefix).
    if (strpos($digits, '36') !== 0 && strpos($digits, '06') === 0) {
        $digits = '36' . substr($digits, 2);
    }
    return hash('sha256', $digits);
}

function bk_meta_capi_split_name($fullName) {
    $parts = preg_split('/\s+/', trim((string) $fullName));
    if (!$parts || count($parts) === 0 || ($parts[0] ?? '') === '') {
        return [null, null];
    }
    // Hungarian convention puts surname first ("Paczári Károly"),
    // but users sometimes reverse it. Meta matches either order once both
    // halves are hashed, so we keep a simple split.
    $last = array_shift($parts);
    $first = count($parts) > 0 ? implode(' ', $parts) : null;
    if (!$first) {
        // Single-word input — send it as first name.
        return [$last, null];
    }
    return [$first, $last];
}

function bk_meta_capi_client_ip() {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
    if ($ip && strpos($ip, ',') !== false) {
        $ip = trim(explode(',', $ip)[0]);
    }
    return $ip;
}

/**
 * @param string      $eventName        Meta event name (e.g. "CampApplication", "Lead").
 * @param string|null $eventId          Shared event_id used for pixel/CAPI dedup.
 * @param array       $userData         ['email'=>..., 'phone'=>..., 'firstName'=>..., 'lastName'=>...]
 * @param array       $customData       Custom data: content_name, value, currency, etc.
 * @param string|null $eventSourceUrl   Page URL where the event happened.
 * @return true|string                  true on 2xx, otherwise a short error string.
 */
function bk_meta_capi_send($eventName, $eventId, array $userData, array $customData = [], $eventSourceUrl = null) {
    $configFile = __DIR__ . '/capi-config.php';
    if (!file_exists($configFile)) return 'capi-config.php missing';
    require $configFile;

    if (empty($metaAccessToken) || empty($metaPixelId)) return 'capi config incomplete';
    $apiVersion = isset($metaApiVersion) && $metaApiVersion ? $metaApiVersion : 'v21.0';

    $ud = [];
    if (!empty($userData['email']))     $ud['em'] = [bk_meta_capi_hash($userData['email'])];
    if (!empty($userData['phone']))     $ud['ph'] = [bk_meta_capi_hash_phone($userData['phone'])];
    if (!empty($userData['firstName'])) $ud['fn'] = [bk_meta_capi_hash($userData['firstName'])];
    if (!empty($userData['lastName']))  $ud['ln'] = [bk_meta_capi_hash($userData['lastName'])];

    $ip = bk_meta_capi_client_ip();
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
    if ($ip) $ud['client_ip_address'] = $ip;
    if ($ua) $ud['client_user_agent'] = $ua;

    // Facebook click ID / browser ID from cookies — boosts match quality.
    if (!empty($_COOKIE['_fbc'])) $ud['fbc'] = $_COOKIE['_fbc'];
    if (!empty($_COOKIE['_fbp'])) $ud['fbp'] = $_COOKIE['_fbp'];

    $event = [
        'event_name'    => $eventName,
        'event_time'    => time(),
        'action_source' => 'website',
        'user_data'     => $ud,
    ];
    if ($eventId)         $event['event_id']        = $eventId;
    if ($eventSourceUrl)  $event['event_source_url'] = $eventSourceUrl;
    if (!empty($customData)) $event['custom_data']  = $customData;

    $payload = ['data' => [$event]];
    if (!empty($metaTestEventCode)) {
        $payload['test_event_code'] = $metaTestEventCode;
    }

    $endpoint = "https://graph.facebook.com/{$apiVersion}/{$metaPixelId}/events?access_token=" . urlencode($metaAccessToken);

    if (!function_exists('curl_init')) return 'curl not available';

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $response = curl_exec($ch);
    $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    // Best-effort logging for debugging — failures never block the user response.
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) @mkdir($logDir, 0700, true);
    $logLine = date('Y-m-d H:i:s') . " | {$eventName} | id={$eventId} | http={$status}";
    if ($status < 200 || $status >= 300) {
        $logLine .= ' | ' . substr(($curlErr ?: $response), 0, 400);
    }
    @file_put_contents($logDir . '/capi.log', $logLine . "\n", FILE_APPEND | LOCK_EX);

    if ($status >= 200 && $status < 300) return true;
    return "CAPI HTTP {$status}";
}
