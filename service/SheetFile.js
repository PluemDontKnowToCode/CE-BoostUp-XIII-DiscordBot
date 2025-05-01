import fetch from 'node-fetch'; // Required if using Node < 18
import dotenv from 'dotenv';
import fs from 'fs';
import { writeFile } from 'fs/promises';
dotenv.config();

export async function ReadSheetAndSave() {
  const sheetID = process.env.SheetID;
  const sheetName = "Sheet1";
  const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));  // Parse JSON from response
    const col = json.table.cols;
    const colHead = [];
    for (let i = 0; i < col.length; i++) {
      colHead.push(col[i]["label"]);
    }

    const rows = json.table.rows;
    console.log("Column Headers:", colHead);

    const data = rows.map(row => row.c.map(cell => cell?.v || ""));
    
    // Map rows to records using column headers
    const records = data.map(row => {
      const record = {};
      for (let i = 0; i < colHead.length; i++) {
        record[colHead[i]] = row[i];  // Map each row value to corresponding column header
      }
      
      return record
    });
    // Save to file
    await writeFile('sheetData.json', JSON.stringify(records, null, 2));
    console.log("✅ Data saved to sheetData.json");

    return records; 
  } catch (err) {
    console.error("❌ Failed to load or save data:", err);
    return [];  // Return an empty array in case of error
  }
}
export async function Verify(name)
{
  const sheet = await ReadSheetAndSave();
  console.log(`Verify Input Name : ${name}`)
  for(let i = 0;i < sheet.length;i++)
  {
    if(sheet[i]["Discord Username"] == name)
    {
      if(sheet[i]["หลักสูตรของน้อง"] == "วิศวกรรมคอมพิวเตอร์ (หลักสูตรภาษาไทย)")
      {
          const role = process.env.NongRoleID;
          return {
            success: true,
            message: sheet[i]["ชื่อเล่น"],
            role: role
          }
      }
      else if(sheet[i]["หลักสูตรของน้อง"] == "วิศวกรรมคอมพิวเตอร์และความปลอดภัยไซเบอร์")
      {
        const role = process.env.NongCyberRoleID;
        return {
          success: true,
          message: sheet[i]["ชื่อเล่น"],
          role: role
        }
      }
    }
  }
  return {
    success: false,
    message: "Not Found"
  }
}