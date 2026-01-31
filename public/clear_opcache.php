<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OpCache reset successful.";
} else {
    echo "OpCache not enabled or function not available.";
}
unlink(__FILE__); // Self-destruct for security
