import ExcelJS from 'exceljs';
import { list, put } from '@vercel/blob';

async function getExcelBuffer() {
  const { blobs } = await list({ prefix: 'participants.xlsx' });
  const blob = blobs.find(b => b.pathname === 'participants.xlsx');
  if (!blob) throw new Error("participants.xlsx not found in Vercel Blob");
  
  const res = await fetch(blob.downloadUrl || blob.url);
  if (!res.ok) throw new Error("Failed to fetch excel file from Blob storage");
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function saveExcelBuffer(buffer) {
  await put('participants.xlsx', buffer, { access: 'public', addRandomSuffix: false, allowOverwrite: true });
}

export async function getTeams(filePath) {
  const buffer = await getExcelBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0]; // assume first sheet
  
  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      const headers = [];
      row.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value?.toString().trim();
      });
      worksheet.headers = headers; 
    } else {
      const rowData = { _rowNumber: rowNumber };
      worksheet.headers.forEach((header, colNumber) => {
        if (header) {
          rowData[header] = row.getCell(colNumber).value;
          // Handle RichText and Hyperlink objects in ExcelJS
          if (rowData[header] && typeof rowData[header] === 'object') {
            if (rowData[header].richText) {
              rowData[header] = rowData[header].richText.map(rt => rt.text).join('');
            } else if (rowData[header].text) {
              rowData[header] = rowData[header].text;
            }
          }
        }
      });
      rows.push(rowData);
    }
  });

  const getCol = (row, names) => {
    for(let n of names) {
      if(row[n] !== undefined && row[n] !== null) return row[n].toString().trim();
    }
    return null;
  }
  
  const teams = {};
  rows.forEach(row => {
    const teamId = getCol(row, ['Team ID', 'TeamID', 'team_id']);
    if (!teamId) return;

    if (!teams[teamId]) {
      teams[teamId] = {
        id: teamId,
        name: getCol(row, ['Team Name', 'TeamName', 'team_name']) || teamId,
        members: [],
        leadEmail: null,
        leadName: null,
        ticketGenerated: getCol(row, ['Ticket Generated']),
        ticketSentStatus: getCol(row, ['Ticket Send Status', 'Status', 'Ticket Sent']),
        ticketSentAt: getCol(row, ['Ticket Sent At']),
      };
    }

    const participantName = getCol(row, ['Participant Name', 'Name', 'Participant']);
    const email = getCol(row, ['Email', 'Email Address', 'Email ID', 'Team Lead Email']);
    const isLead = getCol(row, ['Team Lead', 'Leader', 'Captain'])?.toLowerCase() === 'yes';
    const checkInStatus = getCol(row, ['Check-in Status']);
    const checkInTime = getCol(row, ['Check-in Time']);

    teams[teamId].members.push({ 
      name: participantName, 
      email: email, 
      isLead, 
      checkInStatus, 
      checkInTime 
    });

    if (isLead && email) {
      teams[teamId].leadEmail = email;
      teams[teamId].leadName = participantName;
    }
  });

  // If no explicit lead, default to first member with email
  Object.values(teams).forEach(team => {
    if (!team.leadEmail && team.members.length > 0) {
      const fallback = team.members.find(m => m.email) || team.members[0];
      team.leadEmail = fallback.email;
      team.leadName = fallback.name;
    }
  });

  return Object.values(teams);
}

export async function batchUpdateTeamStatus(filePath, updatesArray) {
  // updatesArray is [{ teamId: '...', updates: { generated: true } }, ...]
  const buffer = await getExcelBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const headers = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value?.toString().trim();
  });

  const ensureColumn = (name) => {
    let colIdx = headers.findIndex(h => h === name);
    if (colIdx === -1) {
      let maxCol = 1;
      headers.forEach((h, i) => { if (i > maxCol) maxCol = i; });
      colIdx = maxCol + 1;
      headers[colIdx] = name;
      headerRow.getCell(colIdx).value = name;
    }
    return colIdx;
  };

  const teamIdColIdx = headers.findIndex(h => ['Team ID', 'TeamID', 'team_id'].includes(h));
  if (teamIdColIdx === -1) throw new Error("Could not find Team ID column");

  const genColIdx = ensureColumn('Ticket Generated');
  const statusColIdx = ensureColumn('Ticket Send Status');
  const dateColIdx = ensureColumn('Ticket Sent At');

  let anyUpdated = false;

  // Convert array to map for fast lookup
  const updatesMap = {};
  for (const item of updatesArray) {
    updatesMap[item.teamId] = item.updates;
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    
    let rTeamId = row.getCell(teamIdColIdx).value;
    if (rTeamId && typeof rTeamId === 'object' && rTeamId.richText) rTeamId = rTeamId.richText.map(rt => rt.text).join('');
    rTeamId = rTeamId?.toString().trim();
    
    if (rTeamId && updatesMap[rTeamId]) {
      const updates = updatesMap[rTeamId];
      if (updates.generated !== undefined) {
        row.getCell(genColIdx).value = updates.generated ? 'YES' : 'NO';
      }
      if (updates.sentStatus !== undefined) {
        row.getCell(statusColIdx).value = updates.sentStatus;
      }
      if (updates.sentAt !== undefined) {
        row.getCell(dateColIdx).value = updates.sentAt;
      }
      anyUpdated = true;
    }
  });

  if (anyUpdated) {
    const updatedBuffer = await workbook.xlsx.writeBuffer();
    await saveExcelBuffer(updatedBuffer);
  }
  return anyUpdated;
}

export async function updateTeamStatus(filePath, teamId, updates) {
  return await batchUpdateTeamStatus(filePath, [{ teamId, updates }]);
}

export async function checkInTeam(filePath, teamId, presentMembers) {
  const buffer = await getExcelBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const headers = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value?.toString().trim();
  });

  const ensureColumn = (name) => {
    let colIdx = headers.findIndex(h => h === name);
    if (colIdx === -1) {
      let maxCol = 1;
      headers.forEach((h, i) => { if (i > maxCol) maxCol = i; });
      colIdx = maxCol + 1;
      headers[colIdx] = name;
      headerRow.getCell(colIdx).value = name;
    }
    return colIdx;
  };

  const teamIdColIdx = headers.findIndex(h => ['Team ID', 'TeamID', 'team_id'].includes(h));
  const nameColIdx = headers.findIndex(h => ['Participant Name', 'Name', 'Participant'].includes(h));
  
  if (teamIdColIdx === -1 || nameColIdx === -1) throw new Error("Could not find Team ID or Name column");

  const statusColIdx = ensureColumn('Check-in Status');
  const timeColIdx = ensureColumn('Check-in Time');

  let checkedInCount = 0;
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    
    let rTeamId = row.getCell(teamIdColIdx).value;
    if (rTeamId && typeof rTeamId === 'object' && rTeamId.richText) rTeamId = rTeamId.richText.map(rt => rt.text).join('');
    rTeamId = rTeamId?.toString().trim();

    let rName = row.getCell(nameColIdx).value;
    if (rName && typeof rName === 'object' && rName.richText) rName = rName.richText.map(rt => rt.text).join('');
    rName = rName?.toString().trim();
    
    if (rTeamId === teamId && rName && presentMembers.includes(rName)) {
      row.getCell(statusColIdx).value = 'Checked In';
      row.getCell(timeColIdx).value = new Date().toLocaleString();
      checkedInCount++;
    }
  });

  if (checkedInCount > 0) {
    const updatedBuffer = await workbook.xlsx.writeBuffer();
    await saveExcelBuffer(updatedBuffer);
  }
  return checkedInCount;
}
