import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../permissions/role-permissions';

export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
