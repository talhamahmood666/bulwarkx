<?php
class ControllerExtensionPaymentBulwarkx extends Controller {
    public function index() {
        $this->load->language('extension/payment/bulwarkx');

        $data['text_title'] = $this->language->get('text_title');
        $data['text_description'] = $this->language->get('text_description');
        $data['action'] = $this->url->link('extension/payment/bulwarkx/confirm', '', true);

        return $this->load->view('extension/payment/bulwarkx', $data);
    }

    public function confirm() {
        if (!isset($this->session->data['order_id'])) {
            $this->response->redirect($this->url->link('checkout/checkout'));
            return;
        }

        $this->load->language('extension/payment/bulwarkx');
        $this->load->model('checkout/order');

        $order_id = $this->session->data['order_id'];
        $order_info = $this->model_checkout_order->getOrder($order_id);

        if (!$order_info) {
            $this->response->redirect($this->url->link('checkout/cart'));
            return;
        }

        $api_base_url = rtrim($this->config->get('bulwarkx_api_base_url'), '/');
        $payee_address = $this->config->get('bulwarkx_payee_address');
        $arbiter_address = $this->config->get('bulwarkx_arbiter_address');
        $auto_release_seconds = (int)$this->config->get('bulwarkx_auto_release_seconds');

        $amount_eth = (string)$order_info['total'];

        $this->load->library('bulwarkx_api_client');
        $client = new BulwarkxApiClient();

        try {
            $result = $client->createInvoice(
                $api_base_url,
                $payee_address,
                $arbiter_address,
                $auto_release_seconds,
                $amount_eth
            );
        } catch (Exception $e) {
            $message = $this->language->get('error_api') . ' ' . $e->getMessage();
            $this->model_checkout_order->addOrderHistory(
                $order_id,
                $order_info['order_status_id'],
                $message,
                true
            );

            $data['heading_title'] = $this->language->get('text_title');
            $data['text_message'] = $message;
            $data['text_continue'] = $this->language->get('text_continue');
            $data['continue'] = $this->url->link('checkout/checkout');

            $this->response->setOutput($this->load->view('extension/payment/bulwarkx_error', $data));
            return;
        }

        $invoice_id = isset($result['invoiceId']) ? $result['invoiceId'] : '';
        $escrow_id = isset($result['escrowId']) ? $result['escrowId'] : '';
        $payment_url = isset($result['paymentUrl']) ? $result['paymentUrl'] : '';

        $comment = sprintf(
            $this->language->get('text_order_comment'),
            $invoice_id,
            $escrow_id
        );

        $order_status_id = $order_info['order_status_id'] ?: $this->config->get('config_order_status_id');

        $this->model_checkout_order->addOrderHistory(
            $order_id,
            $order_status_id,
            $comment,
            true
        );

        if ($payment_url) {
            $this->response->redirect($payment_url);
            return;
        }

        $data['heading_title'] = $this->language->get('text_title');
        $data['text_message'] = $this->language->get('error_missing_payment_url');
        $data['text_continue'] = $this->language->get('text_continue');
        $data['continue'] = $this->url->link('checkout/checkout');

        $this->response->setOutput($this->load->view('extension/payment/bulwarkx_error', $data));
    }
}
