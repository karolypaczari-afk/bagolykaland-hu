<?php
/**
 * BAGOLYKALAND.HU — Contact Form Handler
 * Receives POST JSON, validates, sends email to info@bagolykaland.hu + fejlesztobagolyka@gmail.com
 */

header('Content-Type: application/json; charset=utf-8');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Parse JSON body
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid request']);
    exit;
}

// Extract and sanitize fields
$name    = trim(strip_tags($input['name'] ?? ''));
$email   = trim($input['email'] ?? '');
$phone   = trim(strip_tags($input['phone'] ?? ''));
$message = trim(strip_tags($input['message'] ?? ''));
$program = trim(strip_tags($input['program'] ?? ''));
$source  = trim(strip_tags($input['source'] ?? ''));

// Validate required fields
$errors = [];
if ($name === '') {
    $errors[] = 'Kérjük, add meg a neved.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Kérjük, adj meg érvényes e-mail címet.';
}
if ($message === '') {
    $errors[] = 'Kérjük, írd meg az üzeneted.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => implode(' ', $errors)]);
    exit;
}

// Honeypot check — if a hidden field is filled, it's a bot
if (!empty($input['website'])) {
    // Silently accept to not tip off bots
    echo json_encode(['ok' => true]);
    exit;
}

// Rate limit: simple file-based, 1 submission per IP per 60 seconds
$rateLimitDir = sys_get_temp_dir() . '/bk_contact_rate';
if (!is_dir($rateLimitDir)) {
    @mkdir($rateLimitDir, 0700, true);
}
$ipHash = md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitFile = $rateLimitDir . '/' . $ipHash;
if (file_exists($rateLimitFile) && (time() - filemtime($rateLimitFile)) < 60) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Túl sok üzenet. Kérjük, várj egy percet.']);
    exit;
}

// Build email — subject reflects which form was filled out
$to = 'info@bagolykaland.hu, fejlesztobagolyka@gmail.com, karolypaczari@gmail.com';

if ($program !== '') {
    $subjectText = "Jelentkezés: {$program} – bagolykaland.hu";
} else {
    $subjectText = "Új üzenet – bagolykaland.hu kapcsolat";
}
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
$messageId = '<' . bin2hex(random_bytes(16)) . '@bagolykaland.hu>';

$body = "";
if ($program !== '') {
    $body .= "═══════════════════════════════\r\n";
    $body .= "PROGRAM: {$program}\r\n";
    $body .= "═══════════════════════════════\r\n\r\n";
}
$body .= "Feladó: {$name}\r\n";
$body .= "E-mail: {$email}\r\n";
if ($phone !== '') {
    $body .= "Telefon: {$phone}\r\n";
}
$body .= "Időpont: " . date('Y-m-d H:i:s') . "\r\n";
if ($source !== '') {
    $body .= "Forrás oldal: {$source}\r\n";
}
$body .= "---\r\n\r\n";
$body .= $message . "\r\n";

$headers  = "From: BagolykaLand <info@bagolykaland.hu>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Message-ID: {$messageId}\r\n";

$sent = mail($to, $subject, $body, $headers, '-f info@bagolykaland.hu');

if ($sent) {
    // Update rate limit file
    @touch($rateLimitFile);
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Az üzenet küldése sikertelen. Kérjük, próbáld telefonon.']);
}
