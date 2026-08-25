import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Participants');

  worksheet.columns = [
    { header: 'Team ID', key: 'teamId', width: 15 },
    { header: 'Team Name', key: 'teamName', width: 25 },
    { header: 'Participant Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Team Lead', key: 'lead', width: 15 }
  ];

  // Add sample data
  worksheet.addRow({ teamId: 'T001', teamName: 'Code Warriors', name: 'Vignesh R', email: 'vignesh@example.com', lead: 'YES' });
  worksheet.addRow({ teamId: 'T001', teamName: 'Code Warriors', name: 'Arun Kumar', email: 'arun@example.com', lead: 'NO' });
  worksheet.addRow({ teamId: 'T002', teamName: 'Hack Titans', name: 'Priya M', email: 'priya@example.com', lead: 'YES' });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Hackathon-Participants-Template.xlsx"'
    }
  });
}
