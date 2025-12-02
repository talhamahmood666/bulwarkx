BulwarkX OpenCart Payment Extension (MVP)
=======================================

Install
-------
1. Copy the contents of `upload/` into your OpenCart root or build a ZIP and install via the extension installer.
2. Go to Extensions -> Extensions -> Payments and enable "BulwarkX Escrow".
3. Configure API Base URL, payee address, arbiter address, and auto-release seconds.

Usage
-----
During checkout, the extension will create a BulwarkX invoice using the configured details and redirect the shopper to the payment URL returned by the backend.
