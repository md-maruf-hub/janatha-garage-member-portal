/**
 * ====================================================================================
 * JANATHA GARAGE - MEMBER MANAGEMENT SYSTEM
 * Google Apps Script Backend (Code.gs)
 * ====================================================================================
 * 
 * 📋 STEP-BY-STEP INSTRUCTIONS TO CONNECT GOOGLE SHEETS & DRIVE WITH THIS WEB APP:
 * 
 * 1. CREATE A NEW GOOGLE SHEET:
 *    - Go to Google Sheets (https://sheets.google.com) and create a Blank Spreadsheet.
 *    - Name your spreadsheet: "Janatha Garage - Member Registry".
 * 
 * 2. OPEN GOOGLE APPS SCRIPT:
 *    - In your Google Sheet, click "Extensions" in the top menu bar -> select "Apps Script".
 *    - Delete any existing code in the editor (`Code.gs`).
 *    - Copy THIS ENTIRE FILE content and paste it into `Code.gs`.
 *    - Click the Save icon (💾 or Ctrl+S / Cmd+S).
 * 
 * 3. RUN INITIAL SETUP (AUTO-CREATE SHEETS & HEADERS):
 *    - In the Apps Script toolbar at the top, select the function `setupSheets` from the dropdown.
 *    - Click "Run".
 *    - Google will prompt for permissions ("Authorization Required"). Click "Review Permissions".
 *    - Choose your Google Account -> Click "Advanced" -> Click "Go to Code.gs (unsafe)" -> Click "Allow".
 *    - This creates all necessary sheets: "Approved Members", "Pending Members", "Member Types", "Admin", "Audit Logs".
 * 
 * 4. DEPLOY AS WEB APP:
 *    - Click "Deploy" (top right) -> Select "New deployment".
 *    - Click the gear icon next to "Select type" -> Select "Web app".
 *    - Set Description: "Janatha Garage Backend v2".
 *    - Set "Execute as": "Me (your-email@gmail.com)".
 *    - Set "Who has access": "Anyone" (CRITICAL for web app API communication).
 *    - Click "Deploy".
 * 
 * 5. CONNECT TO YOUR WEB APPLICATION:
 *    - Copy the generated "Web App URL" (starts with https://script.google.com/macros/s/.../exec).
 *    - Open your Janatha Garage Web Application in your browser.
 *    - Login to Admin Portal (Default User ID: admin / Password: admin123).
 *    - Go to "GAS & Member Types Settings" tab.
 *    - Paste the Web App URL into the "Google Apps Script Web App URL" input box and check "Enable Live Google Apps Script Sync".
 *    - Click "Save Settings".
 * 
 * 6. GOOGLE DRIVE & GMAIL PERMISSIONS EXPLAINED:
 *    - GOOGLE DRIVE: Member profile photos uploaded during registration are stored in a Drive folder
 *      named "Janatha Garage Member Photos" created automatically. Each photo is set to public view.
 *    - GMAIL: When an admin approves a member, an automated HTML approval email containing their
 *      official Registration Number (e.g., JG260001) and assigned role is dispatched via Gmail.
 * ====================================================================================
 */

// Global Sheet Names
const S_PENDING = "Pending Members";
const S_APPROVED = "Approved Members";
const S_MEMBER_TYPES = "Member Types";
const S_ADMIN = "Admin";
const S_LOGS = "Audit Logs";

/**
 * Handle GET Requests (Read Statistics, Member Verification, Search, Member Types)
 */
