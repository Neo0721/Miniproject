const nodemailer = require("nodemailer");
const Staff = require("../models/Staff");
const User = require("../models/User");

// ── Gmail transporter (lazy-created once) ──────────────────────────────────
let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return _transporter;
}

// ── Firebase Admin (for FCM push) ──────────────────────────────────────────
function getAdmin() {
  try {
    return require("../config/firebase-admin");
  } catch (e) {
    console.warn("[NotificationService] firebase-admin not available:", e.message);
    return null;
  }
}

class NotificationService {

  // ────────────────────────────────────────────────────────────────────────
  // PUBLIC TRIGGERS
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Called when a new issue is created.
   * Notifies the assigned staff (or all dept staff as fallback) via email + FCM.
   */
  static async triggerNewIssueAlert(issue) {
    try {
      const targetDept = issue.department || issue.category;
      console.log(`[NotificationService] New issue alert: "${issue.title}" (${targetDept})`);

      // 1. Find target staff
      let targetStaff = [];
      if (issue.assignedTo) {
        const assigned = await Staff.findById(issue.assignedTo);
        if (assigned) targetStaff = [assigned];
      }
      if (targetStaff.length === 0) {
        const [fromStaff, fromUser] = await Promise.all([
          Staff.find({ department: targetDept, role: "resolving_staff", status: "approved" }),
          User.find({ role: { $in: ["staff", "resolving_staff"] }, department: targetDept })
        ]);
        targetStaff = [...fromStaff, ...fromUser];
      }

      const uniqueStaff = Array.from(new Map(targetStaff.map(s => [s.email, s])).values());
      if (uniqueStaff.length === 0) {
        console.warn(`[NotificationService] No staff found for dept: ${targetDept}`);
        return;
      }

      // 2. Resolve reporter name
      let reporterName = "Anonymous";
      if (issue.reportedBy) {
        if (typeof issue.reportedBy === "object" && issue.reportedBy.name) {
          reporterName = issue.reportedBy.name;
        } else {
          const u = await User.findById(issue.reportedBy).select("name");
          if (u) reporterName = u.name;
        }
      }

      const subject = `[${issue.priority?.toUpperCase() || "MEDIUM"}] New Issue Assigned: ${issue.title}`;
      const html = NotificationService._buildNewIssueEmail(issue, reporterName, targetDept);
      const text = `New Issue: ${issue.title}\nPriority: ${issue.priority}\nReported by: ${reporterName}\nDept: ${targetDept}\nDescription: ${issue.description}`;

      // 3. Send email + push in parallel for each staff member
      const channelId = issue.priority === 'high' ? 'high_priority_issues' : 'issues';

      await Promise.allSettled(uniqueStaff.map(async (staff) => {
        const email = staff.email;
        const fcmToken = staff.fcmToken;

        await Promise.allSettled([
          email ? NotificationService._sendEmail(email, subject, html, text) : Promise.resolve(),
          fcmToken ? NotificationService._sendPush(fcmToken, subject, `${reporterName} reported: ${issue.title}`, { issueId: String(issue._id) }, channelId) : Promise.resolve()
        ]);
      }));

      console.log(`[NotificationService] Alerts sent to ${uniqueStaff.length} staff member(s)`);
    } catch (err) {
      console.error("[NotificationService] triggerNewIssueAlert error:", err.message);
    }
  }

