<?php
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/mail-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

// Honeypot: реальные посетители не видят и не заполняют это поле, боты — заполняют.
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

// Анти-бот: форма заполнена подозрительно быстро (меньше 2 секунд) — скорее всего бот.
if (isset($_POST['form_loaded_at']) && is_numeric($_POST['form_loaded_at'])) {
    $elapsed = microtime(true) - ((float) $_POST['form_loaded_at'] / 1000);
    if ($elapsed >= 0 && $elapsed < 2) {
        echo json_encode(['ok' => true]);
        exit;
    }
}

function clean_field($value) {
    // Убираем переводы строк и лишние пробелы — защита от инъекции заголовков письма.
    $value = str_replace(["\r", "\n"], ' ', (string) $value);
    return trim($value);
}

$to = defined('MAIL_TO') && MAIL_TO !== '' ? MAIL_TO : 'contact@body-way.ru';

$fieldLabels = [
    'name' => 'Имя',
    'company' => 'Компания',
    'phone' => 'Телефон',
    'email' => 'Email',
    'contact' => 'Способ связи',
    'interests' => 'Интересует',
    'message' => 'Комментарий',
    'rating' => 'Оценка',
    'review' => 'Текст отзыва',
    'consent' => 'Согласие на обработку данных',
];

$contactLabels = [
    'whatsapp' => 'WhatsApp',
    'telegram' => 'Telegram',
    'phone' => 'По телефону',
    'max' => 'Max',
];

$source = isset($_POST['form_source']) && clean_field($_POST['form_source']) !== ''
    ? clean_field($_POST['form_source'])
    : 'Сайт BodyWay';

$lines = [];
foreach ($fieldLabels as $key => $label) {
    if (empty($_POST[$key])) {
        continue;
    }

    if (is_array($_POST[$key])) {
        $items = array_map('clean_field', $_POST[$key]);
        $items = array_filter($items, function ($item) { return $item !== ''; });
        if (empty($items)) {
            continue;
        }
        $value = implode(', ', $items);
    } else {
        $value = clean_field($_POST[$key]);
    }

    if ($key === 'contact' && isset($contactLabels[$value])) {
        $value = $contactLabels[$value];
    }

    if ($key === 'consent') {
        $value = 'Да';
    }

    if ($key === 'rating') {
        $value = $value . ' из 5';
    }

    if ($value === '') {
        continue;
    }

    $lines[] = $label . ': ' . $value;
}

if (empty($lines)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty_form']);
    exit;
}

$subject = 'Новая заявка с сайта — ' . $source;
$body = implode("\n", $lines) . "\n\nИсточник: " . $source . "\nДата: " . date('d.m.Y H:i');

$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'body-way.ru';
$fromFallback = 'no-reply@' . $host;

$sent = false;

if (defined('SMTP_HOST') && SMTP_HOST !== '' && SMTP_USER !== '' && SMTP_PASS !== '') {
    $sent = smtp_send(
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        SMTP_USER,
        $to,
        $subject,
        $body
    );
}

// Если SMTP не настроен или отправка не удалась — пробуем встроенную mail() как запасной вариант.
if (!$sent) {
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: Сайт BodyWay <' . $fromFallback . '>',
    ];
    $sent = mail($to, $encodedSubject, $body, implode("\r\n", $headers));
}

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mail_failed']);
}

/**
 * Отправка письма через SMTP с авторизацией (STARTTLS + AUTH LOGIN).
 * Без сторонних библиотек — чтобы работало на любом PHP-хостинге без composer.
 */
function smtp_send($host, $port, $username, $password, $from, $to, $subject, $body) {
    $socket = @fsockopen($host, (int) $port, $errno, $errstr, 15);
    if (!$socket) {
        return false;
    }

    $readResponse = function () use ($socket) {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $response;
    };

    $expect = function ($code) use ($readResponse) {
        return substr($readResponse(), 0, 3) === (string) $code;
    };

    $readResponse(); // приветствие сервера

    fputs($socket, "EHLO " . $host . "\r\n");
    $readResponse();

    fputs($socket, "STARTTLS\r\n");
    if (!$expect(220)) {
        fclose($socket);
        return false;
    }

    if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        fclose($socket);
        return false;
    }

    fputs($socket, "EHLO " . $host . "\r\n");
    $readResponse();

    fputs($socket, "AUTH LOGIN\r\n");
    if (!$expect(334)) {
        fclose($socket);
        return false;
    }

    fputs($socket, base64_encode($username) . "\r\n");
    if (!$expect(334)) {
        fclose($socket);
        return false;
    }

    fputs($socket, base64_encode($password) . "\r\n");
    if (!$expect(235)) {
        fclose($socket);
        return false;
    }

    fputs($socket, "MAIL FROM:<{$from}>\r\n");
    if (!$expect(250)) {
        fclose($socket);
        return false;
    }

    fputs($socket, "RCPT TO:<{$to}>\r\n");
    if (!$expect(250)) {
        fclose($socket);
        return false;
    }

    fputs($socket, "DATA\r\n");
    if (!$expect(354)) {
        fclose($socket);
        return false;
    }

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = "From: {$from}\r\nTo: {$to}\r\nSubject: {$encodedSubject}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    $message = $headers . "\r\n" . $body . "\r\n.\r\n";

    fputs($socket, $message);
    if (!$expect(250)) {
        fclose($socket);
        return false;
    }

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return true;
}
