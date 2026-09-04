const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
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

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function startBot() {
    try {
        console.log("Enregistrement de la commande /start...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("Commande /start enregistrée !");
    } catch (error) {
        console.error(error);
    }
}

client.once("ready", () => {
    console.log(`🤖 Connecté en tant que ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "start") {
        await interaction.deferReply();

        try {
            const response = await fetch(
                `https://client.falixnodes.net/api/v2/servers/${SERVER_ID}/power`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.FALIX_API_KEY}`,
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
                    "🟢 **Demande de démarrage envoyée !**\nLe serveur Minecraft va démarrer."
                );
            } else if (data.error?.code === "ad_required") {
                await interaction.editReply(
                    "📺 **Falix demande de regarder une publicité avant de démarrer le serveur.**"
                );
            } else {
                console.error(data);

                await interaction.editReply(
                    `❌ Impossible de démarrer le serveur.\nErreur : \`${data.error?.message || "Erreur inconnue"}\``
                );
            }
        } catch (error) {
            console.error(error);

            await interaction.editReply(
                "❌ Une erreur est survenue lors de la connexion à Falix."
            );
        }
    }
});

startBot();
client.login(process.env.DISCORD_TOKEN);