  /**
   * Called when an issue is escalated.
   * Notifies all dept staff + admins.
   */
  static async triggerEscalationAlert(issue) {
    try {
      const targetDept = issue.department || issue.category;
      console.log(`[NotificationService] Escalation alert: "${issue.title}"`);

      const [deptStaff, admins] = await Promise.all([
        Staff.find({ department: targetDept, role: "resolving_staff", status: "approved" }),
        User.find({ role: "admin" })
      ]);

      const allTargets = Array.from(
        new Map([...deptStaff, ...admins].map(s => [s.email, s])).values()
      );

      if (allTargets.length === 0) return;

      const subject = `🚨 ESCALATED: ${issue.title}`;
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <div style="background:#dc2626;color:white;padding:16px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">🚨 Issue Escalated</h2>
          </div>
          <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
            <p><strong>${issue.title}</strong> has been escalated due to SLA breach or max reassignments.</p>
            <p><strong>Department:</strong> ${targetDept}</p>
            <p><strong>Description:</strong> ${issue.description}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}/issue-details?id=${issue._id}" style="background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">View Issue →</a></p>
          </div>
        </div>`;
      const text = `ESCALATED: ${issue.title}\nDept: ${targetDept}\n${issue.description}`;

      await Promise.allSettled(allTargets.map(async (staff) => {
        await Promise.allSettled([
          staff.email ? NotificationService._sendEmail(staff.email, subject, html, text) : Promise.resolve(),
          staff.fcmToken ? NotificationService._sendPush(staff.fcmToken, subject, `Escalated: ${issue.title}`, { issueId: String(issue._id) }, 'high_priority_issues') : Promise.resolve()
        ]);
      }));
      } catch (error) {
        console.error("[NotificationService] Escalation alert failed:", error.message);
      }
    }
  
    /**
     * Sends a Push Notification reminder ONLY (no email)
     * Used for high-priority recurring alerts
     */
    static async triggerReminderAlert(issue) {
      try {
        const staff = await Staff.findById(issue.assignedTo);
        if (!staff || !staff.fcmToken) return;
  
        console.log(`[NotificationService] Sending REMINDER push to ${staff.email}`);
        await this._sendPush(
          staff.fcmToken,
          "URGENT REMINDER: Action Required",
          `High Priority Issue: "${issue.title}" is still pending your attention.`,
          { issueId: issue._id.toString(), type: "high_priority_reminder" },
          "high_priority_issues"
        );
      } catch (error) {
        console.error("[NotificationService] Reminder alert failed:", error.message);
      }
    }

  /**
   * Called when an issue is resolved — notifies the reporter.
   */
  static async triggerResolutionAlert(issue) {
    try {
      if (!issue.reportedBy) return;
      let reporter = null;
      if (typeof issue.reportedBy === "object" && issue.reportedBy.email) {
        reporter = issue.reportedBy;
      } else {
        reporter = await User.findById(issue.reportedBy).select("name email fcmToken");
      }
      if (!reporter) return;

      const subject = `✅ Your issue has been resolved: ${issue.title}`;
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <div style="background:#16a34a;color:white;padding:16px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">✅ Issue Resolved</h2>
          </div>
          <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
            <p>Hi ${reporter.name},</p>
            <p>Your issue <strong>"${issue.title}"</strong> has been marked as resolved.</p>
            <p>Please log in to confirm the resolution and leave a rating.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}/issue-details?id=${issue._id}" style="background:#16a34a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">View &amp; Rate →</a></p>
          </div>
        </div>`;
      const text = `Your issue "${issue.title}" has been resolved. Please log in to confirm.`;

      await Promise.allSettled([
        reporter.email ? NotificationService._sendEmail(reporter.email, subject, html, text) : Promise.resolve(),
        reporter.fcmToken ? NotificationService._sendPush(reporter.fcmToken, "Issue Resolved ✅", issue.title, { issueId: String(issue._id) }) : Promise.resolve()
      ]);
      console.log(`[NotificationService] Resolution alert sent to ${reporter.email}`);
    } catch (err) {
      console.error("[NotificationService] triggerResolutionAlert error:", err.message);
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ────────────────────────────────────────────────────────────────────────

  static async _sendEmail(to, subject, html, text) {
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text
      });
      console.log(`[NotificationService] ✉  Email sent → ${to}`);
    } catch (err) {
      console.error(`[NotificationService] Email failed for ${to}:`, err.message);
    }
  }

  static async _sendPush(token, title, body, data = {}, channelId = "issues") {
    try {
      const admin = getAdmin();
      if (!admin || !admin.messaging) return;

      await admin.messaging().send({
        token,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: { priority: "high", notification: { sound: "default", channelId } },
        apns: { payload: { aps: { sound: "default", badge: 1 } } }
      });
      console.log(`[NotificationService] 🔔 Push sent → ${token.slice(0, 20)}...`);
    } catch (err) {
      console.error(`[NotificationService] Push failed:`, err.message);
    }
  }

  static _buildNewIssueEmail(issue, reporterName, dept) {
    const priorityColor = issue.priority === "high" ? "#dc2626" : issue.priority === "medium" ? "#d97706" : "#65a30d";
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#1d4ed8;color:white;padding:16px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">📋 New Issue Assigned to You</h2>
        </div>
        <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr><td style="padding:6px;color:#6b7280;width:130px">Title</td><td style="padding:6px;font-weight:bold">${issue.title}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:6px;color:#6b7280">Priority</td><td style="padding:6px"><span style="background:${priorityColor};color:white;padding:2px 8px;border-radius:4px;font-size:12px">${(issue.priority || "medium").toUpperCase()}</span></td></tr>
            <tr><td style="padding:6px;color:#6b7280">Department</td><td style="padding:6px">${dept}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:6px;color:#6b7280">Location</td><td style="padding:6px">${issue.location || "N/A"}${issue.building ? ` · ${issue.building}` : ""}${issue.room ? ` · Rm ${issue.room}` : ""}</td></tr>
            <tr><td style="padding:6px;color:#6b7280">Reported by</td><td style="padding:6px">${reporterName}</td></tr>
          </table>
          <p style="background:#f9fafb;padding:12px;border-radius:6px;color:#374151;font-style:italic">"${issue.description}"</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/issue-details?id=${issue._id}" style="background:#1d4ed8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">View &amp; Update Issue →</a></p>
          <p style="color:#9ca3af;font-size:11px;margin-top:24px">HCAP (Hyperlocal Community Action Platform) · Automated notification</p>
        </div>
      </div>`;
  }
}

module.exports = NotificationService;
