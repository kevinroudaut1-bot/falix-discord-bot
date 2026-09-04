js
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

// Commande Discord
const commands = [
    new SlashCommandBuilder()
        .setName("start")
        .setDescription("Démarre le serveur Minecraft")
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// Enregistrement de la commande
async function startBot() {
    try {
        console.log("Enregistrement de la commande /start...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("Commande /start enregistrée !");
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de /start :", error);
    }
}

// Bot prêt
client.once("ready", () => {
    console.log("Bot connecté en tant que " + client.user.tag);
});

// Gestion des commandes
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "start") {
        await interaction.deferReply();

        try {
            const response = await fetch(
                "https://client.falixnodes.net/api/v2/servers/" + SERVER_ID + "/power",
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

            // Serveur démarré
            if (response.ok) {
                await interaction.editReply(
                    "🟢 Demande de démarrage envoyée !\nLe serveur Minecraft va démarrer."
                );
            }

            // Falix demande une publicité
            else if (data.error && data.error.code === "ad_required") {
                const actionUrl = data.error.action_url;

                if (actionUrl) {
                    const button = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Regarder la publicité")
                            .setStyle(ButtonStyle.Link)
                            .setURL(actionUrl)
                    );

                    await interaction.editReply({
                        content:
                            "📺 Une publicité est nécessaire avant de démarrer le serveur.\n\n" +
                            "1. Clique sur **Regarder la publicité**.\n" +
                            "2. Regarde la publicité demandée par Falix.\n" +
                            "3. Reviens sur Discord et utilise **/start** à nouveau.",
                        components: [button]
                    });
                } else {
                    await interaction.editReply(
                        "📺 Falix demande une publicité, mais aucun lien n'a été fourni."
                    );
                }
            }

            // Autre erreur Falix
            else {
                console.error("Erreur Falix :", data);

                const message =
                    data.error && data.error.message
                        ? data.error.message
                        : "Erreur inconnue";

                await interaction.editReply(
                    "❌ Impossible de démarrer le serveur.\nErreur : " + message
                );
            }

        } catch (error) {
            console.error("Erreur :", error);

            await interaction.editReply(
                "❌ Une erreur est survenue lors de la connexion à Falix."
            );
        }
    }
});

// Démarrage du bot
startBot();

client.login(process.env.DISCORD_TOKEN);
