import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendMagicLink(email: string, token: string): Promise<void> {
    // Use web redirect URL so email clients can handle it properly
    // Falls back to direct app scheme for local testing
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/v1/auth/open-app?token=${token}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'JumboHQ <onboarding@resend.dev>';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fff5f2;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 420px; width: 100%; border-collapse: collapse;">
          <!-- Logo/Mascot -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="font-size: 48px;">🐘</div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background: rgba(255, 255, 255, 0.9); border-radius: 24px; padding: 32px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1a1a1a; text-align: center;">
                Verify your email ✨
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #666; text-align: center; line-height: 1.5;">
                Tap the button below to sign in to JumboHQ and discover what's happening on campus!
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${magicLinkUrl}"
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #ff6b4a 0%, #8b5cf6 100%); color: white; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 50px; box-shadow: 0 4px 16px rgba(255, 107, 74, 0.3);">
                      Sign in to JumboHQ
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 13px; color: #999; text-align: center;">
                This link expires in 15 minutes.<br>
                If you didn't request this, you can safely ignore this email.
              </p>

              <!-- For testing: show token -->
              <div style="margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #666; text-align: center;">
                  For simulator testing, copy this command in Terminal:
                </p>
                <p style="margin: 0; font-size: 10px; color: #333; text-align: center; word-break: break-all; font-family: monospace;">
                  xcrun simctl openurl booted "jumbohq://verify?token=${token}"
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Made with 💜 at Tufts University
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Sign in to JumboHQ 🐘',
        html,
      });

      if (error) {
        this.logger.error(`Failed to send magic link to ${email}:`, error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      this.logger.log(`Magic link email sent to ${email}, id: ${data?.id}`);
    } catch (err) {
      this.logger.error(`Failed to send magic link to ${email}:`, err);
      throw err;
    }
  }
}
