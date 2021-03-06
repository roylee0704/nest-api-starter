import { Exclude } from 'class-transformer';
import { IsDefined } from 'class-validator';
import { Entity, DeepPartial, Column, Unique } from 'typeorm';
import { AbstractEntity } from '@shared/entities/abstract.entity';
import { UserType } from '@shared/enums';
import { GeneralStatus } from '@shared/enums/general-status';

@Entity({ name: 'user_logins' })
@Unique(['userId', 'userType'])
@Unique(['username', 'userType', 'deletionToken'])
@Unique(['secondaryUsername', 'userType', 'deletionToken'])
export class UserLogin extends AbstractEntity {
    constructor(input?: DeepPartial<UserLogin>) {
        super(input);
    }

    @Column({
        name: 'user_type',
        type: 'enum',
        enum: UserType,
    })
    @IsDefined({ always: true })
    userType: UserType;

    @Column()
    userId: string;

    @Column()
    username: string;

    @Column({ nullable: true })
    secondaryUsername?: string;

    @Column()
    @Exclude()
    passwordHash: string;

    @Column({ default: true })
    isVerified: boolean;

    @Column({ default: false })
    isLogin: boolean;

    @Column({ type: 'varchar', nullable: true })
    @Exclude()
    verificationToken?: string;

    @Column({ type: 'varchar', nullable: true })
    @Exclude()
    passwordResetToken?: string;

    @Column({ type: 'varchar', default: 'N/A' })
    @Exclude()
    deletionToken: string;

    @Column('simple-array', { nullable: true })
    groups: string[];

    @Column({
        name: 'general_status',
        type: 'enum',
        enum: GeneralStatus,
        default: GeneralStatus.ACTIVE,
    })
    generalStatus: GeneralStatus;
}
