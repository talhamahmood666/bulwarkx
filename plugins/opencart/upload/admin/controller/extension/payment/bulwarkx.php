<?php
class ControllerExtensionPaymentBulwarkx extends Controller {
    private $error = [];

    public function index() {
        $this->load->language('extension/payment/bulwarkx');
        $this->document->setTitle($this->language->get('heading_title'));

        $this->load->model('setting/setting');

        if ($this->request->server['REQUEST_METHOD'] == 'POST' && $this->validate()) {
            $this->model_setting_setting->editSetting('bulwarkx', $this->request->post);

            $this->session->data['success'] = $this->language->get('text_success');

            $this->response->redirect(
                $this->url->link(
                    'marketplace/extension',
                    'user_token=' . $this->session->data['user_token'] . '&type=payment',
                    true
                )
            );
        }

        $data['heading_title'] = $this->language->get('heading_title');
        $data['text_edit'] = $this->language->get('text_edit');
        $data['text_enabled'] = $this->language->get('text_enabled');
        $data['text_disabled'] = $this->language->get('text_disabled');
        $data['text_all_zones'] = $this->language->get('text_all_zones');

        $data['entry_status'] = $this->language->get('entry_status');
        $data['entry_sort_order'] = $this->language->get('entry_sort_order');
        $data['entry_api_base_url'] = $this->language->get('entry_api_base_url');
        $data['entry_payee_address'] = $this->language->get('entry_payee_address');
        $data['entry_arbiter_address'] = $this->language->get('entry_arbiter_address');
        $data['entry_auto_release_seconds'] = $this->language->get('entry_auto_release_seconds');

        $data['button_save'] = $this->language->get('button_save');
        $data['button_cancel'] = $this->language->get('button_cancel');

        $data['breadcrumbs'] = [];

        $data['breadcrumbs'][] = [
            'text' => $this->language->get('text_home'),
            'href' => $this->url->link('common/dashboard', 'user_token=' . $this->session->data['user_token'], true)
        ];

        $data['breadcrumbs'][] = [
            'text' => $this->language->get('text_extension'),
            'href' => $this->url->link(
                'marketplace/extension',
                'user_token=' . $this->session->data['user_token'] . '&type=payment',
                true
            )
        ];

        $data['breadcrumbs'][] = [
            'text' => $this->language->get('heading_title'),
            'href' => $this->url->link(
                'extension/payment/bulwarkx',
                'user_token=' . $this->session->data['user_token'],
                true
            )
        ];

        $data['error_warning'] = isset($this->error['warning']) ? $this->error['warning'] : '';
        $data['error_api_base_url'] = isset($this->error['api_base_url']) ? $this->error['api_base_url'] : '';
        $data['error_payee_address'] = isset($this->error['payee_address']) ? $this->error['payee_address'] : '';
        $data['error_arbiter_address'] = isset($this->error['arbiter_address']) ? $this->error['arbiter_address'] : '';
        $data['error_auto_release_seconds'] = isset($this->error['auto_release_seconds']) ? $this->error['auto_release_seconds'] : '';

        $data['action'] = $this->url->link(
            'extension/payment/bulwarkx',
            'user_token=' . $this->session->data['user_token'],
            true
        );

        $data['cancel'] = $this->url->link(
            'marketplace/extension',
            'user_token=' . $this->session->data['user_token'] . '&type=payment',
            true
        );

        $config_keys = [
            'bulwarkx_status',
            'bulwarkx_sort_order',
            'bulwarkx_api_base_url',
            'bulwarkx_payee_address',
            'bulwarkx_arbiter_address',
            'bulwarkx_auto_release_seconds'
        ];

        foreach ($config_keys as $key) {
            if (isset($this->request->post[$key])) {
                $data[$key] = $this->request->post[$key];
            } else {
                $data[$key] = $this->config->get($key);
            }
        }

        $data['header'] = $this->load->controller('common/header');
        $data['column_left'] = $this->load->controller('common/column_left');
        $data['footer'] = $this->load->controller('common/footer');

        $this->response->setOutput($this->load->view('extension/payment/bulwarkx', $data));
    }

    protected function validate() {
        if (!$this->user->hasPermission('modify', 'extension/payment/bulwarkx')) {
            $this->error['warning'] = $this->language->get('error_permission');
        }

        if (empty($this->request->post['bulwarkx_api_base_url'])) {
            $this->error['api_base_url'] = $this->language->get('error_api_base_url');
        }

        if (empty($this->request->post['bulwarkx_payee_address'])) {
            $this->error['payee_address'] = $this->language->get('error_payee_address');
        }

        if (empty($this->request->post['bulwarkx_arbiter_address'])) {
            $this->error['arbiter_address'] = $this->language->get('error_arbiter_address');
        }

        if (empty($this->request->post['bulwarkx_auto_release_seconds']) || (int)$this->request->post['bulwarkx_auto_release_seconds'] <= 0) {
            $this->error['auto_release_seconds'] = $this->language->get('error_auto_release_seconds');
        }

        if (!$this->error) {
            return true;
        }

        if (!isset($this->error['warning'])) {
            $this->error['warning'] = $this->language->get('error_warning');
        }

        return false;
    }
}
