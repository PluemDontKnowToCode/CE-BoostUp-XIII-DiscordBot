import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs  from 'fs';
import * as StaffService from './service/staff.js';
import * as SheetService from'./service/SheetFile.js';


dotenv.config();

//Check Env



const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("guildMemberAdd", async (member) => {

  const channel = member.guild.channels.cache.get(process.env.ChannelID); 

  const result = StaffService.isStaff(member.user.id)
  if(result.success)
  {
    channel.send(`**Hey ${member.user}, welcome to the server!**`); 
    const role = member.guild.roles.cache.get(process.env.StaffRoleID);
    if (!role) return member.reply("Role not found!");
    try {
      const newName = `P'${result.message}`
      await member.setNickname(newName)
      await member.roles.add(role);
      await channel.send(`Role ${role.name} has been assigned to you!`);
    } catch (error) {
      console.error(error);
      await channel.send("There was an error assigning the role.");
    }
  }
  else
  {
    channel.send(`**${member.user}, not Found in data**`)
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  
  if (commandName === 'verify') {
    const result = await SheetService.Verify(interaction.user.username);
    if(result.success)
    {
      interaction.reply(`Found ${interaction.user}`);
    }
    else
    {
      interaction.reply(`User Not Found`);
    }
  }
});

client.on('message', message=>{

  let args = message.content.substring(PREFIX.length).split(" ")

  switch(args[0]){
      case 'Version':
          message.reply('Version 1.0.0');
      break;
      case 'Commands':
          message.reply(';Version ;Commands');
      break;  
  }
})
client.login(process.env.TOKEN);
