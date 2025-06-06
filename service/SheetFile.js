
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import { writeFile, readFile, stat } from 'fs/promises';
dotenv.config();

const CACHE_FILE = 'sheetData.json';
const CACHE_TTL_MS = 5000;
const ROLE_CONFIG_FILE = 'BaanRole.json';

async function isCacheFresh() {
  try {
    const stats = await stat(CACHE_FILE);
    const age = Date.now() - stats.mtimeMs;
    return age < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

export async function ReadSheetAndSave() {
  if (await isCacheFresh()) {
    try {
      const content = await readFile(CACHE_FILE, 'utf8');
      console.log("✅ Loaded data from cache");
      return JSON.parse(content);
    } catch (err) {
      console.warn("⚠️ Failed to read cache, falling back to fetch:", err);
    }
  }
  const sheetID = process.env.SheetID;
  const sheetName = "Register1";
  const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const col = json.table.cols;
    const colHead = [];
    for (let i = 0; i < col.length; i++) {
      colHead.push(col[i]["label"]);
    }

    const rows = json.table.rows;

    const data = rows.map(row => row.c.map(cell => cell?.v || ""));

    const records = data.map(row => {
      const record = {};
      for (let i = 0; i < colHead.length; i++) {
        record[colHead[i]] = row[i];
      }

      return record
    });
    // Save to file
    await writeFile('sheetData.json', JSON.stringify(records, null, 2));
    console.log("✅ Data saved to sheetData.json");

    return records;
  } catch (err) {
    console.error("❌ Failed to load or save data:", err);
    return [];
  }
}
export async function Verify(name) {
  const sheet = await ReadSheetAndSave();
  console.log(`Verify Input Name : ${name}`)
  for (let i = 0; i < sheet.length; i++) {
    if (sheet[i]["Discord Username"] == name) {
      if (sheet[i]["ยืนยันตัวยัง"] === "รายงานตัวสำเร็จ" || sheet[i]["ยืนยันตัวยัง"] === "1") {
        if (sheet[i]["หลักสูตรของน้อง"] == "วิศวกรรมคอมพิวเตอร์ (หลักสูตรภาษาไทย)") {
          const role = process.env.NongRoleID;
          return {
            success: true,
            message: sheet[i]["ชื่อเล่น"],
            role: role
          }
        }
        else if (sheet[i]["หลักสูตรของน้อง"] == "วิศวกรรมคอมพิวเตอร์และความปลอดภัยไซเบอร์") {
          const role = process.env.NongCyberRoleID;
          return {
            success: true,
            message: sheet[i]["ชื่อเล่น"],
            role: role
          }
        }
      }
      return {
        success: false,
        message: "not verify"
      };


    }
  }
  return {
    success: false,
    message: "Not Found"
  }
}
export async function AddBaan(guild) {
  try
  {
    const sheet = await ReadSheetAndSave();
    let roleMappings = [];
    try {
      const file = fs.readFileSync(ROLE_CONFIG_FILE, 'utf8');
      roleMappings = JSON.parse(file);
    } catch (err) {
      console.log("❌ Failed to load reactionRoles.json:", err);
      return;
    }
    console.log("Start Add Role");
    for (let i = 0; i < sheet.length; i++) 
    {
      try
      {
        console.log(sheet[i]["บ้าน"]);
        const mapping = roleMappings.find(entry => entry.role_name === sheet[i]["บ้าน"]);
        if (!mapping) continue;

        const member = guild.members.cache.find(
          m => m.user.username === sheet[i]["Discord Username"]
        );
        if(!member) continue;
        console.log("Found User");
        if (
            member.roles.cache.has(process.env.NongRoleID) ||
            member.roles.cache.has(process.env.NongCyberRoleID)
          ) 
        {
          const role = guild.roles.cache.get(mapping.role_id);
          if (!member.roles.cache.has(role)) {
            await member.roles.add(role);
            console.log(`✅ Added role ${role} to ${member.user.tag}`);
          }
        }
      }
      catch(err)
      {
        continue;
      }
    }
  }
  catch(err)
  {
    console.error(`❌ Error in Add Baan handler:`, err);
  }
}