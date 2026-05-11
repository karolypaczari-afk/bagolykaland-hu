<?php
/**
 * BAGOLYKALAND.HU — Popup Lead Fallback
 * Server-side log target for the lead-capture popup when the primary
 * Supabase write fails (network error, CORS hiccup, RLS rejection).
 *
 * Writes one line per lead to api/logs/popup-leads.log. Idempotency relies
 * on the caller — if Supabase eventually succeeds in a retry the same email
 * may appear in both stores. Dedup is the consumer's job (e.g. when
 * syncing into a fresh MailerLite account, key by email).
 *
 * Intentionally minimal: no SMTP, no CAPI hop (popup itself fires
 * fbq('Lead') + meta-capi-relay PageView via the page's normal stack).
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$email      = trim($input['email'] ?? '');
$name       = trim(strip_tags($input['name'] ?? ''));
$sourcePage = trim(strip_tags($input['source_page'] ?? ''));
$groupName  = trim(strip_tags($input['group_name'] ?? ''));
$formType   = trim(strip_tags($input['form_type'] ?? 'popup'));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Érvénytelen e-mail.']);
    exit;
}

// Honeypot — if `website` field is filled in, accept silently (bot).
if (!empty($input['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

// Per-IP rate limit (60s) to deter abuse. Shares the same temp-dir pattern
// as contact.php but a different bucket so a real form submission and a
// popup signup don't block each other.
$rateLimitDir = sys_get_temp_dir() . '/bk_popup_rate';
if (!is_dir($rateLimitDir)) @mkdir($rateLimitDir, 0700, true);
$ipHash = md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitFile = $rateLimitDir . '/' . $ipHash;
if (file_exists($rateLimitFile) && (time() - filemtime($rateLimitFile)) < 60) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Túl gyors. Kérjük, várj egy percet.']);
    exit;
}
@touch($rateLimitFile);

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0700, true);

$referer  = $_SERVER['HTTP_REFERER']     ?? '';
$ua       = $_SERVER['HTTP_USER_AGENT']  ?? '';
$fbp      = $_COOKIE['_fbp']             ?? '';
$fbc      = $_COOKIE['_fbc']             ?? '';
$attrib   = $_COOKIE['bk_attrib']        ?? '';

$logLine = date('Y-m-d H:i:s')
    . " | " . $email
    . " | " . $name
    . " | form=" . $formType
    . " | group=" . $groupName
    . " | page=" . $sourcePage
    . " | ref=" . $referer
    . " | fbp=" . $fbp
    . " | fbc=" . $fbc
    . " | attrib=" . $attrib
    . " | ua=" . str_replace(["\r", "\n", "|"], ' ', $ua)
    . "\n";

$ok = @file_put_contents($logDir . '/popup-leads.log', $logLine, FILE_APPEND | LOCK_EX);
if ($ok === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Log write failed.']);
    exit;
}

echo json_encode(['ok' => true]);
