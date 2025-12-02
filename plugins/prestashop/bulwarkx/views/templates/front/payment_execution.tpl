{if isset($error) && $error}
  <div class="alert alert-danger">{$error|escape:'htmlall':'UTF-8'}</div>
{else}
  <div class="alert alert-info">{l s='Redirecting to BulwarkX to complete your escrow payment...' mod='bulwarkx'}</div>
{/if}
{if isset($order_reference) && $order_reference}
  <p>{l s='Order reference:' mod='bulwarkx'} {$order_reference|escape:'htmlall':'UTF-8'}</p>
{/if}
