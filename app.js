import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import * as StaffService from './service/staff.js';
import * as SheetService from'./service/SheetFile.js';

dotenv.config();

//Check Env
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("guildMemberAdd", async (member) => {

  const channel = member.guild.channels.cache.get(process.env.ChannelID); 
  const debug = member.guild.channels.cache.get(process.env.DebugID); 
  const result = await StaffService.isStaff(member.user.id)
  
  console.log(`Check ${member.user.id}`);
  console.log(`Staff result: ${result.success}, message: ${result.message}`);

  if(result.success)
  {
    const role = member.guild.roles.cache.get(process.env.StaffRoleID);
    if (!role) return;
    try {
      const newName = `P'${result.message}`
      await member.setNickname(newName)
      await member.roles.add(role);
      await debug.send(`Role ${role.name} has been assigned to ${member.user}!`);
    } catch (error) {
      console.error(error);
      await debug.send(`There was an error assigning the role to ${member.user}.`);
    }
  }
  else if(!result.success && result.message == "user not found")
  {
    channel.send(`**ยินดีต้อนรับ ${member.user} สู่ Discord CE Boostup XIIณ \n อย่าลืมไปกด emoji ที่ห้อง ✅verify ด้วยนะ**`); 
  }
  else
  {
    debug.send(`**${member.user}, not Found in data**`)
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  try {
    console.log("Reaction Detected");

    // Handle partials
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (user.bot) return;

    if (
      reaction.message.id === process.env.VERIFY_MESSAGE_ID &&
      reaction.emoji.name === process.env.VERIFY_EMOJI
    ) 
    {
      const guild = reaction.message.guild;
      const member = await guild.members.fetch(user.id);
      if(member.roles.cache.has(process.env.AdminRole)
      || member.roles.cache.has(process.env.StaffRoleID)
      || member.roles.cache.has(process.env.NongRoleID)
      || member.roles.cache.has(process.env.NongCyberRoleID))
      {
        console.log(`already have role`);
        return;
      }

      const result = await SheetService.Verify(user.username); // Assuming this checks user validity

      if (result.success) {
        const role = guild.roles.cache.get(result.role);
        if (!role) return console.error("Role not found!");

        const newName = `N'${result.message}`;
        await member.setNickname(newName);
        await member.roles.add(role);
        await user.send(`ยืนยันตัวตนสำเร็จ \nยินดีต้อนรับเข้าสู่วิศวะคอมลาดกระบัง`);
        return;
      } else {
        await user.send(`❌ หลงทางสินะ \nติดต่อ P'Chefvy <@296498019644342282> หรือ P'Pluem<@769041827436560414>`);
        return;
      }
    }
  } catch (error) {
    console.error('Error in reaction handler:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const debug = interaction.member.guild.channels.cache.get(process.env.DebugID); 
  const { commandName } = interaction;
  if(commandName === 'ping')
  {
    if (interaction.member.roles.cache.has(process.env.AdminRole))
    {
      console.log("Ping.......");
      const sent = await debug.send('Pinging...');
      await interaction.reply({ 
        content: `🏓 Pong! Latency is ${sent.createdTimestamp - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms.`, 
        ephemeral: true 
      });
    }
    else
    {
      await interaction.reply({ 
        content: "You dont have permission to use this command", 
        ephemeral: true 
      });
    }
  }
});

client.login(process.env.TOKEN);
