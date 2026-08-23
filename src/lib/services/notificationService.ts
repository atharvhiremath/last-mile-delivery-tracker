import { prisma } from "../prisma";
import nodemailer from "nodemailer";

export interface SendNotificationParams {
  orderId: string;
  trackingNumber: string;
  recipientEmail?: string;
  recipientPhone?: string;
  customerName: string;
  status: string;
  notes?: string;
  rescheduleUrl?: string;
  orderSummary?: {
    senderAddress: string;
    dropAddress: string;
    totalAmount: number;
    paymentType: string;
  };
}

/**
 * Generates rich HTML email content matching modern logistics alerts.
 */
function buildStatusEmailHtml(params: SendNotificationParams): { subject: string; html: string; text: string } {
  const { trackingNumber, customerName, status, notes, rescheduleUrl } = params;

  let title = `Update on your Order #${trackingNumber}`;
  let statusBadgeColor = "#4f46e5"; // Indigo
  let mainMessage = `Your package status has been updated to: <strong>${status.replace(/_/g, " ")}</strong>.`;

  switch (status) {
    case "PLACED":
      title = `Order Confirmed: #${trackingNumber}`;
      statusBadgeColor = "#2563eb";
      mainMessage = `Thank you for your order! We have received your delivery request and are preparing for pickup.`;
      break;
    case "ASSIGNED":
      title = `Delivery Agent Assigned: #${trackingNumber}`;
      statusBadgeColor = "#7c3aed";
      mainMessage = `A dedicated delivery agent has been assigned to your order and will begin pickup shortly.`;
      break;
    case "PICKED_UP":
      title = `Package Picked Up: #${trackingNumber}`;
      statusBadgeColor = "#0891b2";
      mainMessage = `Your package has been successfully picked up from the sender location.`;
      break;
    case "IN_TRANSIT":
      title = `In Transit: #${trackingNumber}`;
      statusBadgeColor = "#0284c7";
      mainMessage = `Your package is moving through our logistics hub towards your local delivery area.`;
      break;
    case "OUT_FOR_DELIVERY":
      title = `Out for Delivery Today: #${trackingNumber}`;
      statusBadgeColor = "#d97706";
      mainMessage = `Your delivery agent is on the way! Please ensure someone is available at the destination address.`;
      break;
    case "DELIVERED":
      title = `Delivered: #${trackingNumber}`;
      statusBadgeColor = "#16a34a";
      mainMessage = `Your package has been successfully delivered. Thank you for choosing our delivery service!`;
      break;
    case "FAILED":
      title = `Delivery Attempt Unsuccessful: #${trackingNumber}`;
      statusBadgeColor = "#dc2626";
      mainMessage = `We attempted to deliver your package, but the attempt was unsuccessful. Reason: <em>${notes || "Customer unavailable / Address issue"}</em>.`;
      break;
    case "RESCHEDULED":
      title = `Delivery Rescheduled: #${trackingNumber}`;
      statusBadgeColor = "#9333ea";
      mainMessage = `Your delivery reschedule request has been confirmed. We have re-queued your shipment for the requested date.`;
      break;
    case "CANCELLED":
      title = `Order Cancelled: #${trackingNumber}`;
      statusBadgeColor = "#4b5563";
      mainMessage = `Your delivery order has been cancelled.`;
      break;
  }

  const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track/${trackingNumber}`;

  const rescheduleSection =
    status === "FAILED" && rescheduleUrl
      ? `
      <div style="margin: 24px 0; padding: 18px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; text-align: center;">
        <h3 style="margin-top: 0; color: #991b1b; font-size: 16px;">Action Required: Reschedule Your Delivery</h3>
        <p style="color: #7f1d1d; font-size: 14px; margin-bottom: 16px;">Please choose a convenient new delivery date and time slot:</p>
        <a href="${rescheduleUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reschedule Delivery Now</a>
      </div>
    `
      : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
          .content { padding: 32px 24px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; background-color: ${statusBadgeColor}; color: #ffffff; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
          .button { display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; }
          .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🚚 Last-Mile Delivery Tracker</h1>
          </div>
          <div class="content">
            <div class="badge">${status.replace(/_/g, " ")}</div>
            <h2 style="margin-top: 0; font-size: 20px;">Hello ${customerName},</h2>
            <p style="font-size: 15px; color: #334155;">${mainMessage}</p>
            ${notes ? `<p style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 12px; border-left: 4px solid #cbd5e1; border-radius: 4px;"><strong>Note:</strong> ${notes}</p>` : ""}
            ${rescheduleSection}
            <div style="margin-top: 24px; text-align: center;">
              <a href="${trackingLink}" class="button">View Live Order Tracking</a>
            </div>
          </div>
          <div class="footer">
            Tracking Number: ${trackingNumber} • Real-time Delivery Operations Platform
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hello ${customerName},\n\nOrder #${trackingNumber} status update: ${status.replace(/_/g, " ")}.\n${notes ? `Note: ${notes}\n` : ""}\nTrack your package here: ${trackingLink}\n${status === "FAILED" && rescheduleUrl ? `Reschedule delivery: ${rescheduleUrl}` : ""}`;

  return { subject: title, html, text };
}

/**
 * Generates an SMS notification text.
 */
function buildStatusSmsText(params: SendNotificationParams): string {
  const { trackingNumber, status, notes } = params;
  const statusLabel = status.replace(/_/g, " ");
  let msg = `Delivery Alert: Order #${trackingNumber} is now ${statusLabel}.`;
  if (status === "FAILED") {
    msg += ` Delivery attempt unsuccessful (${notes || "address/availability"}). Please visit the tracking link to reschedule.`;
  } else if (status === "OUT_FOR_DELIVERY") {
    msg += ` Our agent is en-route for delivery today.`;
  }
  msg += ` Track: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track/${trackingNumber}`;
  return msg;
}

/**
 * Dispatches Email & SMS notifications and logs them immutably to the database.
 */
export async function sendOrderNotification(params: SendNotificationParams): Promise<void> {
  const { orderId, recipientEmail, recipientPhone } = params;
  const emailContent = buildStatusEmailHtml(params);
  const smsText = buildStatusSmsText(params);

  // 1. Dispatch / Log Email Notification
  if (recipientEmail) {
    try {
      // If real SMTP host is provided, attempt delivery
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || "notifications@deliverytracker.com",
          to: recipientEmail,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });

        await prisma.notificationLog.create({
          data: {
            orderId,
            recipientEmail,
            channel: "EMAIL",
            subject: emailContent.subject,
            message: emailContent.text,
            status: "SENT",
          },
        });
      } else {
        // Simulated mode (logged directly into database for UI Notification Center)
        await prisma.notificationLog.create({
          data: {
            orderId,
            recipientEmail,
            channel: "EMAIL",
            subject: emailContent.subject,
            message: emailContent.text,
            status: "SIMULATED",
          },
        });
      }
    } catch (err) {
      console.error("Email notification dispatch error:", err);
      await prisma.notificationLog.create({
        data: {
          orderId,
          recipientEmail,
          channel: "EMAIL",
          subject: emailContent.subject,
          message: emailContent.text,
          status: "FAILED",
        },
      });
    }
  }

  // 2. Dispatch / Log SMS Notification
  if (recipientPhone) {
    await prisma.notificationLog.create({
      data: {
        orderId,
        recipientPhone,
        channel: "SMS",
        subject: `SMS: ${params.status}`,
        message: smsText,
        status: "SIMULATED",
      },
    });
  }
}
