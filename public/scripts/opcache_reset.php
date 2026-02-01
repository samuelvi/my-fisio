<?php
/**
 * Agnostic OpCache Reset Script
 * This script clears the opcode cache for environments where CLI and Web processes are separate.
 */
if (function_exists('opcache_reset')) {
    if (opcache_reset()) {
        echo "OpCache reset successful.";
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo "OpCache reset failed.";
    }
} else {
    header('HTTP/1.1 400 Bad Request');
    echo "OpCache is not enabled or function is not available.";
}
// For security, you might want to delete this file after use or protect it via .htaccess