function doGet(e) {
  let action = "";
  if (e && e.parameter) {
    action = e.parameter.action || "";
  }

  let response = { success: false, message: "Invalid action" };

  try {
    setupSheets();
    if (action === "getStats") {
      response = { success: true, data: getDashboardStats() };
    } else if (action === "getApprovedMembers") {
      response = { success: true, data: getApprovedMembers() };
    } else if (action === "getPendingMembers") {
      response = { success: true, data: getPendingMembers() };
    } else if (action === "searchMember") {
      const query = e ? e.parameter.query : "";
      response = { success: true, data: searchMember(query) };
    } else if (action === "getMemberTypes") {
      response = { success: true, data: getMemberTypes() };
    } else if (action === "verifyMember") {
      const regNo = e ? e.parameter.regNo : "";
      response = { success: true, data: verifyMember(regNo) };
    } else {
      response = {
        success: true,
        message: "Janatha Garage Google Sheets Backend API is Active and Connected!",
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    response = { success: false, message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST Requests (Register, Approve, Reject, Admin Login)
 */
function doPost(e) {
  let response = { success: false, message: "Invalid payload" };
  try {
    setupSheets();
    let data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    const action = data.action;

    if (action === "registerMember") {
      response = registerMember(data.payload);
    } else if (action === "adminLogin") {
      response = adminLogin(data.payload);
    } else if (action === "approveMember") {
      response = approveMember(data.payload);
    } else if (action === "rejectMember") {
      response = rejectMember(data.payload);
    } else if (action === "getPendingMembers") {
      response = { success: true, data: getPendingMembers() };
    } else if (action === "getApprovedMembers") {
      response = { success: true, data: getApprovedMembers() };
    } else if (action === "getStats") {
      response = { success: true, data: getDashboardStats() };
    } else if (action === "getMemberTypes") {
      response = { success: true, data: getMemberTypes() };
    } else if (action === "verifyMember") {
      const regNo = data.regNo || (data.payload ? data.payload.regNo : "");
      response = { success: true, data: verifyMember(regNo) };
    }
  } catch (err) {
    response = { success: false, message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Auto-Setup Spreadsheet Structure, Column Headers, and Styling
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Pending Members Sheet
  let pendingSheet = ss.getSheetByName(S_PENDING);
  if (!pendingSheet) {
    pendingSheet = ss.insertSheet(S_PENDING);
    pendingSheet.appendRow([
      "ID", "Submission Date", "Full Name", "Father Name", "Mother Name", 
      "Gender", "DOB", "Blood Group", "Phone", "Email", 
      "Present Address", "Permanent Address", "Occupation", "Company Name", 
      "Photo URL", "Photo File ID", "Status"
    ]);
    formatHeaderRow(pendingSheet, "#1e293b", "#ffffff");
  }

  // 2. Approved Members Sheet
  let approvedSheet = ss.getSheetByName(S_APPROVED);
  if (!approvedSheet) {
    approvedSheet = ss.insertSheet(S_APPROVED);
    approvedSheet.appendRow([
      "ID", "Registration Number", "Member Type", "Approval Date", "Full Name", 
      "Father Name", "Mother Name", "Gender", "DOB", "Blood Group", 
      "Phone", "Email", "Present Address", "Permanent Address", "Occupation", 
      "Company Name", "Photo URL", "Photo File ID", "Status"
    ]);
    formatHeaderRow(approvedSheet, "#065f46", "#ffffff");
  }

  // 3. Member Types Sheet
  let typesSheet = ss.getSheetByName(S_MEMBER_TYPES);
  if (!typesSheet) {
    typesSheet = ss.insertSheet(S_MEMBER_TYPES);
    typesSheet.appendRow(["Member Type Name"]);
    formatHeaderRow(typesSheet, "#1e40af", "#ffffff");
    const defaultTypes = [
      ["Executive Member"], ["Assistant Member"], ["Secretary"], 
      ["Joint Secretary"], ["Treasurer"], ["Vice President"], ["President"], ["Member"]
    ];
    typesSheet.getRange(2, 1, defaultTypes.length, 1).setValues(defaultTypes);
  }

  // 4. Admin Credentials Sheet
  let adminSheet = ss.getSheetByName(S_ADMIN);
  if (!adminSheet) {
    adminSheet = ss.insertSheet(S_ADMIN);
    adminSheet.appendRow(["User ID", "Password", "Role"]);
    formatHeaderRow(adminSheet, "#881337", "#ffffff");
    adminSheet.appendRow(["admin", "admin123", "Super Admin"]);
  }

  // 5. Audit Logs Sheet
  let logsSheet = ss.getSheetByName(S_LOGS);
  if (!logsSheet) {
    logsSheet = ss.insertSheet(S_LOGS);
    logsSheet.appendRow(["Timestamp", "Action", "Details", "Performed By"]);
    formatHeaderRow(logsSheet, "#475569", "#ffffff");
  }
}

/**
 * Format Header Rows with Background Color and Bold Text
 */
function formatHeaderRow(sheet, bgColor, textColor) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  range.setBackground(bgColor);
  range.setFontColor(textColor);
  range.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/**
 * Register Member (Validates Duplicates, Uploads Photo to Drive, Appends Row)
 */
function registerMember(data) {
  setupSheets();
  if (!data || !data.fullName || !data.phone) {
    return { success: false, message: "Full Name and Phone Number are required." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const phone = (data.phone || "").trim();
  const email = (data.email || "").toLowerCase().trim();

  // 1. Check Duplicates in Pending Sheet
  const pendingSheet = ss.getSheetByName(S_PENDING);
  const pendingValues = pendingSheet.getDataRange().getValues();
  for (let i = 1; i < pendingValues.length; i++) {
    const rowPhone = (pendingValues[i][8] || "").toString().trim();
    const rowEmail = (pendingValues[i][9] || "").toString().toLowerCase().trim();

    if (rowPhone && rowPhone === phone) {
      return { success: false, message: "This phone number is already registered in pending requests." };
    }
    if (email && rowEmail && rowEmail === email) {
      return { success: false, message: "This email address is already registered in pending requests." };
    }
  }

  // 2. Check Duplicates in Approved Sheet
  const approvedSheet = ss.getSheetByName(S_APPROVED);
  const approvedValues = approvedSheet.getDataRange().getValues();
  for (let i = 1; i < approvedValues.length; i++) {
    const rowPhone = (approvedValues[i][10] || "").toString().trim();
    const rowEmail = (approvedValues[i][11] || "").toString().toLowerCase().trim();

    if (rowPhone && rowPhone === phone) {
      return { success: false, message: "This phone number is already registered as an approved member." };
    }
    if (email && rowEmail && rowEmail === email) {
      return { success: false, message: "This email address is already registered as an approved member." };
    }
  }

  // 3. Save Photo to Google Drive Folder "Janatha Garage Member Photos"
  const rawImage = (data.photoBase64 || data.photoUrl || "").toString();
  let photoUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400";
  let photoFileId = "";

  if (rawImage && (rawImage.startsWith("data:image") || rawImage.includes("base64"))) {
    try {
      const folderName = "Janatha Garage Member Photos";
      const folders = DriveApp.getFoldersByName(folderName);
      let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

      const split = rawImage.split(",");
      const matchType = split[0].match(/:(.*?);/);
      const contentType = matchType ? matchType[1] : "image/jpeg";
      const bytes = Utilities.base64Decode(split[1]);
      const fileName = `photo_${phone}_${Date.now()}.jpg`;
      const blob = Utilities.newBlob(bytes, contentType, fileName);
      
      const file = folder.createFile(blob);
      // Set Drive file permission to Public Viewable so image displays on ID card & web app
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoFileId = file.getId();
      // Google Drive Direct View CDN URL
      photoUrl = `https://lh3.googleusercontent.com/d/${photoFileId}`;
    } catch (driveErr) {
      Logger.log("Drive upload warning: " + driveErr.toString());
      if (!rawImage.startsWith("data:image")) {
        photoUrl = rawImage;
      }
    }
  } else if (rawImage && (rawImage.startsWith("http://") || rawImage.startsWith("https://"))) {
    photoUrl = rawImage;
  }

  // 4. Append to Pending Members Sheet
  const id = "PEND_" + Date.now();
  const submissionDate = new Date().toISOString();

  pendingSheet.appendRow([
    id,
    submissionDate,
    (data.fullName || "").trim(),
    (data.fatherName || "").trim(),
    (data.motherName || "").trim(),
    data.gender || "Male",
    data.dob || "",
    data.bloodGroup || "O+",
    phone,
    email,
    (data.presentAddress || "").trim(),
    (data.permanentAddress || "").trim(),
    (data.occupation || "").trim(),
    (data.companyName || "").trim(),
    photoUrl,
    photoFileId,
    "Pending"
  ]);

  logAction("Member Registered", `Name: ${data.fullName}, Phone: ${phone}`, "System Public Portal");

  return {
    success: true,
    message: "Registration Submitted Successfully to Google Sheets! Your application is pending executive approval.",
    id: id
  };
}

/**
 * Approve Member (Moves from Pending to Approved Sheet, assigns Reg No, sends Email)
 */
function approveMember(payload) {
  setupSheets();
  const pendingId = payload ? payload.pendingId : "";
  const memberType = payload ? payload.memberType : "";

  if (!pendingId || !memberType) {
    return { success: false, message: "Pending Member ID and Member Type are required for approval." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName(S_PENDING);
  const approvedSheet = ss.getSheetByName(S_APPROVED);

  const pendingData = pendingSheet.getDataRange().getValues();
  let foundRow = -1;
  let memberData = null;

  for (let i = 1; i < pendingData.length; i++) {
    if (pendingData[i][0] === pendingId) {
      foundRow = i + 1;
      memberData = pendingData[i];
      break;
    }
  }

  if (foundRow === -1 || !memberData) {
    return { success: false, message: "Pending application record not found in Google Sheets." };
  }

  // Generate Sequential Registration Number (e.g. JG260001, JG260002)
  const approvedData = approvedSheet.getDataRange().getValues();
  let maxSeq = 0;
  const currentYear = new Date().getFullYear().toString().substring(2); // "26"

  for (let i = 1; i < approvedData.length; i++) {
    const regNo = (approvedData[i][1] || "").toString();
    if (regNo.startsWith("JG" + currentYear)) {
      const seqStr = regNo.replace("JG" + currentYear, "");
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(4, "0");
  const regNumber = `JG${currentYear}${nextSeq}`;
  const approvalDate = new Date().toISOString();

  // Move to Approved Sheet
  approvedSheet.appendRow([
    memberData[0],             // ID
    regNumber,                 // Registration Number
    memberType,                // Member Type / Rank
    approvalDate,              // Approval Date
    memberData[2],             // Full Name
    memberData[3],             // Father Name
    memberData[4],             // Mother Name
    memberData[5],             // Gender
    memberData[6],             // DOB
    memberData[7],             // Blood Group
    memberData[8],             // Phone
    memberData[9],             // Email
    memberData[10],            // Present Address
    memberData[11],            // Permanent Address
    memberData[12],            // Occupation
    memberData[13],            // Company Name
    memberData[14],            // Photo URL
    memberData[15],            // Photo File ID
    "Active"                   // Status
  ]);

  // Send HTML Email Notification via Gmail / MailApp API BEFORE deleting from Pending Sheet
  const recipientEmail = memberData[9];
  const memberName = memberData[2];
  const idCardUrl = "https://janatha-garage-member-portal.vercel.app/idcard?regNo=" + encodeURIComponent(regNumber);

  if (recipientEmail && recipientEmail.includes("@")) {
    try {
      const approvalHtml = `
        <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900;">JANATHA GARAGE</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #10b981; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Official Membership Approval Notice</p>
          </div>
          
          <div style="padding: 24px; background-color: #ffffff;">
            <h2 style="color: #059669; margin-top: 0; font-size: 20px;">Registration Approved!</h2>
            <p style="font-size: 14px; color: #334155;">Dear <strong>${memberName}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Congratulations! Your application for official membership at <strong>Janatha Garage</strong> has been reviewed and approved by the Executive Committee.
            </p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; font-weight: bold; color: #047857; text-transform: uppercase;">Your Official Registration Number</p>
              <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: 900; color: #065f46; letter-spacing: 1px;">${regNumber}</p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #047857;">Assigned Role: <strong>${memberType}</strong></p>
            </div>

            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Your Digital Membership PVC Card is now generated! Click the button below to view, verify, or download your official digital card:
            </p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${idCardUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
                🪪 View & Download Digital ID Card
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center;">
              Direct link: <a href="${idCardUrl}" style="color: #059669;">${idCardUrl}</a>
            </p>
          </div>

          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
            Janatha Garage Administration Office • Plot #14, Road #05, Dhanmondi, Dhaka-1205
          </div>
        </div>
      `;

      try {
        GmailApp.sendEmail(recipientEmail, "🎉 Janatha Garage Membership Approved - Reg No: " + regNumber, "", { htmlBody: approvalHtml });
      } catch (gErr) {
        MailApp.sendEmail({
          to: recipientEmail,
          subject: "🎉 Janatha Garage Membership Approved - Reg No: " + regNumber,
          htmlBody: approvalHtml
        });
      }
    } catch (emailErr) {
      Logger.log("Email dispatch warning: " + emailErr.toString());
    }
  }

  // Delete from Pending Sheet AFTER sending approval notification email
  pendingSheet.deleteRow(foundRow);

  logAction("Member Approved", `RegNo: ${regNumber}, Name: ${memberName}, Rank: ${memberType}`, "Admin Panel");

  return {
    success: true,
    message: `Member approved successfully in Google Sheets. Registration Number: ${regNumber}`,
    registrationNumber: regNumber
  };
}

/**
 * Reject Pending Application (Sends Rejection Email BEFORE Deleting Row)
 */
function rejectMember(payload) {
  setupSheets();
  let pendingId = "";
  let targetEmail = "";
  let targetName = "";
  let reason = "";

  if (typeof payload === "string") {
    pendingId = payload.trim();
  } else if (payload && typeof payload === "object") {
    pendingId = (payload.pendingId || payload.id || "").toString().trim();
    targetEmail = (payload.email || "").toString().trim();
    targetName = (payload.fullName || "").toString().trim();
    reason = (payload.reason || "").toString().trim();
  }

  if (!pendingId && !targetEmail) {
    return { success: false, message: "Pending Member ID or email required for rejection." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName(S_PENDING);
  const pendingData = pendingSheet.getDataRange().getValues();

  for (let i = 1; i < pendingData.length; i++) {
    const rowId = (pendingData[i][0] || "").toString().trim();
    const rowName = (pendingData[i][2] || "").toString().trim();
    const rowEmail = (pendingData[i][9] || "").toString().trim();

    const matchId = pendingId && rowId === pendingId;
    const matchEmail = targetEmail && rowEmail.toLowerCase() === targetEmail.toLowerCase();

    if (matchId || matchEmail) {
      const applicantName = rowName || targetName || "Applicant";
      const applicantEmail = rowEmail || targetEmail;

      // 1. Send Rejection Email BEFORE deleting record from Pending sheet
      if (applicantEmail && applicantEmail.includes("@")) {
        const rejectionHtml = `
          <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900;">JANATHA GARAGE</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #f87171; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Membership Application Update</p>
            </div>
            
            <div style="padding: 24px; background-color: #ffffff;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">Dear ${applicantName},</h2>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Thank you for your interest in joining <strong>Janatha Garage</strong>. After reviewing your membership registration, we regret to inform you that your application could not be approved at this time.
              </p>

              ${reason ? `
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #ef4444; border-radius: 6px; padding: 14px; margin: 16px 0;">
                <p style="margin: 0; font-size: 12px; font-weight: bold; color: #991b1b; text-transform: uppercase;">Review Decision Note</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #7f1d1d;">${reason}</p>
              </div>
              ` : ''}

              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                If you believe this decision was made in error or if you wish to apply again with updated details, please feel free to submit a new application on our portal.
              </p>
            </div>

            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
              Janatha Garage Administration Office • Plot #14, Road #05, Dhanmondi, Dhaka-1205
            </div>
          </div>
        `;

        try {
          GmailApp.sendEmail(applicantEmail, "Janatha Garage Membership Application Status Update", "", { htmlBody: rejectionHtml });
        } catch (e1) {
          try {
            MailApp.sendEmail({
              to: applicantEmail,
              subject: "Janatha Garage Membership Application Status Update",
              htmlBody: rejectionHtml
            });
          } catch (e2) {
            Logger.log("Rejection email dispatch warning: " + e2.toString());
          }
        }
      }

      // 2. Delete row from Pending Sheet AFTER email dispatch attempt
      pendingSheet.deleteRow(i + 1);

      logAction("Member Rejected", `ID: ${rowId || pendingId}, Name: ${applicantName}`, "Admin Panel");
      return { success: true, message: "Application rejected and rejection email sent." };
    }
  }

  return { success: false, message: "Pending application record not found in Google Sheets." };
}

/**
 * Get List of All Approved Members
 */
function getApprovedMembers() {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const approvedSheet = ss.getSheetByName(S_APPROVED);
  const data = approvedSheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      list.push({
        id: data[i][0],
        registrationNumber: data[i][1],
        memberType: data[i][2],
        approvalDate: data[i][3],
        fullName: data[i][4],
        fatherName: data[i][5],
        motherName: data[i][6],
        gender: data[i][7],
        dob: data[i][8],
        bloodGroup: data[i][9],
        phone: data[i][10],
        email: data[i][11],
        presentAddress: data[i][12],
        permanentAddress: data[i][13],
        occupation: data[i][14],
        companyName: data[i][15],
        photoUrl: data[i][16],
        status: data[i][18] || "Approved"
      });
    }
  }
  return list;
}

/**
 * Get List of All Pending Members
 */
function getPendingMembers() {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName(S_PENDING);
  const data = pendingSheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      list.push({
        id: data[i][0],
        submissionDate: data[i][1],
        fullName: data[i][2],
        fatherName: data[i][3],
        motherName: data[i][4],
        gender: data[i][5],
        dob: data[i][6],
        bloodGroup: data[i][7],
        phone: data[i][8],
        email: data[i][9],
        presentAddress: data[i][10],
        permanentAddress: data[i][11],
        occupation: data[i][12],
        companyName: data[i][13],
        photoUrl: data[i][14],
        status: "Pending"
      });
    }
  }
  return list;
}

/**
 * Verify Member by Registration Number
 */
function verifyMember(regNo) {
  setupSheets();
  if (!regNo) return null;
  const cleanReg = regNo.toUpperCase().trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const approvedSheet = ss.getSheetByName(S_APPROVED);
  const data = approvedSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowReg = (data[i][1] || "").toString().toUpperCase().trim();
    const rowPhone = (data[i][10] || "").toString().trim();
    const rowId = (data[i][0] || "").toString().toUpperCase().trim();

    if (rowReg === cleanReg || rowPhone === cleanReg || rowId === cleanReg) {
      return {
        id: data[i][0],
        registrationNumber: data[i][1],
        memberType: data[i][2],
        approvalDate: data[i][3],
        fullName: data[i][4],
        fatherName: data[i][5],
        motherName: data[i][6],
        gender: data[i][7],
        dob: data[i][8],
        bloodGroup: data[i][9],
        phone: data[i][10],
        email: data[i][11],
        presentAddress: data[i][12],
        permanentAddress: data[i][13],
        occupation: data[i][14],
        companyName: data[i][15],
        photoUrl: data[i][16],
        status: data[i][18] || "Active"
      };
    }
  }
  return null;
}

/**
 * Search Members Across Fields
 */
function searchMember(query) {
  setupSheets();
  if (!query) return [];
  const q = query.toLowerCase().trim();
  const approvedList = getApprovedMembers();

  return approvedList.filter(m => {
    return (
      (m.fullName && m.fullName.toLowerCase().includes(q)) ||
      (m.registrationNumber && m.registrationNumber.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.bloodGroup && m.bloodGroup.toLowerCase() === q) ||
      (m.memberType && m.memberType.toLowerCase().includes(q))
    );
  });
}

/**
 * Get Dashboard Stats & Blood Group Breakdown
 */
function getDashboardStats() {
  setupSheets();
  const approvedMembers = getApprovedMembers();
  const pendingMembers = getPendingMembers();

  const bloodGroupCounts = { "A+": 0, "A-": 0, "B+": 0, "B-": 0, "O+": 0, "O-": 0, "AB+": 0, "AB-": 0 };

  approvedMembers.forEach(m => {
    if (m.bloodGroup && bloodGroupCounts[m.bloodGroup] !== undefined) {
      bloodGroupCounts[m.bloodGroup]++;
    }
  });

  const recentApproved = approvedMembers.slice(-5).reverse();

  return {
    totalMembers: approvedMembers.length,
    pendingCount: pendingMembers.length,
    approvedCount: approvedMembers.length,
    bloodGroupCounts: bloodGroupCounts,
    recentApproved: recentApproved
  };
}

/**
 * Get Dynamic Ranks/Member Types
 */
function getMemberTypes() {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(S_MEMBER_TYPES);
  const data = sheet.getDataRange().getValues();
  const types = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) types.push(data[i][0].toString().trim());
  }

  return types.length > 0 ? types : [
    "Executive Member", "Assistant Member", "Secretary", 
    "Joint Secretary", "Treasurer", "Vice President", "President", "Member"
  ];
}

/**
 * Admin Authentication
 */
function adminLogin(payload) {
  setupSheets();
  const userId = payload ? (payload.userId || "").trim() : "";
  const password = payload ? (payload.password || "") : "";

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(S_ADMIN);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === userId && data[i][1].toString() === password) {
      logAction("Admin Login Success", `User: ${userId}`, "Admin Portal");
      return { success: true, token: "ADMIN_AUTH_" + Date.now() };
    }
  }

  logAction("Admin Login Failed", `Attempted User: ${userId}`, "Admin Portal");
  return { success: false, message: "Invalid Admin User ID or Password." };
}

/**
 * Log System Actions to Audit Logs Sheet
 */
function logAction(action, details, performedBy) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logsSheet = ss.getSheetByName(S_LOGS);
    if (!logsSheet) {
      logsSheet = ss.insertSheet(S_LOGS);
      logsSheet.appendRow(["Timestamp", "Action", "Details", "Performed By"]);
      formatHeaderRow(logsSheet, "#475569", "#ffffff");
    }
    logsSheet.appendRow([new Date().toISOString(), action, details, performedBy]);
  } catch (e) {
    // Ignore log errors
  }
}
