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
            $this->api_token    = $this->get_option('api_token');

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
                'api_token' => [
                    'title'       => __('API Token', 'bulwarkx'),
                    'type'        => 'password',
                    'description' => __('BulwarkX API token for this store.', 'bulwarkx'),
                ]
            ];
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);

            // TODO (later):
            // 1. Call BulwarkX backend /api/invoices to create an escrow invoice
            // 2. Redirect customer to a hosted BulwarkX payment page or show QR

            return [
                'result'   => 'success',
                'redirect' => $order->get_checkout_order_received_url()
            ];
        }
    }
}
