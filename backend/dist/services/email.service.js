"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        // For development, we'll use a test account or console logging
        // In production, you would use real SMTP credentials
        // Check if we have SMTP credentials
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            this.transporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            console.log('✅ Email service configured with SMTP credentials');
        }
        else {
            // For development without SMTP credentials, create a test transporter
            this.transporter = nodemailer_1.default.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'ethereal.user@ethereal.email',
                    pass: 'ethereal.pass'
                }
            });
            console.log('⚠️ Email service using test configuration (emails will be logged to console)');
            console.log('💡 To enable real email sending, set SMTP_USER and SMTP_PASS environment variables');
        }
    }
    async sendEmail(options) {
        if (!this.transporter) {
            console.log(`Email would be sent to ${options.to} (transporter not available)`);
            return;
        }
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@archify.com',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.stripHtml(options.html)
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${options.to}`);
            console.log(`📧 Message ID: ${info.messageId}`);
            // If using Ethereal (test account), show the preview URL
            if (info.messageId && info.messageId.includes('ethereal')) {
                console.log(`🔗 Preview URL: ${nodemailer_1.default.getTestMessageUrl(info)}`);
            }
        }
        catch (error) {
            console.error('❌ Error sending email:', error);
            // Don't throw error - just log it and continue
            console.log('📧 Email content would be:');
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('HTML:', options.html.substring(0, 200) + '...');
        }
    }
    async sendPasswordResetEmail(email, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/forgot-password?token=${resetToken}`;
        // For development/testing: Log the reset code to console
        console.log('🔐 PASSWORD RESET CODE FOR TESTING:');
        console.log('📧 Email:', email);
        console.log('🔑 Reset Code:', resetToken);
        console.log('🔗 Reset URL:', resetUrl);
        console.log('⏰ Expires in 1 hour');
        console.log('=====================================');
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
            .code { background: #f1f5f9; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
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
              <p><strong>Code de réinitialisation :</strong></p>
              <div class="code">${resetToken}</div>
              <p>Entrez ce code dans le formulaire de réinitialisation ou cliquez sur le bouton ci-dessous :</p>
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              <p><strong>Ce code expirera dans 1 heure.</strong></p>
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
        // Try to send email, but don't fail if email service is not configured
        try {
            await this.sendEmail({
                to: email,
                subject: 'Réinitialisation de votre mot de passe - Archify',
                html
            });
        }
        catch (error) {
            console.error('Failed to send email, but continuing with password reset process:', error);
            // Don't throw error - just log it and continue
        }
    }
    async sendWelcomeEmail(email, name) {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur FacGame</title>
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
              <h1>🎓 Bienvenue sur FacGame !</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${name},</h2>
              <p>Félicitations ! Votre compte FacGame a été créé avec succès.</p>
              <p>Vous pouvez maintenant :</p>
              <ul>
                <li>Accéder à tous les quiz interactifs</li>
                <li>Suivre votre progression et statistiques</li>
                <li>Passer des examens et défis</li>
                <li>Consulter le classement des meilleurs joueurs</li>
              </ul>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/subjects" class="button">Commencer les quiz</a>
              <p>N'hésitez pas à nous contacter si vous avez besoin d'aide.</p>
              <p>Cordialement,<br>L'équipe FacGame</p>
            </div>
            <div class="footer">
              <p>FacGame - Réussir vos études de médecine</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await this.sendEmail({
            to: email,
            subject: 'Bienvenue sur FacGame !',
            html
        });
    }
    async sendAdminNotificationNewUser(userName, userEmail, userSemester) {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            console.log('⚠️ ADMIN_EMAIL not configured in environment variables');
            return;
        }
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Nouvel utilisateur inscrit - FacGame</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .info-item { margin: 10px 0; }
            .label { font-weight: bold; color: #059669; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👤 Nouvel Utilisateur Inscrit</h1>
            </div>
            <div class="content">
              <p>Un nouvel utilisateur vient de s'inscrire sur FacGame.</p>

              <div class="info-box">
                <div class="info-item">
                  <span class="label">Nom :</span> ${userName}
                </div>
                <div class="info-item">
                  <span class="label">Email :</span> ${userEmail}
                </div>
                <div class="info-item">
                  <span class="label">Semestre :</span> ${userSemester}
                </div>
                <div class="info-item">
                  <span class="label">Date d'inscription :</span> ${new Date().toLocaleString('fr-FR', {
            dateStyle: 'full',
            timeStyle: 'short'
        })}
                </div>
              </div>

              <p>Connectez-vous au panneau d'administration pour voir plus de détails.</p>

              <p>Cordialement,<br>Système de notification FacGame</p>
            </div>
            <div class="footer">
              <p>FacGame - Notification automatique</p>
            </div>
          </div>
        </body>
      </html>
    `;
        try {
            await this.sendEmail({
                to: adminEmail,
                subject: `🎓 Nouvel utilisateur inscrit : ${userName}`,
                html
            });
            console.log(`✅ Admin notification sent for new user: ${userEmail}`);
        }
        catch (error) {
            console.error('❌ Failed to send admin notification:', error);
            // Don't throw error - just log it and continue
        }
    }
    stripHtml(html) {
        return html.replace(/<[^>]*>?/gm, '');
    }
}
exports.EmailService = EmailService;
// Export singleton instance
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map