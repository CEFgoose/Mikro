from itsdangerous import URLSafeTimedSerializer
from flask import render_template, current_app
from flask_mail import Message


def generate_confirmation_token(token_payload, salt):
    serializer = URLSafeTimedSerializer(current_app.config["HASH_SECRET_KEY"])
    return serializer.dumps(token_payload, salt=salt)


def confirm_token(
    token, salt, expiration=86400
):  # number of seconds in 24 hours
    serializer = URLSafeTimedSerializer(current_app.config["HASH_SECRET_KEY"])
    try:
        return serializer.loads(token, salt=salt, max_age=expiration)
    except:  # noqa: E722
        return False


def send_token_email(
    email,
    salt,
    token_payload,
    base_url,
    email_template,
    email_subject,
    template_data={},
):
    # base_url is the path on the frontend where the token can be used.
    # '/<token>' gets appended to it.
    token = generate_confirmation_token(token_payload, salt)
    template = render_template(
        email_template, link="{}/{}".format(base_url, token), **template_data
    )
    msg = Message(email_subject, recipients=[email], html=template)
    current_app.mail.send(msg)
