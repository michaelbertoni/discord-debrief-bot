const { Events, Client, ChannelType, GatewayIntentBits, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const token = process.env.BOT_TOKEN
const appId = process.env.BOT_APPLICATION_ID
const guildId = process.env.GUILD_ID

const defaultUserDebriefPermission = [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.SendVoiceMessages, PermissionFlagsBits.ViewChannel]

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ],
});

const addDebriefUserCommand = new SlashCommandBuilder()
        .setName('inviter_debrief')
        .setDescription('Autoriser des joueur-euses à rejoindre mon vocal de débrief')
        .addUserOption(option => option.setName("joueur1").setDescription("Joueur 1").setRequired(true))
        .addUserOption(option => option.setName("joueur2").setDescription("Joueur 2 (facultatif)").setRequired(false))
        .addUserOption(option => option.setName("joueur3").setDescription("Joueur 3 (facultatif)").setRequired(false))
        .addUserOption(option => option.setName("joueur4").setDescription("Joueur 4 (facultatif)").setRequired(false))
        .addUserOption(option => option.setName("joueur5").setDescription("Joueur 5 (facultatif)").setRequired(false))
        .addUserOption(option => option.setName("joueur6").setDescription("Joueur 6 (facultatif)").setRequired(false))
        .addUserOption(option => option.setName("joueur7").setDescription("Joueur 7 (facultatif)").setRequired(false))
        .addUserOption(option => option.setName("joueur8").setDescription("Joueur 8 (facultatif)").setRequired(false))
        .addUserOption(option => option.setName("joueur9").setDescription("Joueur 9 (facultatif)").setRequired(false))
        .addUserOption(option => option.setName("joueur10").setDescription("Joueur 10 (facultatif)").setRequired(false))
        .toJSON()

const rest = new REST({ version: '10' }).setToken(token);

// Dictionnaire pour stocker les canaux vocaux créés par les utilisateurs
const debriefChannels = new Map();
let defaultDebriefChannel = {};

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Enregistrement des commandes slash globales
        await rest.put(
            Routes.applicationCommands(appId),
            { body: [ addDebriefUserCommand ] },
            // { body: [] }, // comment line above and uncomment this one to delete the current slash commands
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

//// Listeners

client.on(Events.ClientReady, async () => {
    try {
        console.log(`Logged in as ${client.user.tag}`);
    
        const guild = client.guilds.cache.get(guildId)
    
        // Créer channel vocal "Créer un vocal débrief"
        defaultDebriefChannel = guild.channels.cache.find(c => c.name === 'Créer un vocal débrief')
        if (defaultDebriefChannel == null) {
            defaultDebriefChannel = await guild.channels.create({
                name: "Créer un vocal débrief",
                type: ChannelType.GuildVoice,
                parent: guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'Débrief'),
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: PermissionFlagsBits.Speak
                    }
                ]
            });
        }
                
        // Supprimer les channels vocaux debrief existant
        console.log(`Retrieving existing debrief voice channels...`)
        await guild.channels.cache
            .filter(channel => channel.type == ChannelType.GuildVoice)
            .filter(channel => channel.name.includes("Débrief"))
            .forEach(channel => {
                debriefChannels.set(channel.name.replace(" - Débrief", ""), channel.id);
                console.log(`Added channel ${channel.name} - ${channel.id} to the dictionnary of saved channels`);
            })
        
        console.log('Succesfully retrieved existing debrief voice channels');
    
        console.log("Bot started")
    }
    catch (error) {
        console.error(error)
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isCommand()) return;
    
        const { commandName } = interaction;
    
        if (commandName === 'inviter_debrief') {
            await handleAddDebriefUserCommand(interaction);
        }
    }
    catch (error) {
        console.log(error)
        interaction.reply("❌ Désolé ça a planté ❌")
    }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    try {
        if (newState.channelId == defaultDebriefChannel.id) {
            await createDebriefVoiceChannel(newState);
        }
    
        // Retrieve old channel
        const oldChannel = oldState.channel
    
        if (oldChannel != null && debriefChannels.has(oldChannel.name.replace(" - Débrief", ""))) {
            if (oldChannel.members.size == 0) {
                console.log(`Debrief channel "${oldChannel.name}" is empty, deleting...`)
                oldChannel.delete();
                debriefChannels.delete(oldChannel.name.replace(" - Débrief", ""));
                console.log(`Debrief channel "${oldChannel.name}" deleted`)
            }
        }
    }
    catch (error) {
        console.log(error)
    }
})

