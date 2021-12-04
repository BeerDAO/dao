import "dotenv/config";

interface ENV {
    BOT_TOKEN: string | undefined;
    CLIENT_ID: string | undefined;
    GUILD_ID: string | undefined;
}

interface Config {
    BOT_TOKEN: string;
    CLIENT_ID: string;
    GUILD_ID: string;
}

const getConfig = (): ENV => {
    return {
        BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
        CLIENT_ID: process.env.DISCORD_CLIENT_ID,
        GUILD_ID: process.env.DISCORD_GUILD_ID,
    };
};

const getSanitzedConfig = (config: ENV): Config => {
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined) {
            throw new Error(`Missing key ${key} in config.env`);
        }
    }
    return config as Config;
};

const config = getConfig();
const sanitizedConfig = getSanitzedConfig(config);
export default sanitizedConfig;