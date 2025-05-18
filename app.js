import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import * as StaffService from './service/staff.js';
import * as ReactionService from './service/reaction.js';
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
  await debug.send(`${member.user} Just Join!`);
  
  if (result.success) {
    const role = member.guild.roles.cache.get(process.env.StaffRoleID);
    if (!role) return;

    try {
      const newName = `P' ${result.message}`
      await member.setNickname(newName)
      await member.roles.add(role);
      await member.user.send("**จาก Admin** \nเข้ามาแล้วอย่าลืมไปกดรับบ้านที่ห้อง **บอก-role**\nถ้ากด emoji ผิด กดซ้ำอีกรอบ\nได้โปรดอย่าเกรียน🙏🙏🙏");
      await debug.send(`Role ${role.name} has been assigned to ${member.user}!`);

    } catch (error) {
      console.error(error);
      await debug.send(`There was an error assigning the role to ${member.user}.`);
    }
  }
  else {
    channel.send(`**ยินดีต้อนรับ ${member.user} สู่ Discord CE Boostup XIII \nอย่าลืมไปกด emoji ที่ห้อง ✅verify ด้วยนะ**`);
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  try {
    console.log("Reaction Detected");

    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (user.bot) return;

    if ( reaction.message.id === process.env.VERIFY_MESSAGE_ID && reaction.emoji.name === process.env.VERIFY_EMOJI ) {
      const guild = reaction.message.guild;
      const member = await guild.members.fetch(user.id);

      await ReactionService.juniorVerify(guild, user, member);
    }
    else if (process.env.VERIFY_ROLE_MESSAGE_ID === reaction.message.id ) {
      await ReactionService.handleReactionAdd(reaction, user);
    }
  } catch (error) {
    console.error('Error in reaction handler:', error);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (process.env.VERIFY_ROLE_MESSAGE_ID === reaction.message.id) {
    await ReactionService.handleReactionRemove(reaction, user);
  }

});

client.on('interactionCreate', async interaction => {

  if (!interaction.isCommand()) return;
  const debug = interaction.member.guild.channels.cache.get(process.env.DebugID);
  const { commandName } = interaction;

  if (commandName === 'ping') {
    if (interaction.member.roles.cache.has(process.env.AdminRole)) {
      const sent = await debug.send('Pinging...');
      await interaction.reply(`🏓 Pong! Latency is ${sent.createdTimestamp - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms.`);
    }
    else {
      await interaction.reply({
        content: "You dont have permission to use this command",
        ephemeral: true
      });
    }
  }
  else if(commandName === 'secret')
  {
    if (interaction.member.roles.cache.has(process.env.AdminRole))
    {
      
    }
    else {
      await interaction.reply({
        content: "You dont have permission to use this command",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
