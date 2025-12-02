<?php
class BulwarkxApiClient {
    public function createInvoice($api_base_url, $payee_address, $arbiter_address, $auto_release_seconds, $amount_eth) {
        $endpoint = rtrim($api_base_url, '/') . '/api/invoices';

        $payload = json_encode([
            'payeeAddress' => $payee_address,
            'arbiterAddress' => $arbiter_address,
            'autoReleaseSeconds' => (int)$auto_release_seconds,
            'amountEth' => (string)$amount_eth,
        ]);

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

        $response = curl_exec($ch);

        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception('cURL error: ' . $error);
        }

        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($response, true);

        if ($status < 200 || $status >= 300) {
            $message = isset($decoded['message']) ? $decoded['message'] : 'HTTP ' . $status;
            throw new Exception('BulwarkX API error: ' . $message);
        }

        if (!is_array($decoded)) {
            throw new Exception('Unable to decode BulwarkX response');
        }

        return $decoded;
    }
}
