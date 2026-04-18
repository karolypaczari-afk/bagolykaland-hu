<?php
// Copy this file to admin-config.php and fill in the password hash.
// admin-config.php is gitignored — never commit it.
//
// Generate a password hash from the command line (on Hostinger or locally):
//   php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT) . PHP_EOL;"
//
// Then paste the resulting hash (starts with $2y$...) below.

$adminPasswordHash = '$2y$10$EXAMPLEHASHREPLACETHISWITHAREALONEXXXXXXXXXXXXXXXXXXXX';
