<?php
// One-time SMTP config installer. Delete after use (or it self-deletes on success).
// Usage: POST /api/_setup.php  with JSON {"token":"bk-setup-2026","pass":"YOUR_SMTP_PASS"}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['ok'=>false,'e'=>'POST only']); exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (($body['token'] ?? '') !== 'bk-setup-2026') {
    http_response_code(403); echo json_encode(['ok'=>false,'e'=>'forbidden']); exit;
}

$pass = trim($body['pass'] ?? '');
if ($pass === '') {
    http_response_code(400); echo json_encode(['ok'=>false,'e'=>'pass required']); exit;
}

$config = '<?php' . "\n" .
'$smtpHost = \'smtp.hostinger.com\';' . "\n" .
'$smtpPort = 465;' . "\n" .
'$smtpUser = \'info@bagolykaland.hu\';' . "\n" .
'$smtpPass = \'' . addslashes($pass) . '\';' . "\n" .
'$smtpFrom = \'info@bagolykaland.hu\';' . "\n";

$target = __DIR__ . '/smtp-config.php';
if (file_put_contents($target, $config) === false) {
    http_response_code(500); echo json_encode(['ok'=>false,'e'=>'write failed']); exit;
}

// Self-delete
@unlink(__FILE__);

echo json_encode(['ok'=>true,'msg'=>'smtp-config.php created, setup script deleted']);
