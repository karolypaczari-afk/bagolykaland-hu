<?php
/**
 * BAGOLYKALAND.HU — Browser → Server Meta Conversions API relay
 *
 * Receives events from js/meta-enhance.src.js (dedup'd with fbq browser Pixel
 * via shared event_id) and forwards them to Meta Graph API.
 *
 * Silently no-ops when api/capi-config.php is missing or the token is empty.
 * Unknown / non-allowlisted events return 204 so the browser never blocks.
 */

header('Content-Type: application/json; charset=utf-8');

// Allow same-origin only; bagolykaland.hu and www.
$allowedOrigins = ['https://bagolykaland.hu', 'https://www.bagolykaland.hu'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

function bk_relay_noop($reason = null) {
    if ($reason) error_log('[BK CAPI relay] ' . $reason);
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/meta-capi.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input) || empty($input['event_name'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid payload']);
    exit;
}

// Allowlist — we only relay real signal, not test / dev noise
$allowed = [
    'PageView', 'ViewContent', 'Lead', 'Contact', 'CompleteRegistration',
    'Search', 'InitiateCheckout', 'Schedule', 'CampApplication',
];
if (!in_array($input['event_name'], $allowed, true)) {
    bk_relay_noop('event not allowlisted: ' . $input['event_name']);
}

$eventName = $input['event_name'];
$eventId   = isset($input['event_id']) ? (string) $input['event_id'] : null;
$sourceUrl = isset($input['source_url']) ? (string) $input['source_url'] : null;
$custom    = isset($input['custom_data']) && is_array($input['custom_data']) ? $input['custom_data'] : [];
$ud        = isset($input['user_data']) && is_array($input['user_data']) ? $input['user_data'] : [];

// meta-capi.php's helper hashes email/phone/names itself. For events relayed
// from the browser we've already hashed the email (em); the helper's hashing
// applies to raw inputs, so pass the hashed value directly in $custom
// via a side channel and bypass helper hashing.
//
// Simpler: inline the minimal CAPI call here (so we can pass pre-hashed em / fbc / fbp / external_id).
$configFile = __DIR__ . '/capi-config.php';
if (!file_exists($configFile)) bk_relay_noop('capi-config.php missing');
require $configFile;
if (empty($metaAccessToken) || empty($metaPixelId)) bk_relay_noop('capi config incomplete');
$apiVersion = !empty($metaApiVersion) ? $metaApiVersion : 'v21.0';

$serverUd = [];
// Browser-supplied pre-hashed em — trust it (64-char sha256 hex)
if (!empty($ud['em']) && is_string($ud['em']) && preg_match('/^[a-f0-9]{64}$/i', $ud['em'])) {
    $serverUd['em'] = [$ud['em']];
}
if (!empty($ud['external_id'])) {
    // external_id from browser is already hashed; don't double-hash
    $serverUd['external_id'] = is_array($ud['external_id']) ? $ud['external_id'] : [$ud['external_id']];
}
if (!empty($ud['fbp'])) $serverUd['fbp'] = $ud['fbp'];
if (!empty($ud['fbc'])) $serverUd['fbc'] = $ud['fbc'];

$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
if ($ip && strpos($ip, ',') !== false) $ip = trim(explode(',', $ip)[0]);
if ($ip) $serverUd['client_ip_address'] = $ip;
$serverUd['client_user_agent'] = !empty($ud['client_user_agent']) && is_string($ud['client_user_agent'])
    ? $ud['client_user_agent']
    : ($_SERVER['HTTP_USER_AGENT'] ?? '');
$serverUd['country'] = [hash('sha256', 'hu')];

$event = [
    'event_name'    => $eventName,
    'event_time'    => time(),
    'action_source' => 'website',
    'user_data'     => $serverUd,
];
if ($eventId)   $event['event_id']        = $eventId;
if ($sourceUrl) $event['event_source_url'] = $sourceUrl;
if (!empty($custom)) $event['custom_data'] = $custom;

$payload = ['data' => [$event]];
if (!empty($metaTestEventCode)) $payload['test_event_code'] = $metaTestEventCode;

$endpoint = "https://graph.facebook.com/{$apiVersion}/{$metaPixelId}/events?access_token=" . urlencode($metaAccessToken);

if (!function_exists('curl_init')) bk_relay_noop('curl not available');

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
$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0700, true);
$logLine = date('Y-m-d H:i:s') . " | {$eventName} | id={$eventId} | http={$httpCode}";
if ($httpCode < 200 || $httpCode >= 300) $logLine .= ' | ' . substr(($curlError ?: $response), 0, 400);
@file_put_contents($logDir . '/capi-relay.log', $logLine . "\n", FILE_APPEND | LOCK_EX);

if ($httpCode >= 200 && $httpCode < 300) {
    http_response_code(200);
    echo $response ?: json_encode(['ok' => true]);
} else {
    bk_relay_noop('Meta Graph API HTTP ' . $httpCode);
}
