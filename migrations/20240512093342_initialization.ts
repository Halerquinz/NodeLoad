import type { Knex } from "knex";

const TabNameUser = "user";
const TabNamePassword = "user_password";
const TabNameTokenPublicKey = "token_public_key";
const TabNameBlackListedToken = "blacklisted_token";
const TabNameDownloadTask = "download_task";

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(TabNameUser))) {
        await knex.schema.createTable(TabNameUser, (table) => {
            table.increments("user_id", { primaryKey: true });
            table.string('username', 64).notNullable().unique();
            table.string('display_name', 256).notNullable();

            table.index(["username"], "user_username_idx");
            table.index(["display_name"], "user_display_name_idx");
        });
    }

    if (!(await knex.schema.hasTable(TabNamePassword))) {
        await knex.schema.createTable(TabNamePassword, (table) => {
            table.integer("of_user_id");
            table.string('hash', 256).notNullable();

            table.primary(["of_user_id"]);
            table.foreign("of_user_id").references("user_id").inTable(TabNameUser);
        });
    }

    if (!(await knex.schema.hasTable(TabNameTokenPublicKey))) {
        await knex.schema.createTable(TabNameTokenPublicKey, (table) => {
            table.increments("public_key_id", { primaryKey: true });
            table.text("data").notNullable();
        });
    }

    if (!(await knex.schema.hasTable(TabNameBlackListedToken))) {
        await knex.schema.createTable(TabNameBlackListedToken, (table) => {
            table.bigInteger("token_id").notNullable();
            table.bigInteger("expire_at").notNullable();

            table.primary(["token_id"]);
            table.index(
                ["expire_at"],
                "user_blacklisted_token_expire_idx"
            );
        });
    }

    if (!(await knex.schema.hasTable(TabNameDownloadTask))) {
        await knex.schema.createTable(TabNameDownloadTask, (table) => {
            table.increments("download_task_id", { primaryKey: true });
            table.integer("of_user_id");

            table.smallint("download_type").notNullable();
            table.smallint("download_status").notNullable();
            table.text("url").notNullable();
            table.text("metadata").notNullable();

            table.foreign("of_user_id").references("user_id").inTable(TabNameUser);
        });
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists(TabNameUser);
    await knex.schema.dropTableIfExists(TabNamePassword);
    await knex.schema.dropTableIfExists(TabNameBlackListedToken);
    await knex.schema.dropTableIfExists(TabNameTokenPublicKey);
    await knex.schema.dropTableIfExists(TabNameDownloadTask);
}

