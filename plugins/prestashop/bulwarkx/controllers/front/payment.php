<?php
class BulwarkxPaymentModuleFrontController extends ModuleFrontController
{
    public $ssl = true;

    public function initContent()
    {
        parent::initContent();

        if (!$this->module->active) {
            Tools::redirect('index.php?controller=order&step=1');
        }

        $cart = $this->context->cart;
        if (!$cart->id_customer || !$cart->id_address_delivery || !$cart->id_address_invoice || !$this->module->active) {
            Tools::redirect('index.php?controller=order&step=1');
        }

        $payee = Configuration::get(Bulwarkx::CONFIG_PAYEE_ADDRESS);
        $arbiter = Configuration::get(Bulwarkx::CONFIG_ARBITER_ADDRESS);
        $auto_release = (int) Configuration::get(Bulwarkx::CONFIG_AUTO_RELEASE_SECONDS);
        $api_base = Configuration::get(Bulwarkx::CONFIG_API_BASE_URL);

        $amount = (string) Tools::ps_round($cart->getOrderTotal(true, Cart::BOTH), 6);

        try {
            $response = $this->createInvoice($api_base, $payee, $arbiter, $auto_release, $amount);
        } catch (Exception $e) {
            $this->context->smarty->assign([
                'error' => $e->getMessage(),
            ]);
            return $this->setTemplate('module:bulwarkx/views/templates/front/payment_execution.tpl');
        }

        $invoiceId = isset($response['invoiceId']) ? $response['invoiceId'] : '';
        $escrowId = isset($response['escrowId']) ? $response['escrowId'] : '';
        $paymentUrl = isset($response['paymentUrl']) ? $response['paymentUrl'] : '';

        $customer = new Customer($cart->id_customer);
        $comment = sprintf($this->module->l('BulwarkX invoice %s / escrow %s created', 'payment'), $invoiceId, $escrowId);

        $this->module->validateOrder(
            (int) $cart->id,
            (int) Configuration::get('PS_OS_PREPARATION'),
            $cart->getOrderTotal(true, Cart::BOTH),
            $this->module->displayName,
            $comment,
            [],
            (int) $cart->id_currency,
            false,
            $customer->secure_key
        );

        if ($paymentUrl) {
            Tools::redirect($paymentUrl);
        }

        $this->context->smarty->assign([
            'error' => $this->module->l('Missing payment URL from BulwarkX response', 'payment'),
        ]);
        $this->setTemplate('module:bulwarkx/views/templates/front/payment_execution.tpl');
    }

    private function createInvoice($api_base_url, $payee_address, $arbiter_address, $auto_release_seconds, $amount_eth)
    {
        $endpoint = rtrim($api_base_url, '/') . '/api/invoices';
        $payload = json_encode([
            'payeeAddress' => $payee_address,
            'arbiterAddress' => $arbiter_address,
            'autoReleaseSeconds' => (int) $auto_release_seconds,
            'amountEth' => (string) $amount_eth,
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
