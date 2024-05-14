import { Container } from "brandi";

import * as password from "./password";
import * as token from "./token";
import * as user from "./user";

export function bindToContainer(container: Container): void {
    password.bindToContainer(container);
    token.bindToContainer(container);
    user.bindToContainer(container);
}