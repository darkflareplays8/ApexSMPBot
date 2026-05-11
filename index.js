const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js")
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] })

const commands = [
    new SlashCommandBuilder().setName("kick").setDescription("Kick a member from the server")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(o => o.setName("user").setDescription("The member to kick").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("Reason for the kick")),

    new SlashCommandBuilder().setName("ban").setDescription("Ban a member from the server")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(o => o.setName("user").setDescription("The member to ban").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("Reason for the ban")),

    new SlashCommandBuilder().setName("unban").setDescription("Unban a user from the server")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(o => o.setName("userid").setDescription("The user ID to unban").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("Reason for the unban")),

    new SlashCommandBuilder().setName("timeout").setDescription("Timeout a member")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(o => o.setName("user").setDescription("The member to timeout").setRequired(true))
        .addIntegerOption(o => o.setName("duration").setDescription("Duration in minutes").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("Reason for the timeout")),

    new SlashCommandBuilder().setName("untimeout").setDescription("Remove a timeout from a member")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(o => o.setName("user").setDescription("The member to untimeout").setRequired(true)),

    new SlashCommandBuilder().setName("warn").setDescription("Warn a member")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(o => o.setName("user").setDescription("The member to warn").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("Reason for the warning").setRequired(true)),

    new SlashCommandBuilder().setName("purge").setDescription("Bulk delete messages in this channel")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(o => o.setName("amount").setDescription("Number of messages to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)),

    new SlashCommandBuilder().setName("mute").setDescription("Voice mute a member")
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
        .addUserOption(o => o.setName("user").setDescription("The member to voice mute").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("Reason for the mute")),

    new SlashCommandBuilder().setName("unmute").setDescription("Remove voice mute from a member")
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
        .addUserOption(o => o.setName("user").setDescription("The member to unmute").setRequired(true)),
]

const warns = new Map()

client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`)
    client.user.setActivity("ApexSMP")

    const rest = new REST().setToken(process.env.TOKEN)
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands.map(c => c.toJSON()) })
    console.log("Slash commands registered")
})

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return

    const { commandName } = interaction

    if (commandName === "kick") {
        const target = interaction.options.getMember("user")
        const reason = interaction.options.getString("reason") ?? "No reason provided"
        if (!target) return interaction.reply({ content: "Member not found.", ephemeral: true })
        await target.kick(`${reason} | ${interaction.user.tag}`)
        await interaction.reply({ embeds: [embed("👢 Member Kicked", 0xFEE75C, [["Member", target.user.tag], ["Reason", reason], ["Moderator", interaction.user.tag]])] })
    }

    if (commandName === "ban") {
        const target = interaction.options.getMember("user")
        const reason = interaction.options.getString("reason") ?? "No reason provided"
        if (!target) return interaction.reply({ content: "Member not found.", ephemeral: true })
        await target.ban({ reason: `${reason} | ${interaction.user.tag}` })
        await interaction.reply({ embeds: [embed("🔨 Member Banned", 0xED4245, [["Member", target.user.tag], ["Reason", reason], ["Moderator", interaction.user.tag]])] })
    }

    if (commandName === "unban") {
        const userId = interaction.options.getString("userid")
        const reason = interaction.options.getString("reason") ?? "No reason provided"
        await interaction.guild.members.unban(userId, `${reason} | ${interaction.user.tag}`)
        await interaction.reply({ embeds: [embed("✅ Member Unbanned", 0x57F287, [["User ID", userId], ["Reason", reason], ["Moderator", interaction.user.tag]])] })
    }

    if (commandName === "timeout") {
        const target = interaction.options.getMember("user")
        const duration = interaction.options.getInteger("duration")
        const reason = interaction.options.getString("reason") ?? "No reason provided"
        if (!target) return interaction.reply({ content: "Member not found.", ephemeral: true })
        await target.timeout(duration * 60 * 1000, `${reason} | ${interaction.user.tag}`)
        await interaction.reply({ embeds: [embed("🔇 Member Timed Out", 0x5865F2, [["Member", target.user.tag], ["Duration", `${duration} minute(s)`], ["Reason", reason], ["Moderator", interaction.user.tag]])] })
    }

    if (commandName === "untimeout") {
        const target = interaction.options.getMember("user")
        if (!target) return interaction.reply({ content: "Member not found.", ephemeral: true })
        await target.timeout(null)
        await interaction.reply({ embeds: [embed("🔊 Timeout Removed", 0x57F287, [["Member", target.user.tag], ["Moderator", interaction.user.tag]])] })
    }

    if (commandName === "warn") {
        const target = interaction.options.getUser("user")
        const reason = interaction.options.getString("reason")
        const key = target.id
        warns.set(key, (warns.get(key) ?? 0) + 1)
        await interaction.reply({ embeds: [embed("⚠️ Member Warned", 0xFEE75C, [["Member", target.tag], ["Reason", reason], ["Total Warnings", String(warns.get(key))], ["Moderator", interaction.user.tag]])] })
    }

    if (commandName === "purge") {
        const amount = interaction.options.getInteger("amount")
        await interaction.channel.bulkDelete(amount, true)
        await interaction.reply({ ephemeral: true, embeds: [embed("🗑️ Messages Purged", 0xED4245, [["Amount", `${amount} message(s)`], ["Channel", interaction.channel.name], ["Moderator", interaction.user.tag]])] })
    }

    if (commandName === "mute") {
        const target = interaction.options.getMember("user")
        const reason = interaction.options.getString("reason") ?? "No reason provided"
        if (!target) return interaction.reply({ content: "Member not found.", ephemeral: true })
        await target.voice.setMute(true, `${reason} | ${interaction.user.tag}`)
        await interaction.reply({ embeds: [embed("🔇 Member Voice Muted", 0x5865F2, [["Member", target.user.tag], ["Reason", reason], ["Moderator", interaction.user.tag]])] })
    }

    if (commandName === "unmute") {
        const target = interaction.options.getMember("user")
        if (!target) return interaction.reply({ content: "Member not found.", ephemeral: true })
        await target.voice.setMute(false)
        await interaction.reply({ embeds: [embed("🔊 Member Voice Unmuted", 0x57F287, [["Member", target.user.tag], ["Moderator", interaction.user.tag]])] })
    }
})

function embed(title, color, fields) {
    return new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .addFields(fields.map(([name, value]) => ({ name, value, inline: true })))
        .setFooter({ text: "ApexSMP Moderation" })
        .setTimestamp()
}

client.login(process.env.TOKEN)
