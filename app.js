const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');


dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
function isStaff(id)
{
  console.log(id)
  fs.readFile('staffEN.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.log("Error reading file:", err);
      return{
        success: false,
        message: "file not found"
      }
    }
    try {
      const data = JSON.parse(jsonString);
      console.log(data);
      for(let i = 0;i < data.length;i++)
      {
        if(data[i]["discord_id"] == id)
        {
          console.log("Found User")
          return {
            success: true,
            message: data[i]["nickname"]
          }
        }
      }
      
    } catch (err) {
      console.log("Error parsing JSON:", err);
    }
  });
}
client.on("guildMemberAdd", async (member) => {

  const channel = member.guild.channels.cache.get(process.env.ChannelID); 

  const result = isStaff(member.user.id)
  if(result.success)
  {
    channel.send(`**Hey ${member.user}, welcome to the server!**`); 
    const role = member.guild.roles.cache.get(process.env.StaffID);
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
  
  if (commandName === 'number') {
    await interaction.reply("" + Math.floor(Math.random() * 10));
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
