<?php
/**
 * BAGOLYKALAND.HU — Karrier (állás) jelentkezés handler
 * Fogadja a /karrier/ landoló form-submitjét: multipart/form-data + opcionális
 * önéletrajz-csatolmány. Az SMTP-email tartalmazza a CV-t mellékletként; a fájl
 * `_uploads/karrier/` alatt is megmarad (.htaccess deny, csak PHP olvashatja).
 *
 * Patternminta: api/contact.php. Eltérés: az tisztán JSON-only volt,
 * ez multipart-aware ($_POST + $_FILES). Validációs / rate-limit / Meta CAPI
 * patternek azonosak.
 *
 * Config: api/smtp-config.php (gitignored, csak a szerveren él).
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── INPUT ──────────────────────────────────────────────────────────────────
// FORM-data, NEM JSON (a CV-feltöltés miatt). $_POST + $_FILES.
$name        = trim(strip_tags($_POST['name']        ?? ''));
$email       = trim(           $_POST['email']       ?? '');
$phone       = trim(strip_tags($_POST['phone']       ?? ''));
$education   = trim(strip_tags($_POST['education']   ?? ''));
$experience  = trim(strip_tags($_POST['experience']  ?? ''));
$bio         = trim(strip_tags($_POST['bio']         ?? ''));
$consent     = !empty($_POST['consent']);
$eventId     = trim(strip_tags($_POST['event_id']    ?? ''));
$pageUrl     = filter_var($_POST['page_url'] ?? '', FILTER_SANITIZE_URL);

// Honeypot — silent OK ha kitöltött
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

// ── VALIDÁCIÓ ──────────────────────────────────────────────────────────────
$errors = [];
if ($name === '')                                         $errors[] = 'Kérjük, add meg a neved.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))           $errors[] = 'Kérjük, adj meg érvényes e-mail címet.';
if ($phone === '')                                        $errors[] = 'Kérjük, add meg a telefonszámodat.';
if ($education === '')                                    $errors[] = 'Kérjük, írd be a legmagasabb végzettséged és szakod.';
if (mb_strlen($experience) < 20)                          $errors[] = 'Kérjük, írj egy kicsit többet a tapasztalatodról (legalább 20 karakter).';
if ($bio !== '' && mb_strlen($bio) < 50)                  $errors[] = 'A bemutatkozó szöveg legalább 50 karakter legyen — vagy hagyd üresen.';
if (!$consent)                                            $errors[] = 'Kérjük, fogadd el az adatkezelési tájékoztatót.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => implode(' ', $errors)]);
    exit;
}

// ── RATE LIMIT (per IP, 60s — külön bucket a contact-tól) ─────────────────
$rateLimitDir = sys_get_temp_dir() . '/bk_karrier_rate';
if (!is_dir($rateLimitDir)) @mkdir($rateLimitDir, 0700, true);
$ipHash = md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitFile = $rateLimitDir . '/' . $ipHash;
if (file_exists($rateLimitFile) && (time() - filemtime($rateLimitFile)) < 60) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Túl gyors. Kérjük, várj egy percet.']);
    exit;
}

// ── FÁJL-VALIDÁCIÓ + MENTÉS ────────────────────────────────────────────────
// Opcionális — a CV nem kötelező. Ha nincs, semmit nem teszünk.
$cvSavedPath = null;
$cvSavedName = null;
$cvMimeType  = null;
$cvSize      = 0;

if (isset($_FILES['cv']) && is_array($_FILES['cv']) && $_FILES['cv']['error'] !== UPLOAD_ERR_NO_FILE) {
    $upload = $_FILES['cv'];

    // PHP-szintű upload-hibák
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        $msg = 'Hiba a fájl feltöltésekor — kérjük, próbáld újra.';
        if ($upload['error'] === UPLOAD_ERR_INI_SIZE || $upload['error'] === UPLOAD_ERR_FORM_SIZE) {
            $msg = 'A fájl túl nagy. Maximum 20 MB lehet.';
        }
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => $msg]);
        exit;
    }

    // Méret-ellenőrzés (20 MB — user-rögzített limit)
    $maxBytes = 20 * 1024 * 1024;
    if ($upload['size'] > $maxBytes) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'A fájl mérete legfeljebb 20 MB lehet.']);
        exit;
    }

    // Extension whitelist
    $allowedExt = ['pdf', 'doc', 'docx'];
    $origName = basename($upload['name']);
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExt, true)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Csak PDF, DOC vagy DOCX fájlt fogadunk.']);
        exit;
    }

    // Valódi MIME-ellenőrzés (nem a kliens fejlécre hagyatkozunk)
    $allowedMime = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Régebbi MS Office néha ezt küldi — elfogadjuk DOC esetén
        'application/x-cfb',
        'application/octet-stream',  // DOCX néha ZIP-magnak látszódik — extension már szűrt
    ];
    $finfo = @finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = $finfo ? @finfo_file($finfo, $upload['tmp_name']) : null;
    if ($finfo) finfo_close($finfo);

    if ($detectedMime && !in_array($detectedMime, $allowedMime, true)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'A fájl típusa nem megfelelő. Csak PDF / DOC / DOCX fogadunk.']);
        exit;
    }

    // Cél-mappa: _uploads/karrier/ — DOCUMENT_ROOT alatt, .htaccess deny direkt
    // hozzáférésre. Webhook-deploy nem törli (gitignored), csak ezt a PHP-t.
    $uploadDir = realpath(__DIR__ . '/..') . '/_uploads/karrier';
    if (!is_dir($uploadDir)) @mkdir($uploadDir, 0750, true);

    // Sanitized fájlnév: timestamp + random + szűrt eredeti
    $sanitizedOrig = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
    if ($sanitizedOrig === '') $sanitizedOrig = 'cv';
    $sanitizedOrig = substr($sanitizedOrig, 0, 60);

    $stamp = date('Ymd-His');
    $rand  = bin2hex(random_bytes(4));
    $saveAs = "{$stamp}-{$rand}-{$sanitizedOrig}.{$ext}";
    $cvSavedPath = $uploadDir . '/' . $saveAs;

    if (!@move_uploaded_file($upload['tmp_name'], $cvSavedPath)) {
        // Ne álljon meg az egész form — naplózzuk és menjünk tovább SMTP-vel
        error_log('BK karrier: move_uploaded_file failed for ' . $origName);
        $cvSavedPath = null;
    } else {
        @chmod($cvSavedPath, 0640);
        $cvSavedName = $origName;
        $cvMimeType  = $detectedMime ?: 'application/octet-stream';
        $cvSize      = $upload['size'];
    }
}

// ── EMAIL TÖRZS ÖSSZEÁLLÍTÁSA ─────────────────────────────────────────────
$subjectText = 'Új karrier jelentkezés — bagolykaland.hu/karrier';

$body  = "ÚJ KARRIER JELENTKEZÉS — bagolykaland.hu/karrier\r\n";
$body .= str_repeat('=', 50) . "\r\n\r\n";
$body .= "Név:               {$name}\r\n";
$body .= "E-mail:            {$email}\r\n";
$body .= "Telefon:           {$phone}\r\n";
$body .= "Végzettség, szak:  {$education}\r\n";
$body .= "Időpont:           " . date('Y-m-d H:i:s') . "\r\n";
$body .= "\r\nSzakmai tapasztalat:\r\n" . str_repeat('-', 50) . "\r\n{$experience}\r\n";
if ($bio !== '') {
    $body .= "\r\nBemutatkozás:\r\n" . str_repeat('-', 50) . "\r\n{$bio}\r\n";
}
if ($cvSavedName !== null) {
    $body .= "\r\n→ Önéletrajz mellékletként csatolva: {$cvSavedName} (" . number_format($cvSize / 1024, 1) . " kB)\r\n";
} else {
    $body .= "\r\n→ Önéletrajz: nem csatolt — kérd be a jelölttől e-mailben, ha kell.\r\n";
}

// ── LOG ───────────────────────────────────────────────────────────────────
// A meglévő contact.php-vel azonos pattern: szöveges log, audit + diagnostic.
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0700, true);

$referer = $_SERVER['HTTP_REFERER']    ?? '';
$fbp     = $_COOKIE['_fbp']            ?? '';
$fbc     = $_COOKIE['_fbc']            ?? '';
$attrib  = $_COOKIE['bk_attrib']       ?? '';

$logLine = date('Y-m-d H:i:s')
    . " | " . $name
    . " | " . $email
    . " | " . $phone
    . " | edu=" . str_replace(['|', "\r", "\n"], ['/', ' ', ' '], $education)
    . " | xp_len=" . mb_strlen($experience)
    . " | bio_len=" . mb_strlen($bio)
    . " | cv=" . ($cvSavedName ? basename($cvSavedPath) : '-')
    . " | url=" . $pageUrl
    . " | ref=" . $referer
    . " | fbp=" . $fbp
    . " | fbc=" . $fbc
    . " | eid=" . $eventId
    . "\n";
@file_put_contents($logDir . '/karrier-submissions.log', $logLine, FILE_APPEND | LOCK_EX);

// ── META CAPI Lead esemény ────────────────────────────────────────────────
// Közös event_id-val a kliens-pixelre — Events Manager dedupol.
// content_category=career_application, value=8000 HUF (magyar piaci CPR ~8k).
require_once __DIR__ . '/meta-capi.php';
[$firstName, $lastName] = bk_meta_capi_split_name($name);
@bk_meta_capi_send(
    'Lead',
    $eventId ?: null,
    [
        'email'     => $email,
        'phone'     => $phone,
        'firstName' => $firstName,
        'lastName'  => $lastName,
    ],
    [
        'content_name'     => 'career_application',
        'content_category' => 'career_application',
        'value'            => 8000,
        'currency'         => 'HUF',
    ],
    $pageUrl ?: null
);

// ── SMTP ──────────────────────────────────────────────────────────────────
$recipients = ['info@bagolykaland.hu', 'fejlesztobagolyka@gmail.com', 'karolypaczari@gmail.com'];

$smtpConfig = __DIR__ . '/smtp-config.php';
if (file_exists($smtpConfig)) {
    require $smtpConfig;
    $sent = bk_karrier_smtp_send(
        $smtpHost, $smtpPort, $smtpUser, $smtpPass, $smtpFrom,
        $recipients, $subjectText, $body, $name, $email,
        $cvSavedPath, $cvSavedName, $cvMimeType
    );
    @touch($rateLimitFile);

    if ($sent === true) {
        echo json_encode(['ok' => true]);
    } else {
        // SMTP elbukott, de log + CV mentve van — a jelentkezés nem vész el.
        error_log('BK karrier SMTP error: ' . $sent);
        echo json_encode(['ok' => true]);
    }
    exit;
}

// SMTP-config hiányzik (új szerveren még nincs felrakva) — natív mail() fallback
// CV csatolmány nélkül megy, mert mail()-en multipart-ot kézzel kell összerakni.
$to       = implode(', ', $recipients);
$subject  = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
$headers  = "From: BagolykaLand <info@bagolykaland.hu>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8";
@mail($to, $subject, $body, $headers);

@touch($rateLimitFile);
echo json_encode(['ok' => true]);
exit;

// ─────────────────────────────────────────────────────────────────────────
// Raw SMTP helper — multipart/mixed bővítéssel a CV-csatolmányhoz.
// Alapja: api/contact.php bk_smtp_send(); itt boundary + base64-encoded
// attachment-rész is megy ha $cvPath nem null.
// ─────────────────────────────────────────────────────────────────────────
function bk_karrier_smtp_send(
    $host, $port, $user, $pass, $from, $recipients, $subject, $body,
    $replyName, $replyEmail, $cvPath, $cvName, $cvMime
) {
    $timeout = 30;
    $ssl = ($port == 465) ? 'ssl://' : '';
    $sock = @fsockopen($ssl . $host, $port, $errno, $errstr, $timeout);
    if (!$sock) return "fsockopen failed: {$errstr} ({$errno})";

    $cmd = function($command, $expect) use ($sock) {
        if ($command !== null) fwrite($sock, $command . "\r\n");
        $res = '';
        while (!feof($sock)) {
            $line = fgets($sock, 512);
            $res .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        $code = substr($res, 0, 3);
        return (strpos($expect, $code) !== false) ? true : $res;
    };

    $r = $cmd(null, '220');                              if ($r !== true) return "Greeting: $r";
    $r = $cmd("EHLO bagolykaland.hu", '250');            if ($r !== true) return "EHLO: $r";

    if ($port == 587) {
        $r = $cmd("STARTTLS", '220');                    if ($r !== true) return "STARTTLS: $r";
        stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $r = $cmd("EHLO bagolykaland.hu", '250');        if ($r !== true) return "EHLO2: $r";
    }

    $r = $cmd("AUTH LOGIN", '334');                      if ($r !== true) return "AUTH: $r";
    $r = $cmd(base64_encode($user), '334');              if ($r !== true) return "USER: $r";
    $r = $cmd(base64_encode($pass), '235');              if ($r !== true) return "PASS: $r";
    $r = $cmd("MAIL FROM:<{$from}>", '250');             if ($r !== true) return "MAIL FROM: $r";

    foreach ($recipients as $rcpt) {
        $r = $cmd("RCPT TO:<{$rcpt}>", '250251');
        if ($r !== true) return "RCPT TO {$rcpt}: $r";
    }

    $r = $cmd("DATA", '354');                            if ($r !== true) return "DATA: $r";

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $toHeader = implode(', ', $recipients);
    $msgId = '<' . bin2hex(random_bytes(16)) . '@bagolykaland.hu>';
    $boundary = '=_bk_' . bin2hex(random_bytes(12));

    $hasAttachment = ($cvPath !== null && file_exists($cvPath));

    $headers  = "From: BagolykaLand <{$from}>\r\n";
    $headers .= "Reply-To: {$replyName} <{$replyEmail}>\r\n";
    $headers .= "To: {$toHeader}\r\n";
    $headers .= "Subject: {$encodedSubject}\r\n";
    $headers .= "Message-ID: {$msgId}\r\n";
    $headers .= "Date: " . date('r') . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";

    if ($hasAttachment) {
        $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

        $message  = "This is a multi-part message in MIME format.\r\n\r\n";
        // 1. rész: text/plain (a jelentkezés szövege)
        $message .= "--{$boundary}\r\n";
        $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $message .= chunk_split(base64_encode($body));
        // 2. rész: a CV csatolmány
        $cvData = @file_get_contents($cvPath);
        if ($cvData !== false) {
            $cvFilenameEncoded = '=?UTF-8?B?' . base64_encode($cvName) . '?=';
            $message .= "\r\n--{$boundary}\r\n";
            $message .= "Content-Type: {$cvMime}; name=\"{$cvFilenameEncoded}\"\r\n";
            $message .= "Content-Transfer-Encoding: base64\r\n";
            $message .= "Content-Disposition: attachment; filename=\"{$cvFilenameEncoded}\"\r\n\r\n";
            $message .= chunk_split(base64_encode($cvData));
        }
        $message .= "\r\n--{$boundary}--\r\n";
    } else {
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "Content-Transfer-Encoding: base64\r\n";
        $message = chunk_split(base64_encode($body));
    }

    $r = $cmd($headers . "\r\n" . $message . "\r\n.", '250');
    if ($r !== true) return "BODY: $r";

    $cmd("QUIT", '221');
    fclose($sock);
    return true;
}
