/**
 * Google Apps Script (Code.gs)
 * LENGKAP DENGAN PROXY GEMINI & IZIN
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
  const props = PropertiesService.getScriptProperties();
  // Mengambil dua API Key (Utama & Cadangan)
  const apiKeys = [
    props.getProperty('GEMINI_API_KEY'),
    props.getProperty('GEMINI_API_KEY_2') // Tambahkan ini di Script Properties jika ada
  ].filter(k => k); // Hanya gunakan yang tidak kosong

  if (apiKeys.length === 0) {
    return createResponse({ success: false, error: 'API Key tidak ditemukan di Script Properties' });
  }

  const models = [
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview',
    'gemini-2.5-flash-image'
  ];

  let lastError = '';

  // Loop melalui setiap API Key
  for (const apiKey of apiKeys) {
    // Loop melalui setiap Model
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
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
          contents: [{ parts: parts }],
          generationConfig: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
        };

        const options = {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(url, options);
        const responseText = response.getContentText();
        const result = JSON.parse(responseText);

        console.log(`Mencoba Key... Model: ${model} | Status: ${response.getResponseCode()}`);

        if (response.getResponseCode() === 200 && result.candidates && result.candidates[0]) {
          const imagePart = result.candidates[0].content.parts.find(p => p.inlineData);
          if (imagePart) {
            return createResponse({ 
              success: true, 
              imageData: 'data:' + imagePart.inlineData.mimeType + ';base64,' + imagePart.inlineData.data,
              modelUsed: model
            });
          }
        } else if (result.error) {
          lastError = result.error.message;
          // Jika error kuota, lanjut ke model/key berikutnya
          if (lastError.includes('quota') || lastError.includes('limit')) {
            continue;
          }
          return createResponse({ success: false, error: 'Gemini Error: ' + lastError });
        }
      } catch (err) {
        lastError = err.message;
        continue;
      }
    }
  }

  return createResponse({ 
    success: false, 
    error: 'Semua API Key & Model telah mencapai batas kuota. Silakan coba lagi nanti atau gunakan API Key baru. Pesan terakhir: ' + lastError 
  });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function registerUser(ss, data) {
  const sheet = ss.getSheetByName('Users');
  const users = sheet.getDataRange().getValues();
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
  const blob = Utilities.newBlob(Utilities.base64Decode(data.photoBase64.split(',')[1]), 'image/png', `gen_${Date.now()}.png`);
  const file = folder.createFile(blob);
  const driveUrl = file.getUrl();
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

// FUNGSI UNTUK MEMANCING IZIN (PENTING!)
function testPermissions() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  console.log("API Key found: " + (apiKey ? "Yes" : "No"));
  try {
    // Memanggil URL luar untuk memicu jendela izin
    const res = UrlFetchApp.fetch("https://www.google.com");
    console.log("Fetch Test Success: " + res.getResponseCode());
  } catch(e) {
    console.log("Fetch Test Failed: " + e.message);
  }
}
