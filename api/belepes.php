<?php
/**
 * BAGOLYKALAND.HU — Form Submissions Admin Viewer
 * Password-protected. Reads api/logs/submissions.log and renders a table.
 * Config: api/admin-config.php (not committed to git)
 */

session_start();

$configFile = __DIR__ . '/admin-config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo '<h1>Config hiányzik</h1><p>Másold az <code>admin-config.example.php</code> fájlt <code>admin-config.php</code> néven és állítsd be a jelszó hash-t.</p>';
    exit;
}
require $configFile;

$logFile = __DIR__ . '/logs/submissions.log';

// ── Logout ────────────────────────────────────────────────────────────────
if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: belepes.php');
    exit;
}

// ── CSV export ────────────────────────────────────────────────────────────
if (isset($_GET['export']) && !empty($_SESSION['bk_admin_auth'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="bagolykaland-submissions-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel
    fputcsv($out, ['Időpont', 'Név', 'E-mail', 'Telefon', 'Program', 'Üzenet'], ';');
    if (file_exists($logFile)) {
        foreach (array_reverse(file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)) as $line) {
            $parts = explode(' | ', $line, 6);
            while (count($parts) < 6) $parts[] = '';
            fputcsv($out, $parts, ';');
        }
    }
    fclose($out);
    exit;
}

// ── Login ─────────────────────────────────────────────────────────────────
$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    // Rate limit login attempts
    $rateDir = sys_get_temp_dir() . '/bk_admin_rate';
    if (!is_dir($rateDir)) @mkdir($rateDir, 0700, true);
    $ipHash = md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $rateFile = $rateDir . '/' . $ipHash;
    $lastAttempt = file_exists($rateFile) ? filemtime($rateFile) : 0;
    $windowExpired = (time() - $lastAttempt) >= 300;
    $attempts = ($windowExpired || !file_exists($rateFile)) ? 0 : (int) file_get_contents($rateFile);

    if ($attempts >= 5) {
        $loginError = 'Túl sok sikertelen próbálkozás. Várj 5 percet.';
    } elseif (password_verify($_POST['password'], $adminPasswordHash)) {
        $_SESSION['bk_admin_auth'] = true;
        @unlink($rateFile);
        session_regenerate_id(true);
        header('Location: belepes.php');
        exit;
    } else {
        file_put_contents($rateFile, $attempts + 1);
        $loginError = 'Hibás jelszó.';
    }
}

$isAuthed = !empty($_SESSION['bk_admin_auth']);

// ── Parse log entries ─────────────────────────────────────────────────────
$entries = [];
if ($isAuthed && file_exists($logFile)) {
    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach (array_reverse($lines) as $line) {
        $parts = explode(' | ', $line, 6);
        while (count($parts) < 6) $parts[] = '';
        $entries[] = [
            'time'    => $parts[0],
            'name'    => $parts[1],
            'email'   => $parts[2],
            'phone'   => $parts[3],
            'program' => $parts[4],
            'message' => $parts[5],
        ];
    }
}

// Simple search filter (client-side is fine but server-side scales too)
$filter = isset($_GET['q']) ? trim($_GET['q']) : '';
if ($filter !== '') {
    $q = mb_strtolower($filter);
    $entries = array_filter($entries, function ($e) use ($q) {
        $haystack = mb_strtolower(implode(' ', $e));
        return strpos($haystack, $q) !== false;
    });
}

