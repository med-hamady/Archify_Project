"use strict";
// import nodemailer from 'nodemailer';
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
// Temporary fallback for when nodemailer is not available
let nodemailer = null;
try {
    nodemailer = require('nodemailer');
}
catch (error) {
    console.warn('Nodemailer not available, email functionality will be disabled');
}
class EmailService {
    constructor() {
        if (!nodemailer) {
            console.warn('Email service initialized without nodemailer - emails will not be sent');
            return;
        }
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    async sendEmail(options) {
        if (!nodemailer || !this.transporter) {
            console.log(`Email would be sent to ${options.to} (nodemailer not available)`);
            return; // Silently fail when nodemailer is not available
        }
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@archify.com',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.stripHtml(options.html)
            };
            await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${options.to}`);
        }
        catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }
    async sendPasswordResetEmail(email, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${resetToken}`;
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Réinitialisation de mot de passe - Archify</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a, #3730a3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <h2>Bonjour,</h2>
              <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Archify.</p>
              <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              <p><strong>Ce lien expirera dans 1 heure.</strong></p>
              <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
              <p>Cordialement,<br>L'équipe Archify</p>
            </div>
            <div class="footer">
              <p>Archify - Votre plateforme d'apprentissage universitaire</p>
              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p>${resetUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await this.sendEmail({
            to: email,
            subject: 'Réinitialisation de votre mot de passe - Archify',
            html
        });
    }
    async sendWelcomeEmail(email, name) {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur Archify</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a, #3730a3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Bienvenue sur Archify !</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Félicitations ! Votre compte Archify a été créé avec succès.</p>
              <p>Vous pouvez maintenant :</p>
              <ul>
                <li>Explorer notre catalogue de cours</li>
                <li>Visionner des vidéos éducatives</li>
                <li>Télécharger des supports de cours</li>
                <li>Accéder aux archives d'examens</li>
              </ul>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/catalog" class="button">Découvrir les cours</a>
              <p>N'hésitez pas à nous contacter si vous avez besoin d'aide.</p>
              <p>Cordialement,<br>L'équipe Archify</p>
            </div>
            <div class="footer">
              <p>Archify - Votre plateforme d'apprentissage universitaire</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await this.sendEmail({
            to: email,
            subject: 'Bienvenue sur Archify !',
            html
        });
    }
    stripHtml(html) {
        return html.replace(/<[^>]*>?/gm, '');
    }
}
exports.EmailService = EmailService;
// Export singleton instance
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map