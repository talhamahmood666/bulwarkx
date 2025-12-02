<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

use PrestaShop\PrestaShop\Core\Payment\PaymentOption;

class Bulwarkx extends PaymentModule
{
    const CONFIG_API_BASE_URL = 'BULWARKX_API_BASE_URL';
    const CONFIG_PAYEE_ADDRESS = 'BULWARKX_PAYEE_ADDRESS';
    const CONFIG_ARBITER_ADDRESS = 'BULWARKX_ARBITER_ADDRESS';
    const CONFIG_AUTO_RELEASE_SECONDS = 'BULWARKX_AUTO_RELEASE_SECONDS';

    public function __construct()
    {
        $this->name = 'bulwarkx';
        $this->tab = 'payments_gateways';
        $this->version = '0.1.0';
        $this->author = 'BulwarkX';
        $this->controllers = ['payment', 'validation'];
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('BulwarkX Escrow');
        $this->description = $this->l('Pay using BulwarkX escrow.');
        $this->ps_versions_compliancy = ['min' => '1.7.0.0', 'max' => _PS_VERSION_];
    }

    public function install()
    {
        return parent::install()
            && Configuration::updateValue(self::CONFIG_API_BASE_URL, '')
            && Configuration::updateValue(self::CONFIG_PAYEE_ADDRESS, '')
            && Configuration::updateValue(self::CONFIG_ARBITER_ADDRESS, '')
            && Configuration::updateValue(self::CONFIG_AUTO_RELEASE_SECONDS, 86400)
            && $this->registerHook('paymentOptions')
            && $this->registerHook('paymentReturn');
    }

    public function uninstall()
    {
        Configuration::deleteByName(self::CONFIG_API_BASE_URL);
        Configuration::deleteByName(self::CONFIG_PAYEE_ADDRESS);
        Configuration::deleteByName(self::CONFIG_ARBITER_ADDRESS);
        Configuration::deleteByName(self::CONFIG_AUTO_RELEASE_SECONDS);

        return parent::uninstall();
    }

    public function getContent()
    {
        $output = '';

        if (Tools::isSubmit('submitBulwarkx')) {
            Configuration::updateValue(self::CONFIG_API_BASE_URL, Tools::getValue(self::CONFIG_API_BASE_URL));
            Configuration::updateValue(self::CONFIG_PAYEE_ADDRESS, Tools::getValue(self::CONFIG_PAYEE_ADDRESS));
            Configuration::updateValue(self::CONFIG_ARBITER_ADDRESS, Tools::getValue(self::CONFIG_ARBITER_ADDRESS));
            Configuration::updateValue(self::CONFIG_AUTO_RELEASE_SECONDS, (int) Tools::getValue(self::CONFIG_AUTO_RELEASE_SECONDS));

            $output .= $this->displayConfirmation($this->l('Settings updated'));
        }

        return $output . $this->renderForm();
    }

    public function hookPaymentOptions($params)
    {
        if (!$this->active) {
            return [];
        }

        $paymentOption = new PaymentOption();
        $paymentOption->setModuleName($this->name)
            ->setCallToActionText($this->l('Pay via BulwarkX escrow'))
            ->setAction($this->context->link->getModuleLink($this->name, 'payment', [], true))
            ->setAdditionalInformation($this->fetch('module:bulwarkx/views/templates/front/payment_intro.tpl'));

        return [$paymentOption];
    }

    public function hookPaymentReturn($params)
    {
        if (!$this->active) {
            return '';
        }

        $order = $params['order'];
        $this->context->smarty->assign([
            'order_reference' => $order->reference,
            'shop_name' => Configuration::get('PS_SHOP_NAME'),
        ]);

        return $this->fetch('module:bulwarkx/views/templates/front/payment_execution.tpl');
    }

    protected function renderForm()
    {
        $default_lang = (int) Configuration::get('PS_LANG_DEFAULT');

        $fields_form = [
            'form' => [
                'legend' => [
                    'title' => $this->l('BulwarkX settings'),
                ],
                'input' => [
                    [
                        'type' => 'text',
                        'label' => $this->l('API Base URL'),
                        'name' => self::CONFIG_API_BASE_URL,
                        'required' => true,
                    ],
                    [
                        'type' => 'text',
                        'label' => $this->l('Payee Address'),
                        'name' => self::CONFIG_PAYEE_ADDRESS,
                        'required' => true,
                    ],
                    [
                        'type' => 'text',
                        'label' => $this->l('Arbiter Address'),
                        'name' => self::CONFIG_ARBITER_ADDRESS,
                        'required' => true,
                    ],
                    [
                        'type' => 'text',
                        'label' => $this->l('Auto-release Seconds'),
                        'name' => self::CONFIG_AUTO_RELEASE_SECONDS,
                        'required' => true,
                        'class' => 'fixed-width-sm',
                    ],
                ],
                'submit' => [
                    'title' => $this->l('Save'),
                ],
            ],
        ];

        $helper = new HelperForm();
        $helper->show_cancel_button = false;
        $helper->module = $this;
        $helper->name_controller = $this->name;
        $helper->identifier = $this->identifier;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;
        $helper->default_form_language = $default_lang;
        $helper->allow_employee_form_lang = $default_lang;

        $helper->title = $this->displayName;
        $helper->submit_action = 'submitBulwarkx';

        $helper->fields_value[self::CONFIG_API_BASE_URL] = Configuration::get(self::CONFIG_API_BASE_URL);
        $helper->fields_value[self::CONFIG_PAYEE_ADDRESS] = Configuration::get(self::CONFIG_PAYEE_ADDRESS);
        $helper->fields_value[self::CONFIG_ARBITER_ADDRESS] = Configuration::get(self::CONFIG_ARBITER_ADDRESS);
        $helper->fields_value[self::CONFIG_AUTO_RELEASE_SECONDS] = Configuration::get(self::CONFIG_AUTO_RELEASE_SECONDS);

        return $helper->generateForm([$fields_form]);
    }
}
