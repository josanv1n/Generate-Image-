/**
 * Google Apps Script (Code.gs)
 * 
 * Instructions:
 * 1. Open your Google Sheet "Tools DB".
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the content of Code.gs with this code.
 * 4. Set Script Properties: GEMINI_API_KEY (if needed for backend logic, though generation is frontend).
 * 5. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and set it as VITE_GAS_URL in your environment.
 */

const SPREADSHEET_ID = '1L6VQeRGqEybVIe5NjPR8nvV-XnqQO6QoarFQeq8B0uQ';
const DRIVE_FOLDER_ID = '1bAY4Ruum9yIbl0FMUzycmkQJhXzTqtzT';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse({ success: false, error: 'No data received' });
    }
    
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    switch (action) {
      case 'register':
        return registerUser(ss, params.data);
      case 'login':
        return loginUser(ss, params.data);
      case 'saveImage':
        return saveImage(ss, params.data);
      case 'getHistory':
        return getHistory(ss, params.userId);
      case 'deleteImage':
        return deleteImage(ss, params.id, params.userId);
      case 'generateImage':
        return proxyGenerateImage(params.prompt, params.referenceImages);
      default:
        return createResponse({ success: false, error: 'Invalid action: ' + action });
    }
  } catch (err) {
    console.error('Error in doPost:', err);
    return createResponse({ success: false, error: 'Server Error: ' + err.message });
  }
}

function proxyGenerateImage(prompt, referenceImages) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      return createResponse({ success: false, error: 'API Key tidak ditemukan di Script Properties' });
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=' + apiKey;
    
    const parts = referenceImages.map(base64 => {
      const mimeType = base64.match(/data:(.*?);base64/)?.[1] || "image/png";
      return {
        inlineData: {
          data: base64.split(',')[1],
          mimeType: mimeType
        }
      };
    });
    parts.push({ text: prompt });

    const payload = {
      contents: [{ parts: parts }]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
      const imagePart = result.candidates[0].content.parts.find(p => p.inlineData);
      if (imagePart) {
        return createResponse({ 
          success: true, 
          imageData: 'data:' + imagePart.inlineData.mimeType + ';base64,' + imagePart.inlineData.data 
        });
      }
    }

    return createResponse({ success: false, error: 'Model tidak menghasilkan gambar. Cek Log Google Script.' });
  } catch (err) {
    return createResponse({ success: false, error: 'Proxy Error: ' + err.message });
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function registerUser(ss, data) {
  const sheet = ss.getSheetByName('Users');
  const users = sheet.getDataRange().getValues();
  
  // Check if user exists (force string comparison)
  for (let i = 1; i < users.length; i++) {
    if (String(users[i][1]).toLowerCase() === String(data.nama).toLowerCase()) {
      return createResponse({ success: false, error: 'User sudah terdaftar' });
    }
  }
  
  const id = Utilities.getUuid();
  sheet.appendRow([id, data.nama, String(data.password)]);
  return createResponse({ success: true, userId: id });
}

function loginUser(ss, data) {
  const sheet = ss.getSheetByName('Users');
  const users = sheet.getDataRange().getValues();
  
  for (let i = 1; i < users.length; i++) {
    // Force string comparison to handle numeric passwords like 8000
    const sheetNama = String(users[i][1]).trim();
    const sheetPass = String(users[i][2]).trim();
    const inputNama = String(data.nama).trim();
    const inputPass = String(data.password).trim();
    
    if (sheetNama === inputNama && sheetPass === inputPass) {
      return createResponse({ success: true, userId: users[i][0], userName: users[i][1] });
    }
  }
  return createResponse({ success: false, error: 'Nama atau Password salah' });
}

function saveImage(ss, data) {
  const sheet = ss.getSheetByName('Simpan');
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  
  // Save to Drive
  const blob = Utilities.newBlob(Utilities.base64Decode(data.photoBase64.split(',')[1]), 'image/png', `gen_${Date.now()}.png`);
  const file = folder.createFile(blob);
  const driveUrl = file.getUrl();
  
  // Save to Sheet
  const id = data.userId;
  const seq = sheet.getLastRow();
  const timestamp = new Date().toISOString();
  sheet.appendRow([id, seq, timestamp, data.promptteks, driveUrl]);
  
  return createResponse({ success: true, driveUrl: driveUrl });
}

function getHistory(ss, userId) {
  const sheet = ss.getSheetByName('Simpan');
  const data = sheet.getDataRange().getValues();
  const history = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      history.push({
        id: data[i][0],
        seq: data[i][1],
        timestamp: data[i][2],
        prompt: data[i][3],
        url: data[i][4]
      });
    }
  }
  return createResponse({ success: true, history: history });
}

function deleteImage(ss, seq, userId) {
  const sheet = ss.getSheetByName('Simpan');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && data[i][1] == seq) {
      sheet.deleteRow(i + 1);
      return createResponse({ success: true });
    }
  }
  return createResponse({ success: false, error: 'Image not found' });
}
