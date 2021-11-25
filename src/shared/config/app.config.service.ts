/* eslint-disable max-len */
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService, NoInferType } from '@nestjs/config';
import { ConnectionOptions } from 'typeorm';
import { AppConfig, AuthOptions } from '@shared/interfaces';
import { DefaultLogger } from '@shared/logger/default.logger';
import { Logger as AppLogger, LogLevel } from '@shared/logger/logger.interface';
import { SnakeNamingStrategy } from '@shared/typeorm/snake-naming-strategy';
import { isDevMode, environment } from '../../app.environment';
import { LanguageCode } from '../enums';
import { DefaultConfiguration } from './default-config';

@Injectable()
export class AppConfigService implements AppConfig {
    private activeConfig: AppConfig;
    constructor(private configService: ConfigService) {
        this.activeConfig = Object.assign(DefaultConfiguration, {
            authOptions: {
                jwtSecretKey: this.configService.get('JWT_SECRET_KEY'),
                jwtTokenExpirationTime: configService.get<number>('JWT_TOKEN_EXPIRATION_TIME'),
                jwtRefreshTokenExpirationTime: DefaultConfiguration.authOptions.jwtTokenExpirationTime,
                verificationTokenDuration: DefaultConfiguration.authOptions.verificationTokenDuration,
            },
        } as AppConfig);
    }

    get nodeEnv(): string {
        return environment;
    }

    get appKey(): string {
        return this.activeConfig.appKey;
    }

    get apiBasePath(): string {
        return this.configService.get<string>('API_BASE_PATH') || this.activeConfig.apiBasePath;
    }

    get port(): number {
        return this.configService.get<number>('PORT') || this.activeConfig.port;
    }

    get authOptions(): AuthOptions {
        return this.activeConfig.authOptions;
    }

    get cors(): CorsOptions {
        return this.activeConfig.cors;
    }

    get dbConnectionOption(): ConnectionOptions {
        return {
            ...this.activeConfig.dbConnectionOption,
            type: 'postgres',
            host: this.get<string>('DB_HOST'),
            port: this.get<number>('DB_PORT'),
            username: this.get('DB_USERNAME'),
            password: this.get('DB_PASSWORD'),
            database: this.get<string>('DB_DATABASE'),
            entities: [path.join(__dirname + '/../../**/*.entity{.ts,.js}')],
            migrations: [path.join(__dirname + '/../../database/migrations/*{.ts,.js}')],
            migrationsRun: isDevMode,
            logging: this.get<string>('DB_LOGGING') === 'true',
            synchronize: this.get<string>('DB_SYNCHRONIZE') === 'true',
            subscribers: [],
            namingStrategy: new SnakeNamingStrategy(),
        };
    }

    get defaultLanguageCode(): LanguageCode {
        return this.activeConfig.defaultLanguageCode;
    }

    get defaultLogLevel(): LogLevel {
        if (process.env.DEFAULT_LOG_LEVEL) {
            return +process.env.DEFAULT_LOG_LEVEL as LogLevel;
        }
        return this.activeConfig.defaultLogLevel;
    }

    get logger(): AppLogger {
        return new DefaultLogger({ level: this.defaultLogLevel });
    }

    get current(): AppConfig {
        return this.activeConfig;
    }

    get timezoneOffset(): number {
        return +process.env.TIMEZONE_OFFSET || this.activeConfig.timezoneOffset;
    }

    get<T = any>(propertyPath: string, defaultValue?: NoInferType<T>): T | undefined {
        return this.configService.get<T>(propertyPath, defaultValue);
    }
}
