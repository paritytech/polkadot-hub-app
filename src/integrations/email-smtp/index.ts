import smtp from 'nodemailer'
import config from '#server/config'
import { SafeResponse } from '#server/types'
import { Integration } from '../integration'
import { Email } from './types'

class EmailSMTP extends Integration {
  id = 'email-smtp'
  private credentials = {
    endpoint: process.env.SMTP_ENDPOINT || '',
    port: parseInt(process.env.SMTP_PORT || '', 10),
    username: process.env.SMTP_USERNAME || '',
    password: process.env.SMTP_PASSWORD || '',
    fromName: process.env.SMTP_FROM_NAME || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || '',
  }
  private re = {
    newLine: /\n/gm,
    blockTag: /<\/\s*(?:p|div|h1|h2|h3|h4|h5|h6)>/gim,
    brTag: /<br[^>]*\/?>/gim,
    aTag: /(<a\b.+href=")([^"]*)".*>(.*)<\/a>/gim,
    tag: /<[^>]*>/gim,
    spacer: /[^\S\r\n][^\S\r\n]+/gim,
  }

  private sanitizeHtml(html: string): string {
    return html
      .replace(this.re.newLine, '')
      .replace(this.re.blockTag, '\n')
      .replace(this.re.brTag, '\n')
      .replace(this.re.aTag, (_a, _b, url, title) => `${title} (${url})`)
      .replace(this.re.tag, '')
      .replace('&nbsp;', ' ')
      .replace(this.re.spacer, ' ')
      .trim()
  }

  private async sendEmailUnsafe({
    to,
    html = '',
    subject = '',
  }: Email): Promise<void> {
    return new Promise((resolve, reject) => {
      //@todo this should be moved to a constructor and integrations should become Singletons
      const server = smtp.createTransport({
        host: this.credentials.endpoint,
        port: 587,
        secure: false,
        auth: {
          user: this.credentials.username,
          pass: this.credentials.password,
        },
      })

      const data = {
        from: `${this.credentials.fromName} <${this.credentials.fromEmail}>`,
        to,
        subject,
        text: this.sanitizeHtml(html),
        html,
      }

      return server.sendMail(data, (err, info) => {
        if (err) {
          console.error(err)
          return reject(err)
        }
        return resolve()
      })
    })
  }

  public async sendEmail({ to, html, subject }: Email): Promise<SafeResponse> {
    if (config.debug) {
      console.log(
        `Sending email skipped (debug mode).\nemail: ${to}\nsubject: ${subject}\nhtml: ${html}\n`
      )
      return this.success()
    }
    try {
      await this.sendEmailUnsafe({ to, html, subject })
      return this.success()
    } catch (err) {
      return this.error(
        err,
        `Can't send email notification for ${to} with subject: ${subject}`
      )
    }
  }

  public sendEmailDeferred({ to, html, subject }: Email): void {
    process.nextTick(() => this.sendEmail({ to, html, subject }))
  }
}

export default EmailSMTP
