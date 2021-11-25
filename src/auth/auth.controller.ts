import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CustomApiHeaders } from '@shared/decorators';
import { UserType } from '@shared/enums';
import { BadRequestError } from '@shared/errors';
import { AdminResetPasswordInput, ChangePasswordInput, ForgetPasswordInput, LoginCredentialDto, RefreshTokenDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@CustomApiHeaders()
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly commandBus: CommandBus) {}

    @Post('admin/login')
    async adminLogin(@Body() input: LoginCredentialDto) {
        return this.authService.login(UserType.ADMIN, input);
    }

    @Post('admin/refresh-token')
    @HttpCode(HttpStatus.OK)
    async adminRefreshToken(@Body() input: RefreshTokenDto) {
        return this.refreshAccessToken(UserType.ADMIN, input);
    }

    @Post('admin/change-password')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async adminChangePassword(@CurrentUser('sub') id: string, @Body() input: ChangePasswordInput) {
        return this.changePassword(UserType.ADMIN, id, input);
    }

    @Post('admin/forget-password')
    async adminForgetPassword(@Body() input: ForgetPasswordInput) {
        return this.forgetPassword(UserType.ADMIN, input);
    }

    @Post('admin/reset-password')
    async adminResetPassword(@Body() input: AdminResetPasswordInput) {
        const user = await this.authService.resetPasswordByToken(input.token, input.password);
        return { success: user ? true : false };
    }

    @Get('me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async me(@CurrentUser() user: { sub: string; aud: string }): Promise<any> {
        if (!user || !user.sub) {
            throw new BadRequestError();
        }
        return this.authService.getCurrentUser(user.aud.toUpperCase() as UserType, user.sub);
    }

    @Get('permissions')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async permissions(@CurrentUser() user: { sub: string; aud: string }): Promise<any> {
        return this.authService.getAdminPermission(user.aud.toUpperCase() as UserType, user.sub);
    }

    private async refreshAccessToken(userType: UserType, input: RefreshTokenDto) {
        return this.authService.refreshAccessToken(userType, input.refreshToken);
    }

    async changePassword(userType: UserType, userId: string, input: ChangePasswordInput) {
        const result = await this.authService.updatePassword(userType, userId, input.currentPassword, input.newPassword);
        return { success: result };
    }

    async forgetPassword(userType: UserType, input: ForgetPasswordInput) {
        const user = await this.authService.setPasswordResetToken(userType, input.username);
        if (user) {
            return { success: true };
        }
        return { success: false };
    }
}
