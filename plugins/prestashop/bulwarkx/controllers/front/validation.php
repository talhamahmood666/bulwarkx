<?php
class BulwarkxValidationModuleFrontController extends ModuleFrontController
{
    public $ssl = true;

    public function initContent()
    {
        parent::initContent();

        if (!$this->module->active) {
            Tools::redirect('index.php?controller=order&step=1');
        }

        $orderId = (int) Tools::getValue('id_order');
        if ($orderId) {
            $order = new Order($orderId);
        } else {
            $order = Order::getByCartId((int) Tools::getValue('id_cart'));
        }

        $this->context->smarty->assign([
            'order_reference' => Validate::isLoadedObject($order) ? $order->reference : '',
            'shop_name' => Configuration::get('PS_SHOP_NAME'),
        ]);

        $this->setTemplate('module:bulwarkx/views/templates/front/payment_execution.tpl');
    }
}
