import { Container } from "brandi";
import { REDIS_CLIENT_TOKEN, RedisClient } from "./client";
import { TAKEN_USER_NAME_CACHE_DM_TOKEN, TakenUsernameCacheDMImpl } from "./taken_user_name";
import { TOKEN_PUBLIC_KEY_CACHE_DM_TOKEN, TokenPublicKeyCacheDMImpl } from "./token_public_key";

export * from "./client";
export * from "./taken_user_name";
export * from "./token_public_key";

export function bindToContainer(container: Container) {
    container.bind(REDIS_CLIENT_TOKEN).toInstance(RedisClient).inSingletonScope();
    container.bind(TOKEN_PUBLIC_KEY_CACHE_DM_TOKEN).toInstance(TokenPublicKeyCacheDMImpl).inSingletonScope();
    container.bind(TAKEN_USER_NAME_CACHE_DM_TOKEN).toInstance(TakenUsernameCacheDMImpl).inSingletonScope();
}