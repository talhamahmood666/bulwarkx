<?php
/**
 * Plugin Name: BulwarkX – Crypto Escrow Gateway
 * Description: Accept non-custodial crypto escrow payments via BulwarkX.
 * Author: BulwarkX
 * Version: 0.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

add_filter('woocommerce_payment_gateways', 'bulwarkx_add_gateway_class');
function bulwarkx_add_gateway_class($gateways) {
    $gateways[] = 'WC_BulwarkX_Gateway';
    return $gateways;
}

add_action('plugins_loaded', 'bulwarkx_init_gateway_class');
function bulwarkx_init_gateway_class() {

    class WC_BulwarkX_Gateway extends WC_Payment_Gateway {

        public function __construct() {
            $this->id                 = 'bulwarkx_gateway';
            $this->icon               = ''; // TODO: add logo URL
            $this->has_fields         = false;
            $this->method_title       = __('BulwarkX Crypto Escrow', 'bulwarkx');
            $this->method_description = __('Pay with non-custodial crypto escrow via BulwarkX.', 'bulwarkx');

            $this->init_form_fields();
            $this->init_settings();

            $this->title        = $this->get_option('title');
            $this->description  = $this->get_option('description');
            $this->enabled      = $this->get_option('enabled');
            $this->api_base_url = $this->get_option('api_base_url');
            $this->api_key      = $this->get_option('api_key');
            $this->payee_address = $this->get_option('payee_address');
            $this->arbiter_address = $this->get_option('arbiter_address');
            $this->auto_release_seconds = (int) $this->get_option('auto_release_seconds', 86400);

            add_action(
                'woocommerce_update_options_payment_gateways_' . $this->id,
                [$this, 'process_admin_options']
            );
        }

        public function init_form_fields() {
            $this->form_fields = [
                'enabled' => [
                    'title'   => __('Enable/Disable', 'bulwarkx'),
                    'type'    => 'checkbox',
                    'label'   => __('Enable BulwarkX crypto escrow payments', 'bulwarkx'),
                    'default' => 'yes'
                ],
                'title' => [
                    'title'       => __('Title', 'bulwarkx'),
                    'type'        => 'text',
                    'description' => __('Payment method title seen on checkout.', 'bulwarkx'),
                    'default'     => __('Crypto Escrow (BulwarkX)', 'bulwarkx'),
                ],
                'description' => [
                    'title'       => __('Description', 'bulwarkx'),
                    'type'        => 'textarea',
                    'default'     => __('Pay securely with non-custodial crypto escrow via BulwarkX.', 'bulwarkx'),
                ],
                'api_base_url' => [
                    'title'       => __('API Base URL', 'bulwarkx'),
                    'type'        => 'text',
                    'description' => __('Your BulwarkX backend URL, e.g. https://api.bulwarkx.com', 'bulwarkx'),
                ],
                'api_key' => [
                    'title'       => __('API Key', 'bulwarkx'),
                    'type'        => 'password',
                    'description' => __('BulwarkX API key for this store.', 'bulwarkx'),
                ],
                'payee_address' => [
                    'title'       => __('Payee Address', 'bulwarkx'),
                    'type'        => 'text',
                    'description' => __('Merchant EVM address that receives escrow funds.', 'bulwarkx'),
                ],
                'arbiter_address' => [
                    'title'       => __('Arbiter Address', 'bulwarkx'),
                    'type'        => 'text',
                    'description' => __('Arbiter EVM address for dispute resolution.', 'bulwarkx'),
                ],
                'auto_release_seconds' => [
                    'title'       => __('Auto Release Seconds', 'bulwarkx'),
                    'type'        => 'number',
                    'description' => __('Time in seconds before escrow can auto-release to merchant (default 86400).', 'bulwarkx'),
                    'default'     => 86400,
                ]
            ];
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            if (!$order) {
                wc_add_notice(__('Unable to process order.', 'bulwarkx'), 'error');
                return ['result' => 'failure'];
            }

            if (empty($this->api_base_url) || empty($this->payee_address) || empty($this->arbiter_address)) {
                wc_add_notice(__('BulwarkX gateway is not configured. Please contact the store owner.', 'bulwarkx'), 'error');
                return ['result' => 'failure'];
            }

            $payload = [
                'payeeAddress'       => $this->payee_address,
                'arbiterAddress'     => $this->arbiter_address,
                'autoReleaseSeconds' => $this->auto_release_seconds,
                'amountEth'          => wc_format_decimal($order->get_total(), 8),
            ];

            $args = [
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
                'body'    => wp_json_encode($payload),
                'timeout' => 20,
            ];

            if (!empty($this->api_key)) {
                $args['headers']['X-API-Key'] = $this->api_key;
            }

            $endpoint = rtrim($this->api_base_url, '/') . '/api/invoices';
            $response = wp_remote_post($endpoint, $args);

            if (is_wp_error($response)) {
                wc_add_notice(__('Payment error: could not reach BulwarkX.', 'bulwarkx'), 'error');
                return ['result' => 'failure'];
            }

            $status_code = wp_remote_retrieve_response_code($response);
            $body        = json_decode(wp_remote_retrieve_body($response), true);

            if ($status_code !== 200 || !is_array($body) || empty($body['paymentUrl'])) {
                wc_add_notice(__('Payment error: BulwarkX invoice could not be created.', 'bulwarkx'), 'error');
                return ['result' => 'failure'];
            }

            if (!empty($body['invoiceId'])) {
                $order->update_meta_data('bulwarkx_invoice_id', sanitize_text_field($body['invoiceId']));
            }

            if (!empty($body['escrowId'])) {
                $order->update_meta_data('bulwarkx_escrow_id', sanitize_text_field($body['escrowId']));
            }

            $order->update_status('pending', __('Awaiting BulwarkX payment', 'bulwarkx'));
            $order->save();

            return [
                'result'   => 'success',
                'redirect' => esc_url_raw($body['paymentUrl'])
            ];
        }
    }
}
