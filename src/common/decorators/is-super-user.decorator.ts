import { SetMetadata } from '@nestjs/common';

export const IS_SUPER_USER_KEY = 'isSuperUser';
export const IsSuperUser = () => SetMetadata(IS_SUPER_USER_KEY, true);
