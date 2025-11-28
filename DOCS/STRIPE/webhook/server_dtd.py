import os
import json
import logging

from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

import stripe

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Use a dedicated port and endpoint to avoid collisions with other local projects.
# Default port 4243, default endpoint /api/webhooks/stripe-dtd
PORT = int(os.getenv('DTD_PORT', 4243))
ENDPOINT = os.getenv('DTD_ENDPOINT', '/api/webhooks/stripe-dtd')

# Load Stripe credentials from environment (same values can be reused)
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


@app.get('/')
def health():
    return jsonify(status='ok', port=PORT, endpoint=ENDPOINT, stripe_key_present=bool(STRIPE_SECRET_KEY))


@app.post(ENDPOINT)
def webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature', None)

    # Prefer verifying signature when configured
    if STRIPE_WEBHOOK_SECRET and sig_header:
        try:
            event = stripe.Webhook.construct_event(
                payload=payload, sig_header=sig_header, secret=STRIPE_WEBHOOK_SECRET
            )
            logging.info('Verified event: %s', event['type'])
        except ValueError as e:
            logging.warning('Invalid payload: %s', e)
            return jsonify({'error': 'Invalid payload'}), 400
        except stripe.error.SignatureVerificationError as e:
            logging.warning('Invalid signature: %s', e)
            return jsonify({'error': 'Invalid signature'}), 400
    else:
        # Fallback — parse without verification (only for dev quick tests, not secure)
        try:
            event = json.loads(payload)
            logging.info('Received event without signature verification: %s', event.get('type'))
        except Exception as e:
            logging.warning('Failed to parse request body: %s', e)
            return jsonify({'error': 'Bad request body'}), 400

    event_type = event.get('type') if isinstance(event, dict) else None

    # Example minimal handlers (extend for your use-case)
    if event_type == 'checkout.session.completed' or event_type == 'payment_intent.succeeded':
        # handle payment completed
        logging.info('Payment confirmed event: %s', event_type)
    elif event_type == 'invoice.payment_failed':
        logging.info('Invoice payment failed: %s', event.get('id'))
    else:
        logging.info('Unhandled event type %s', event_type)

    # Respond quickly — process longer jobs asynchronously
    return jsonify({'status': 'received', 'handled_event': event_type}), 200


if __name__ == '__main__':
    app.run(port=PORT, debug=True)