function h($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
?>
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Belépés – Formkitöltések · BagolykaLand</title>
  <style>
    :root {
      --navy: #1D3557;
      --teal: #2B746D;
      --teal-dark: #1F5E59;
      --teal-light: #E0F5F3;
      --coral: #B35431;
      --bg: #FAFAF7;
      --text: #1A1A1A;
      --muted: #666;
      --border: #E5E5E0;
      --danger: #B8362E;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      line-height: 1.5;
    }
    .page-header {
      background: var(--navy);
      color: #fff;
      padding: 1.25rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-header h1 { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .page-header .sub { color: #B8C9DC; font-size: 0.85rem; }
    .logout { color: #fff; text-decoration: none; font-size: 0.9rem; opacity: 0.85; }
    .logout:hover { opacity: 1; text-decoration: underline; }
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    .toolbar {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .toolbar input[type="search"] {
      flex: 1;
      min-width: 220px;
      padding: 0.6rem 0.9rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.95rem;
      background: #fff;
    }
    .toolbar input[type="search"]:focus {
      outline: none;
      border-color: var(--teal);
      box-shadow: 0 0 0 3px rgba(43, 116, 109, 0.15);
    }
    .btn {
      display: inline-block;
      padding: 0.55rem 1.1rem;
      border-radius: 8px;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-teal { background: var(--teal); color: #fff; }
    .btn-teal:hover { background: var(--teal-dark); }
    .btn-outline {
      background: #fff;
      color: var(--teal);
      border: 1px solid var(--teal);
    }
    .btn-outline:hover { background: var(--teal-light); }
    .stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .stats strong { color: var(--navy); font-size: 1.1rem; }

    /* Table */
    .table-wrap {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: var(--teal-light);
      color: var(--teal-dark);
      font-weight: 700;
      text-align: left;
      padding: 0.85rem 1rem;
      font-size: 0.85rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    tbody td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.92rem;
      vertical-align: top;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #FBFBF9; }
    .col-time { white-space: nowrap; color: var(--muted); font-variant-numeric: tabular-nums; font-size: 0.85rem; }
    .col-name { font-weight: 600; color: var(--navy); }
    .col-email a, .col-phone a { color: var(--teal); text-decoration: none; }
    .col-email a:hover, .col-phone a:hover { text-decoration: underline; }
    .col-program .tag {
      display: inline-block;
      background: #FFF2D4;
      color: #8A6614;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .col-message { max-width: 420px; color: var(--text); white-space: pre-wrap; word-break: break-word; }
    .empty {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--muted);
    }
    .empty h2 { color: var(--navy); margin-bottom: 0.5rem; }

    /* Login */
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, var(--navy) 0%, var(--teal-dark) 100%);
    }
    .login-card {
      background: #fff;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 400px;
    }
    .login-card h1 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      color: var(--navy);
    }
    .login-card p.lead { color: var(--muted); margin: 0 0 1.5rem; font-size: 0.9rem; }
    .login-card label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--navy);
      margin-bottom: 0.5rem;
    }
    .login-card input[type="password"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .login-card input[type="password"]:focus {
      outline: none;
      border-color: var(--teal);
      box-shadow: 0 0 0 3px rgba(43, 116, 109, 0.15);
    }
    .login-card button { width: 100%; padding: 0.75rem; font-size: 1rem; }
    .error {
      background: #FDECEA;
      color: var(--danger);
      padding: 0.7rem 0.9rem;
      border-radius: 8px;
      font-size: 0.88rem;
      margin-bottom: 1rem;
      border: 1px solid #F5C8C4;
    }

    @media (max-width: 700px) {
      .container { padding: 1rem; }
      .page-header { padding: 1rem; }
      thead { display: none; }
      tbody td { display: block; border-bottom: none; padding: 0.35rem 1rem; }
      tbody tr {
        display: block;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border);
      }
      tbody tr:last-child { border-bottom: none; }
      tbody td::before {
        content: attr(data-label) ": ";
        font-weight: 700;
        color: var(--teal-dark);
        font-size: 0.8rem;
        text-transform: uppercase;
      }
      .col-message { max-width: 100%; }
    }
  </style>
</head>
<body>

<?php if (!$isAuthed): ?>
  <div class="login-wrap">
    <form class="login-card" method="post" action="belepes.php">
      <h1>Belépés</h1>
      <p class="lead">Formkitöltések megtekintéséhez add meg a jelszót.</p>
      <?php if ($loginError): ?>
        <div class="error"><?= h($loginError) ?></div>
      <?php endif; ?>
      <label for="pw">Jelszó</label>
      <input id="pw" type="password" name="password" required autofocus autocomplete="current-password">
      <button type="submit" class="btn btn-teal">Belépés</button>
    </form>
  </div>

<?php else: ?>
  <header class="page-header">
    <div>
      <h1>Formkitöltések</h1>
      <div class="sub">BagolykaLand · <?= date('Y-m-d H:i') ?></div>
    </div>
    <a href="belepes.php?logout=1" class="logout">Kilépés →</a>
  </header>

  <div class="container">
    <div class="stats">
      <div><strong><?= count($entries) ?></strong> beküldés <?= $filter !== '' ? 'a szűrésben' : 'összesen' ?></div>
      <?php if (file_exists($logFile)): ?>
        <div>Utolsó módosítás: <strong><?= date('Y-m-d H:i', filemtime($logFile)) ?></strong></div>
      <?php endif; ?>
    </div>

    <form class="toolbar" method="get" action="belepes.php">
      <input type="search" name="q" placeholder="Keresés név, e-mail, üzenet szerint…" value="<?= h($filter) ?>">
      <button type="submit" class="btn btn-teal">Keresés</button>
      <?php if ($filter !== ''): ?>
        <a href="belepes.php" class="btn btn-outline">Szűrés törlése</a>
      <?php endif; ?>
      <a href="belepes.php?export=csv" class="btn btn-outline">CSV export</a>
    </form>

    <?php if (empty($entries)): ?>
      <div class="table-wrap empty">
        <h2><?= $filter !== '' ? 'Nincs találat' : 'Még nincs beküldés' ?></h2>
        <p><?= $filter !== '' ? 'Próbáld más kulcsszóval.' : 'Amint valaki kitölt egy formot, itt fog megjelenni.' ?></p>
      </div>
    <?php else: ?>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Időpont</th>
              <th>Név</th>
              <th>E-mail</th>
              <th>Telefon</th>
              <th>Program</th>
              <th>Üzenet</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($entries as $e): ?>
              <tr>
                <td data-label="Időpont" class="col-time"><?= h($e['time']) ?></td>
                <td data-label="Név" class="col-name"><?= h($e['name']) ?></td>
                <td data-label="E-mail" class="col-email">
                  <?php if ($e['email']): ?>
                    <a href="mailto:<?= h($e['email']) ?>"><?= h($e['email']) ?></a>
                  <?php endif; ?>
                </td>
                <td data-label="Telefon" class="col-phone">
                  <?php if ($e['phone']): ?>
                    <a href="tel:<?= h(preg_replace('/[^+0-9]/', '', $e['phone'])) ?>"><?= h($e['phone']) ?></a>
                  <?php endif; ?>
                </td>
                <td data-label="Program" class="col-program">
                  <?php if ($e['program']): ?>
                    <span class="tag"><?= h($e['program']) ?></span>
                  <?php endif; ?>
                </td>
                <td data-label="Üzenet" class="col-message"><?= h($e['message']) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
<?php endif; ?>

</body>
</html>
