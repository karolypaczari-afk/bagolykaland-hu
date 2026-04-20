<?php
/**
 * BAGOLYKALAND.HU — Contact Form Handler
 * Sends via SMTP (PHPMailer-style raw SMTP) + file log fallback.
 * Config: api/smtp-config.php (not committed to git)
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid request']);
    exit;
}

$name    = trim(strip_tags($input['name'] ?? ''));
$email   = trim($input['email'] ?? '');
$phone   = trim(strip_tags($input['phone'] ?? ''));
$message = trim(strip_tags($input['message'] ?? ''));
$program = trim(strip_tags($input['program'] ?? ''));
$source  = trim(strip_tags($input['source'] ?? ''));
$eventId = trim(strip_tags($input['event_id'] ?? ''));
$pageUrl = filter_var($input['page_url'] ?? '', FILTER_SANITIZE_URL);
$turnus  = trim(strip_tags($input['turnus'] ?? ''));

$errors = [];
if ($name === '') $errors[] = 'Kérjük, add meg a neved.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Kérjük, adj meg érvényes e-mail címet.';
if ($message === '') $errors[] = 'Kérjük, írd meg az üzeneted.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => implode(' ', $errors)]);
    exit;
}

if (!empty($input['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

// Rate limit
$rateLimitDir = sys_get_temp_dir() . '/bk_contact_rate';
if (!is_dir($rateLimitDir)) @mkdir($rateLimitDir, 0700, true);
$ipHash = md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitFile = $rateLimitDir . '/' . $ipHash;
if (file_exists($rateLimitFile) && (time() - filemtime($rateLimitFile)) < 60) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Túl sok üzenet. Kérjük, várj egy percet.']);
    exit;
}

// Build message body
$subjectText = $program !== '' ? "Jelentkezés: {$program} – bagolykaland.hu" : "Új üzenet – bagolykaland.hu kapcsolat";
$body  = $program !== '' ? "PROGRAM: {$program}\r\n\r\n" : '';
$body .= "Feladó:   {$name}\r\n";
$body .= "E-mail:   {$email}\r\n";
if ($phone !== '') $body .= "Telefon:  {$phone}\r\n";
$body .= "Időpont:  " . date('Y-m-d H:i:s') . "\r\n";
if ($source !== '') $body .= "Forrás:   {$source}\r\n";
$body .= "---\r\n\r\n" . $message . "\r\n";

// Always write to log file as safety net
$logDir  = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0700, true);
$msgForLog = str_replace(["\r\n", "\n"], ' · ', $message);
$logLine = date('Y-m-d H:i:s') . " | " . $name . " | " . $email . " | " . $phone . " | " . $program . " | " . $msgForLog . "\n";
@file_put_contents($logDir . '/submissions.log', $logLine, FILE_APPEND | LOCK_EX);

// ── Meta Conversions API (server-side event, dedup with browser pixel) ──
// Fires a matching CAPI event for every form submission so Meta Events
// Manager sees both browser and server signal for each Lead / Contact /
// CampApplication, improving match quality and ad attribution.
// `capi-config.php` is gitignored; if missing the helper silently no-ops.
require_once __DIR__ . '/meta-capi.php';
[$firstName, $lastName] = bk_meta_capi_split_name($name);
$capiUser = [
    'email'     => $email,
    'phone'     => $phone,
    'firstName' => $firstName,
    'lastName'  => $lastName,
];

if ($program === 'Kincskereső Élménytábor 2026') {
    $campCustom = [
        'content_name'     => $program,
        'content_category' => 'summer_camp',
        'value'            => 75000,
        'currency'         => 'HUF',
    ];
    if ($turnus !== '') {
        $campCustom['content_ids'] = [$turnus];
        $campCustom['num_items']   = 1;
    }
    @bk_meta_capi_send(
        'CampApplication',
        $eventId ?: null,
        $capiUser,
        $campCustom,
        $pageUrl ?: null
    );
} elseif ($program !== '') {
    // Any other program/exam signup → Meta Lead (ad-optimization friendly)
    @bk_meta_capi_send(
        'Lead',
        $eventId ?: null,
        $capiUser,
        [
            'content_name'     => $program,
            'content_category' => 'program_inquiry',
        ],
        $pageUrl ?: null
    );
} else {
    // Generic contact form → Meta Contact
    @bk_meta_capi_send(
        'Contact',
        $eventId ?: null,
        $capiUser,
        [
            'content_name'     => 'contact_form',
        ],
        $pageUrl ?: null
    );
}

// Load SMTP config
$smtpConfig = __DIR__ . '/smtp-config.php';
if (file_exists($smtpConfig)) {
    require $smtpConfig;
} else {
    // Fallback: try native mail() if no SMTP config yet
    $to      = 'info@bagolykaland.hu, fejlesztobagolyka@gmail.com, karolypaczari@gmail.com';
    $subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
    $headers = "From: BagolykaLand <info@bagolykaland.hu>\r\nReply-To: {$name} <{$email}>\r\nContent-Type: text/plain; charset=UTF-8";
    $sent    = @mail($to, $subject, $body, $headers);
    @touch($rateLimitFile);
    echo json_encode(['ok' => true]);
    exit;
}

// SMTP send
$recipients = ['info@bagolykaland.hu', 'fejlesztobagolyka@gmail.com', 'karolypaczari@gmail.com'];
$sent = bk_smtp_send($smtpHost, $smtpPort, $smtpUser, $smtpPass, $smtpFrom, $recipients, $subjectText, $body, $name, $email);

@touch($rateLimitFile);

if ($sent === true) {
    echo json_encode(['ok' => true]);
} else {
    // SMTP failed but we have the log — still return ok so user isn't blocked
    error_log('BK SMTP error: ' . $sent);
    echo json_encode(['ok' => true]);
}

// ── Raw SMTP helper (no external libs needed) ──────────────────────────────
function bk_smtp_send($host, $port, $user, $pass, $from, $recipients, $subject, $body, $replyName, $replyEmail) {
    $timeout = 15;
    $ssl = ($port == 465) ? 'ssl://' : '';
    $sock = @fsockopen($ssl . $host, $port, $errno, $errstr, $timeout);
    if (!$sock) return "fsockopen failed: {$errstr} ({$errno})";

    function smtp_cmd($sock, $cmd, $expect) {
        if ($cmd !== null) fwrite($sock, $cmd . "\r\n");
        $res = '';
        while (!feof($sock)) {
            $line = fgets($sock, 512);
            $res .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        $code = substr($res, 0, 3);
        return (strpos($expect, $code) !== false) ? true : $res;
    }

    $r = smtp_cmd($sock, null, '220');
    if ($r !== true) return "Greeting: $r";

    $r = smtp_cmd($sock, "EHLO bagolykaland.hu", '250');
    if ($r !== true) return "EHLO: $r";

    if ($port == 587) {
        $r = smtp_cmd($sock, "STARTTLS", '220');
        if ($r !== true) return "STARTTLS: $r";
        stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $r = smtp_cmd($sock, "EHLO bagolykaland.hu", '250');
        if ($r !== true) return "EHLO2: $r";
    }

    $r = smtp_cmd($sock, "AUTH LOGIN", '334');
    if ($r !== true) return "AUTH: $r";
    $r = smtp_cmd($sock, base64_encode($user), '334');
    if ($r !== true) return "USER: $r";
    $r = smtp_cmd($sock, base64_encode($pass), '235');
    if ($r !== true) return "PASS: $r";

    $r = smtp_cmd($sock, "MAIL FROM:<{$from}>", '250');
    if ($r !== true) return "MAIL FROM: $r";

    foreach ($recipients as $rcpt) {
        $r = smtp_cmd($sock, "RCPT TO:<{$rcpt}>", '250251');
        if ($r !== true) return "RCPT TO {$rcpt}: $r";
    }

    $r = smtp_cmd($sock, "DATA", '354');
    if ($r !== true) return "DATA: $r";

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $toHeader = implode(', ', $recipients);
    $msgId = '<' . bin2hex(random_bytes(16)) . '@bagolykaland.hu>';
    $headers  = "From: BagolykaLand <{$from}>\r\n";
    $headers .= "Reply-To: {$replyName} <{$replyEmail}>\r\n";
    $headers .= "To: {$toHeader}\r\n";
    $headers .= "Subject: {$encodedSubject}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: base64\r\n";
    $headers .= "Message-ID: {$msgId}\r\n";
    $headers .= "Date: " . date('r') . "\r\n";

    $encodedBody = chunk_split(base64_encode($body));
    $r = smtp_cmd($sock, $headers . "\r\n" . $encodedBody . "\r\n.", '250');
    if ($r !== true) return "BODY: $r";

    smtp_cmd($sock, "QUIT", '221');
    fclose($sock);
    return true;
}
