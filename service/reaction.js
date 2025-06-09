import fs from 'fs';
import dotenv from 'dotenv'

import * as SheetService from './SheetFile.js';
const ROLE_CONFIG_FILE = 'TeamRole.json';

dotenv.config();

export async function handleReactionAdd(reaction, user) {
    if (process.env.VERIFY_ROLE_MESSAGE_ID === reaction.message.id) {
        await processReaction(reaction, user, 'add');
    }
}

export async function handleReactionRemove(reaction, user) {
    if (process.env.VERIFY_ROLE_MESSAGE_ID === reaction.message.id) {
        await processReaction(reaction, user, 'remove');
    }
}

async function processReaction(reaction, user, action) {
    try {
        let roleMappings = [];
        try {
            const file = fs.readFileSync(ROLE_CONFIG_FILE, 'utf8');
            roleMappings = JSON.parse(file);
        } catch (err) {
            console.log("❌ Failed to load reactionRoles.json:", err);
            return;
        }
        const emoji = reaction.emoji.name;
        const mapping = roleMappings.find(entry => entry.emoji === emoji);

        if (!mapping) return;

        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(mapping.role_id);

        if (!role) {
            console.log(`⚠️ Role not found for ID: ${mapping.role_id}`);
            return;
        }

        if (action === 'add') {
            const hasAnyRole = roleMappings.some(role =>
                member.roles.cache.has(role.role_id)
            );
            if (hasAnyRole) {
                return;
            }
            if (!member.roles.cache.has(role.id))
                await member.roles.add(role);
        } else if (action === 'remove') {
            if (member.roles.cache.has(role.id))
                await member.roles.remove(role);
        }
    } catch (err) {
        console.error(`❌ Error in reaction ${action} handler:`, err);
    }
}

export async function juniorVerify(guild, user, member) {
    
    const debug = guild.channels.cache.get(process.env.DebugID);
    try {
        if (
            member.roles.cache.has(process.env.AdminRole) ||
            member.roles.cache.has(process.env.StaffRoleID) ||
            member.roles.cache.has(process.env.NongRoleID) ||
            member.roles.cache.has(process.env.NongCyberRoleID) || 
            member.roles.cache.has(process.env.OthersRoleID)
        ) {
            console.log("✅ User already has a verified role.");
            return;
        }

        const result = await SheetService.Verify(user.username);

        if (result.success) {
            let roleMappings = [];
            try {
                const file = fs.readFileSync(ROLE_CONFIG_FILE, 'utf8');
                roleMappings = JSON.parse(file);
            } catch (err) {
                console.log("❌ Failed to load reactionRoles.json:", err);
                return;
            }
            const role = guild.roles.cache.get(result.role);
            if (!role) return console.error("❌ Role not found for verified user.");

            const newName = `N' ${result.message}`;
            await member.setNickname(newName);
            await member.roles.add(role);
            if(result.team != "None")
            {
                const mapping = roleMappings.find(entry => entry.role_name === result.team);
                if(!mapping)
                    return;
                const team = guild.roles.cache.get(mapping.role_id);
                try
                {
                    if(team)
                    {
                        await member.roles.add(team);
                        try
                        {
                            await debug.send(`${team} has been assign to ${user}`);
                        }
                        catch(error)
                        {
                            console.log("Can not send debug: ",error);
                        }
                    }
                }
                catch(error)
                {
                    console.log("✅ User already has a Team role.");
                }
            }
            await user.send(`✅ ยืนยันตัวตนสำเร็จ \nยินดีต้อนรับน้องเข้าสู่ วิศวะคอมลาดกระบัง`);
            await debug.send(`${user} ยืนยันตัวตนสำเร็จ`);
        } 
        else if(result.success == false && result.message == "not verify")
        {
            await user.send("### ข้อมูลของน้องไม่ถูกต้อง\nติดต่อพี่ๆ ได้ที่ห้อง ✅แจ้งปัญหา\nทางพี่ๆจะติดต่อกลับไปทาง direct message");
            await debug.send(`${user} ข้อมูลไม่ถูกต้อง`);
        }
        else {
            await user.send(`❌ หลงทางสินะ \nน้องอาจยังไม่ได้กรอกฟอร์มสมัครค่าย CE-Boostup 13 \nหรือชื่อ discord ที่น้องกรอกในฟอร์มอาจไม่ตรงกับ discord ที่น้องใช้อยู่\nติดต่อพี่ๆ ได้ที่ห้อง ✅แจ้งปัญหา\nทางพี่ๆจะติดต่อกลับไปทาง direct message`);
            await debug.send(`${user} หลงทาง`);
        }

    } catch (err) {
        console.error("❌ Error in verification process:", err);
        try {
            await user.send("เกิดข้อผิดพลาดในการยืนยันตัวตน \nติดต่อพี่ๆ ได้ที่ห้อง ✅แจ้งปัญหา\nทางพี่ๆจะติดต่อกลับไปทาง direct message");
            await debug.send(`${user} เกิดข้อผิดพลาดในการยืนยันตัวตน`);
        } catch (dmErr) {
            console.error("❌ Couldn't send DM to user:", dmErr);
        }
    }
}