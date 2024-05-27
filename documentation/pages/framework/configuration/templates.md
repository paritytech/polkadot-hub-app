# Text templates

Depending on the configuration of your project you might have certain integrations turned on, e.g. email.
The app sends default texts when emails are sent. You can ovewrite these texts with your customs ones.

1. Create a folder with the module name in the templates folder , e.g. `./config/templates/guest-invites`
2. Create a YAML file for the text message. We have 3 types of messages: notification (matrix), email, text (error messages). E.g. `email.yml`
3. Look up the email message key [here](https://github.com/paritytech/polkadot-hub-app/blob/master/src/integrations/email-smtp/README.md#guest-invites).
4. Add your custom message to yml file. [See example here](https://github.com/paritytech/polkadot-hub-app/blob/master/src/modules/guest-invites/templates/email.yaml)
