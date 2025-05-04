import fs from 'fs';
import dotenv from 'dotenv'

import * as SheetService from './sheetfile.js';
const ROLE_CONFIG_FILE = 'reactionRoles.json';

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
            console.error("❌ Failed to load reactionRoles.json:", err);
            return;
        }
        const emoji = reaction.emoji.name;
        const mapping = roleMappings.find(entry => entry.emoji === emoji);

        if (!mapping) return;

        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(mapping.role_id);

        if (!role) {
            console.warn(`⚠️ Role not found for ID: ${mapping.role_id}`);
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
    try {
        if (
            member.roles.cache.has(process.env.AdminRole) ||
            member.roles.cache.has(process.env.StaffRoleID) ||
            member.roles.cache.has(process.env.NongRoleID) ||
            member.roles.cache.has(process.env.NongCyberRoleID)
        ) {
            console.log("✅ User already has a verified role.");
            return;
        }

        const result = await SheetService.Verify(user.username);

        if (result.success) {
            const role = guild.roles.cache.get(result.role);
            if (!role) return console.error("❌ Role not found for verified user.");

            const newName = `N' ${result.message}`;
            await member.setNickname(newName);
            await member.roles.add(role);

            await user.send(`✅ ยืนยันตัวตนสำเร็จ \nยินดีต้อนรับน้องเข้าสู่ วิศวะคอมลาดกระบัง`);
        } 
        else if(result.success == false && result.message == "not verify")
        {
            await user.send("เจ้าเป็นใคร");
        }
        else {
            await user.send(`❌ หลงทางสินะ \nติดต่อ P' Chevy <@296498019644342282> หรือ P' Pluem <@769041827436560414>`);
        }

    } catch (err) {
        console.error("❌ Error in verification process:", err);
        try {
            await user.send("เกิดข้อผิดพลาดในการยืนยันตัวตน กรุณาติดต่อแอดมิน");
        } catch (dmErr) {
            console.error("❌ Couldn't send DM to user:", dmErr);
        }
    }
}