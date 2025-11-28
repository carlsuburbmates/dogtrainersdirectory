import os
import json
import logging

from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

import stripe

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Load Stripe credentials from environment
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


@app.get('/')
def health():
    return jsonify(status='ok', stripe_key_present=bool(STRIPE_SECRET_KEY))


@app.post('/webhook')
def webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature', None)

    # If we have a configured webhook signing secret, use it to verify.
    if STRIPE_WEBHOOK_SECRET and sig_header:
        try:
            event = stripe.Webhook.construct_event(
                payload=payload, sig_header=sig_header, secret=STRIPE_WEBHOOK_SECRET
            )
            logging.info('Verified event: %s', event['type'])
        except ValueError as e:
            # Invalid payload
            logging.warning('Invalid payload: %s', e)
            return jsonify({'error': 'Invalid payload'}), 400
        except stripe.error.SignatureVerificationError as e:
            logging.warning('Invalid signature: %s', e)
            return jsonify({'error': 'Invalid signature'}), 400
    else:
        # Fallback — try to parse without verification (not secure)
        try:
            event = json.loads(payload)
            logging.info('Received event without signature verification: %s', event.get('type'))
        except Exception as e:
            logging.warning('Failed to parse request body: %s', e)
            return jsonify({'error': 'Bad request body'}), 400

    # Basic handler for a couple of typical events
    event_type = event.get('type') if isinstance(event, dict) else None

    if event_type == 'payment_intent.succeeded':
        pi = event['data']['object']
        logging.info('PaymentIntent succeeded: %s amount=%s', pi.get('id'), pi.get('amount'))
        # TODO: persist in DB, send emails, fulfill orders
    elif event_type == 'invoice.payment_failed':
        inv = event['data']['object']
        logging.info('Invoice failed: %s', inv.get('id'))
    else:
        logging.info('Unhandled event type %s', event_type)

    # Respond quickly with a success code
    return jsonify({'status': 'received'}), 200


if __name__ == '__main__':
    # Default dev port 4242 (commonly used in the Stripe examples)
    app.run(port=int(os.getenv('PORT', 4242)), debug=True)
