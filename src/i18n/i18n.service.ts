import * as path from 'path';
import { Injectable, OnModuleInit, HttpException } from '@nestjs/common';
import { Handler, Request } from 'express';
import { TFunction } from 'i18next';
import * as i18nextIndex from 'i18next';
import * as i18nextMiddleware from 'i18next-http-middleware';
import * as ICU from 'i18next-icu';
import * as Backend from 'i18next-node-fs-backend';
import { LanguageCode } from '@shared/enums';
import { I18nError } from 'i18n/i18n-error';

export interface I18nRequest extends Request {
    t: TFunction;
}

/**
 * This service is responsible for translating messages from the server before they reach the client.
 * The `i18next-express-middleware` middleware detects the client's preferred language based on
 * the `Accept-Language` header or "lang" query param and adds language-specific translation
 * functions to the Express request / response objects.
 */
@Injectable()
export class I18nService implements OnModuleInit {
    onModuleInit() {
        return i18nextIndex
            .use(i18nextMiddleware.LanguageDetector)
            .use(Backend)
            .use(ICU as any)
            .init({
                preload: [LanguageCode.En],
                fallbackLng: LanguageCode.En,
                detection: {
                    lookupQuerystring: 'lang',
                },
                backend: {
                    loadPath: path.join(__dirname, 'locales/{{lng}}.json'),
                    jsonIndent: 2,
                },
            });
    }

    handle(): Handler {
        return i18nextMiddleware.handle(i18nextIndex as any);
    }

    /**
     * Translates the originalError if it is an instance of I18nError.
     */
    translateError(req: I18nRequest, error: HttpException | Error) {
        const originalError = error;
        const t: TFunction = req.t;

        if (t && originalError instanceof I18nError) {
            let translation = originalError.message;
            try {
                translation = t(originalError.message, originalError.variables);
            } catch (e) {
                translation += ` (Translation format error: ${e.message})`;
            }
            error.message = translation;
            // We can now safely remove the variables object so that they do not appear in
            // the error returned by the GraphQL API
            delete originalError.variables;
        }

        return error;
    }
}
