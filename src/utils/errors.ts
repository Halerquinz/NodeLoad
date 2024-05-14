export class ErrorWithHTTPCode extends Error {
    constructor(public readonly message: string, public readonly code: number) {
        super(message);
    }

    public static wrapWithStatus(error: any, code: number): ErrorWithHTTPCode {
        if (error instanceof Error) {
            return new ErrorWithHTTPCode(error.message, code);
        }
        return new ErrorWithHTTPCode(JSON.stringify(error), code);
    }
}
