const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

require("dotenv").config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const SERVER_ID = "3421395";

const commands = [
    new SlashCommandBuilder()
        .setName("start")
        .setDescription("Démarre le serveur Minecraft")
].map(command => command.toJSON());

const rest = new REST({
    version: "10"
}).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
    try {
        console.log("Enregistrement de la commande /start...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            {
                body: commands
            }
        );

        console.log("Commande /start enregistrée !");
    } catch (error) {
        console.error("Erreur d'enregistrement :", error);
    }
}

client.once("ready", () => {
    console.log("Bot connecté en tant que " + client.user.tag);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    if (interaction.commandName !== "start") {
        return;
    }

    await interaction.deferReply();

    try {
        const response = await fetch(
            "https://client.falixnodes.net/api/v2/servers/" +
            SERVER_ID +
            "/power",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + process.env.FALIX_API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    signal: "start"
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            await interaction.editReply(
                "🟢 **Serveur en cours de démarrage !**\n" +
                "Le serveur Minecraft va démarrer."
            );

            return;
        }

        if (
            data.error &&
            data.error.code === "ad_required"
        ) {
            const actionUrl = data.error.action_url;

            if (actionUrl) {
                const button = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("📺 Regarder la publicité")
                        .setStyle(ButtonStyle.Link)
                        .setURL(actionUrl)
                );

                await interaction.editReply({
                    content:
                        "📺 **Une publicité est nécessaire avant de démarrer le serveur.**\n\n" +
                        "1️⃣ Clique sur **Regarder la publicité**.\n" +
                        "2️⃣ Regarde la publicité.\n" +
                        "3️⃣ Reviens sur Discord et utilise **/start** à nouveau.",
                    components: [button]
                });

                return;
            }

            await interaction.editReply(
                "📺 Falix demande une publicité, mais aucun lien n'a été fourni."
            );

            return;
        }

        console.error("Erreur Falix :", data);

        const errorMessage =
            data.error && data.error.message
                ? data.error.message
                : "Erreur inconnue";

        await interaction.editReply(
            "❌ **Impossible de démarrer le serveur.**\n" +
            "Erreur : " +
            errorMessage
        );

    } catch (error) {
        console.error("Erreur de connexion :", error);

        await interaction.editReply(
            "❌ **Erreur lors de la connexion à Falix.**"
        );
    }
});

async function start() {
    await registerCommands();

    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error("Impossible de connecter le bot :", error);
    }
}

start();