//// Utility functions

async function createDebriefVoiceChannel(voiceState) {
    const { member, guild } = voiceState;
    console.log(`${member.user.username} joined "Créer un vocal de débrief" voice channel`)

    const channelName = `${member.user.username} - Débrief`;

    if (debriefChannels.has(member.user.username)) {
        console.log(`Voice channel "${channelName}" for member ${member.user.username} - ${member.user.id} already exists, moving user into their channel`)
    }
    else {
        // Créer un nouveau canal vocal avec le nom "<username> - debrief"
        const newChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildVoice,
            parent: guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'Débrief'),
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: defaultUserDebriefPermission,
                },
                {
                    id: member.user.id,
                    allow: defaultUserDebriefPermission,
                },
                {
                    id: appId,
                    allow: defaultUserDebriefPermission.concat(PermissionFlagsBits.ManageChannels)
                }
            ]
        });
    
        // Stocker le canal vocal dans le dictionnaire
        debriefChannels.set(member.user.username, newChannel.id);
        newChannel.send(`${member.user} voilà ton canal de débrief !\nTu peux utiliser la commande \`/inviter_debrief\` et y mentionner une ou plusieurs personnes à inviter dans ce canal.`)
    }

    member.voice.setChannel(debriefChannels.get(member.user.username));
    console.log(`Successfully created voice channel "${channelName}" for user ${member.user.username}`)
}

async function handleAddDebriefUserCommand(interaction) {
    const { member, options } = interaction
    console.log(`${member.user.username} ran inviter_debrief command`)

    const userDebriefChannel = await getUserDebriefChannel(member)
    if (userDebriefChannel) {
        addOneUserToDebrief(options.getUser('joueur1'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur2'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur3'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur4'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur5'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur6'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur7'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur8'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur9'), userDebriefChannel)
        addOneUserToDebrief(options.getUser('joueur10'), userDebriefChannel)
        return interaction.reply({ content: `Joueur-euse(s) ajouté(es) à ton débrief !`, ephemeral: true })
    }
    else {
        console.log(`${member.user.username} does not have a debrief channel opened, skipping`)
        return interaction.reply({ content: "Tu n'as pas de vocal debrief ouvert, rejoins d'abord le canal \"Créer un vocal débrief\".", ephemeral: true })
    }
}

async function addOneUserToDebrief(invitedUser, debriefChannel) {
    if (invitedUser == null) {
        return
    }

    if (invitedUser.id == appId) {
        console.log(`debrief-bot cannot be added to debrief "${debriefChannel.name}"`)
        return
    }

    if (debriefChannel.permissionOverwrites.cache.get(invitedUser.id)) {
        console.log(`${invitedUser.username} is already added to debrief "${debriefChannel.name}"`)
        return
    }

    debriefChannel.permissionOverwrites.create(invitedUser,
        {
            Connect: true,
            Speak: true,
            SendVoiceMessages: true,
            ViewChannel: true,
        }
    )
    
    const inviteMsg = await debriefChannel.send(`${invitedUser} tu as été invité.e dans ce débrief !\nSi tu ne souhaites plus y participer, clique sur l'emote ci-dessous :`)
    await inviteMsg.react("🚪")
    const leaveDebriefCollectorFilter = (reaction, user) => {
        return reaction.emoji.name === '🚪' && user.id === invitedUser.id;
    };
    
    console.log(`${invitedUser.username} was invited to debrief "${debriefChannel.name}"`)
    
    const leaveDebriefReactioncollector = inviteMsg.createReactionCollector({ filter: leaveDebriefCollectorFilter })

    leaveDebriefReactioncollector.on('collect', r => {
        debriefChannel.permissionOverwrites.delete(invitedUser)
        debriefChannel.members.get(invitedUser.id)?.voice.disconnect()
        console.log(`${invitedUser.username} left debrief "${debriefChannel.name}"`)
    });
    
}

async function getUserDebriefChannel(member) {
    if (debriefChannels.has(member.user.username)) {
        return member.guild.channels.fetch(debriefChannels.get(member.user.username))
    }
    else {
        return null
    }
}

//// client login

client.login(token);
